const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const path = require('path');

// Usar el plugin stealth
puppeteer.use(StealthPlugin());

let browser;
let page;

// Sistema de cola para mensajes
class MessageQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
  }

  // Agregar mensaje a la cola
  enqueue(username, message) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        username,
        message,
        resolve,
        reject,
        timestamp: Date.now()
      });

      console.log(`📬 Mensaje agregado a la cola para ${username}. Cola actual: ${this.queue.length} mensajes`);

      // Procesar la cola si no está siendo procesada
      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  // Procesar la cola de mensajes
  async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;
    console.log(`🔄 Iniciando procesamiento de cola con ${this.queue.length} mensajes`);

    while (this.queue.length > 0) {
      const messageRequest = this.queue.shift();
      const { username, message, resolve, reject } = messageRequest;

      try {
        console.log(`📤 Procesando mensaje para ${username}: "${message}"`);
        await _sendMessage(username, message);
        console.log(`✅ Mensaje enviado exitosamente a ${username}`);
        resolve({ success: true });

        // Esperar un poco entre mensajes para evitar spam
        if (this.queue.length > 0) {
          console.log(`⏱️ Esperando 2 segundos antes del siguiente mensaje...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

      } catch (error) {
        console.error(`❌ Error enviando mensaje a ${username}:`, error.message);
        reject(error);
      }
    }

    this.processing = false;
    console.log(`✅ Procesamiento de cola completado`);
  }

  // Obtener estado de la cola
  getStatus() {
    return {
      queueLength: this.queue.length,
      processing: this.processing
    };
  }

  // Limpiar la cola
  clear() {
    const clearedCount = this.queue.length;
    this.queue.forEach(request => {
      request.reject(new Error('Cola limpiada'));
    });
    this.queue = [];
    console.log(`🧹 Cola limpiada. ${clearedCount} mensajes descartados`);
    return clearedCount;
  }
}

// Instancia global de la cola
const messageQueue = new MessageQueue();

// Configuración de entorno
const HEADLESS_MODE = process.env.TIKTOK_HEADLESS === 'true' || false;
const AUTO_START = process.env.TIKTOK_AUTO_START === 'true' || true;

async function startBrowser(cookies = null, headless = HEADLESS_MODE) {
  try {
    const launchOptions = {
      headless: headless ? 'new' : false,
      defaultViewport: headless ? { width: 1920, height: 1080 } : null,
      args: headless ? 
        ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] :
        ['--start-maximized']
    };

    console.log(`Iniciando navegador en modo ${headless ? 'headless' : 'visual'}...`);
    browser = await puppeteer.launch(launchOptions);
    
    page = await browser.newPage();
    
    // Cookies hardcodeadas para TikTok
    const hardcodedCookies = [
      {"name": "sessionid", "value": "10aebceb078e76f4a89c67093f2421ed", "domain": ".tiktok.com"},
      {"name": "tt_csrf_token", "value": "q7QxSTHM-fykQRaMMac_amnkG44fYHlbmDW4", "domain": ".tiktok.com"},
      {"name": "ttwid", "value": "1%7CatWrItivAVBwkAvdno-GcEHfLE-03SQ0i_vdyEH-Tx8%7C1757606365%7C6770a934734c021ae5e5fb8f982b5b31f5bb6475ce1b8f2247a60d6780ac5704", "domain": ".tiktok.com"},
      {"name": "msToken", "value": "nIIbdRqE82WwXU9M3z_UGfvwWL5kThGg644xy7ArDDw5eJD5Yw7CC3sZoECYBC44dlVrmwxxk_gG-sA8zuVakXz0elZ1uQWJPs-J5bcgJ5g5clm2PYAv5I5VOD582-B_20SnBWC4d7S6bAtgHzE9CRN2", "domain": ".tiktok.com"}
    ];
    
    // Ir a TikTok para establecer contexto
    await page.goto('https://www.tiktok.com', { waitUntil: 'networkidle2' });
    
    // Configurar cookies
    const cookiesToUse = cookies || hardcodedCookies;
    await page.setCookie(...cookiesToUse);
    console.log('Cookies de TikTok configuradas.');
    
    // Recargar para aplicar cookies
    await page.reload({ waitUntil: 'networkidle2' });
    console.log('Navegador iniciado con TikTok y cookies aplicadas. Deberías estar logueado.');
  } catch (error) {
    console.error('Error detallado al lanzar el navegador:', error);
    throw error;
  }
}

async function setCookies(cookiesData) {
  if (!browser || !page) {
    throw new Error('El navegador no ha sido iniciado.');
  }
  
  try {
    await page.setCookie(...cookiesData);
    await page.reload({ waitUntil: 'networkidle2' });
    console.log('Cookies aplicadas y página recargada.');
  } catch (error) {
    console.error('Error al configurar cookies:', error);
    throw error;
  }
}


// Función para encontrar la vocal menos representada
function findLeastRepresentedVowel(phrase, revealedLetters) {
  const vowels = ['A', 'E', 'I', 'O', 'U'];
  const phraseUpper = phrase.toUpperCase();
  const revealedUpper = revealedLetters.map(l => l.toUpperCase());
  
  // Contar frecuencia de cada vocal en la frase
  const vowelCounts = {};
  vowels.forEach(vowel => {
    vowelCounts[vowel] = (phraseUpper.match(new RegExp(vowel, 'g')) || []).length;
  });
  
  // Filtrar vocales que no están reveladas y existen en la frase
  const availableVowels = vowels.filter(vowel => 
    vowelCounts[vowel] > 0 && !revealedUpper.includes(vowel)
  );
  
  if (availableVowels.length === 0) return null;
  
  // Encontrar la menos representada
  return availableVowels.reduce((least, current) => 
    vowelCounts[current] < vowelCounts[least] ? current : least
  );
}

// Función para encontrar la consonante menos representada
function findLeastRepresentedConsonant(phrase, revealedLetters) {
  const consonants = 'BCDFGHJKLMNPQRSTVWXYZ'.split('');
  const phraseUpper = phrase.toUpperCase();
  const revealedUpper = revealedLetters.map(l => l.toUpperCase());
  
  // Contar frecuencia de cada consonante en la frase
  const consonantCounts = {};
  consonants.forEach(consonant => {
    consonantCounts[consonant] = (phraseUpper.match(new RegExp(consonant, 'g')) || []).length;
  });
  
  // Filtrar consonantes que no están reveladas y existen en la frase
  const availableConsonants = consonants.filter(consonant => 
    consonantCounts[consonant] > 0 && !revealedUpper.includes(consonant)
  );
  
  if (availableConsonants.length === 0) return null;
  
  // Encontrar la menos representada
  return availableConsonants.reduce((least, current) => 
    consonantCounts[current] < consonantCounts[least] ? current : least
  );
}

// Función para generar el estado visual de la frase
function generatePhraseState(phrase, revealedLetters, newLetter) {
  const phraseUpper = phrase.toUpperCase();
  const allRevealed = [...revealedLetters.map(l => l.toUpperCase()), newLetter];
  
  return phraseUpper.split('').map(char => {
    if (char === ' ') return ' ';
    if (allRevealed.includes(char)) return char;
    return '_';
  }).join(' ');
}

// Función para generar mensaje premium con formato mejorado (una sola línea)
function generatePremiumMessage(type, username, letter, phraseState, category) {
  const typeText = type === 'vowel' ? 'VOCAL' : 'CONSONANTE';

  // Formato mejorado con separadores visuales y destacado de la compra
  const premiumMessage = `✨💎═══ COMPRA PREMIUM ═══💎✨ ⚡ ¡COMPRASTE ${typeText} ⟨ ${letter} ⟩! ⚡ ═══ 📝 TU AYUDA: ${phraseState} ═══ 🏷️ ${category} ═══ 💝 ¡ÚSALA PARA RESOLVER! 💝`;

  return premiumMessage;
}

// Función para verificar si el navegador está activo
function isBrowserActive() {
  return browser && page && !browser.disconnected;
}

// Función para auto-iniciar el navegador si está configurado
async function autoStartBrowser() {
  if (AUTO_START && !isBrowserActive()) {
    try {
      console.log('🚀 Auto-iniciando navegador TikTok...');
      await startBrowser();
      console.log('✅ Navegador TikTok iniciado automáticamente');
    } catch (error) {
      console.error('❌ Error auto-iniciando navegador:', error.message);
    }
  }
}

// Función para intentar reconectar si el navegador está caído
async function ensureBrowserActive() {
  if (!isBrowserActive()) {
    console.log('🔄 Navegador no activo, intentando reconectar...');
    await autoStartBrowser();
  }
  return isBrowserActive();
}

// Función interna original de sendMessage
async function _sendMessage(username, message) {
  if (!browser || !page) {
    throw new Error('El navegador no ha sido iniciado. Por favor, inicie sesión primero.');
  }

  try {
    const profileUrl = `https://www.tiktok.com/@${username}`;
    await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
    console.log(`Navegando a ${profileUrl}`);

    // Buscar el botón de mensaje usando múltiples selectores
    const messageSelectors = [
      'div[data-e2e="user-message"] button',
      'button[data-e2e="message-button"]',
      'div.jsx-2859388920.user-button button',
      'div[data-e2e="dm-btn"] button',
      '.jsx-1888318027 button:nth-of-type(2)',
      'div[data-e2e="user-message"]'
    ];

    let messageButton = null;
    
    // Primero intentar encontrar inmediatamente (más rápido)
    for (const selector of messageSelectors) {
      messageButton = await page.$(selector);
      if (messageButton) break;
    }
    
    // Si no encontró nada, esperar un poco más
    if (!messageButton) {
      for (const selector of messageSelectors) {
        try {
          messageButton = await page.waitForSelector(selector, { timeout: 1500 });
          if (messageButton) break;
        } catch (e) {
          continue;
        }
      }
    }

    if (!messageButton) {
      throw new Error('No se encontró el botón de mensaje en el perfil');
    }

    await messageButton.click();
    console.log('Botón de mensaje encontrado y clickeado.');

    // Pequeña espera para que TikTok abra la ventana de mensaje
    await new Promise(resolve => setTimeout(resolve, 500));

    // Esperar a que aparezca el área de mensaje
    const messageAreaSelectors = [
      'div[data-e2e="chat-input"]',
      'div[data-testid="tce-composer-input"]',
      'div[role="textbox"]',
      '.public-DraftEditor-content',
      'div.public-DraftStyleDefault-block',
      '.notranslate.public-DraftEditor-content'
    ];

    let messageArea = null;
    
    // Primero intentar encontrar inmediatamente
    for (const selector of messageAreaSelectors) {
      messageArea = await page.$(selector);
      if (messageArea) break;
    }
    
    // Si no encontró, esperar poco tiempo
    if (!messageArea) {
      for (const selector of messageAreaSelectors) {
        try {
          messageArea = await page.waitForSelector(selector, { timeout: 2000 });
          if (messageArea) break;
        } catch (e) {
          continue;
        }
      }
    }

    if (!messageArea) {
      throw new Error('No se encontró el área de mensaje después de hacer clic');
    }

    console.log('Área de mensaje encontrada.');

    // Hacer clic en el editor para enfocarlo
    await messageArea.click();
    console.log('Editor de mensaje enfocado.');

    // Escribir el mensaje
    await page.keyboard.type(message);
    console.log(`Mensaje "${message}" escrito.`);

    // Enviar el mensaje con Enter
    await page.keyboard.press('Enter');
    console.log('Mensaje enviado con Enter.');

    console.log(`Mensaje enviado a ${username}`);

  } catch (error) {
    console.error('Error detallado enviando mensaje:', error);
    throw error;
  }
}

// Wrapper público con auto-reconexión y cola
async function sendMessage(username, message) {
  // Intentar reconectar si es necesario
  const isActive = await ensureBrowserActive();
  if (!isActive) {
    throw new Error('No se pudo inicializar el navegador. Verifica la configuración.');
  }

  // Usar la cola para enviar el mensaje
  return messageQueue.enqueue(username, message);
}

module.exports = {
  startBrowser,
  sendMessage,
  setCookies,
  findLeastRepresentedVowel,
  findLeastRepresentedConsonant,
  generatePhraseState,
  generatePremiumMessage,
  isBrowserActive,
  autoStartBrowser,
  ensureBrowserActive,
  messageQueue
};