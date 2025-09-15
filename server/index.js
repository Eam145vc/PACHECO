require('dotenv').config();
const express = require('express');
const path = require('path');
const database = require('./database');
const tiktokLiveManager = require('./tiktokLiveManager');

const app = express();
const PORT = process.env.PORT || 3002;
const isProduction = process.env.NODE_ENV === 'production';

// CORS middleware para permitir requests del frontend
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Middleware para parsear JSON y formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
if (isProduction) {
  // En producción, servir el frontend compilado
  app.use(express.static(path.join(__dirname, '../dist')));
} else {
  // En desarrollo, servir archivos públicos del servidor
  app.use(express.static(path.join(__dirname, 'public')));
}

app.post('/login', async (req, res) => {
  try {
    // Aquí puedes agregar la lógica para manejar el inicio de sesión
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Endpoint de prueba
const { 
  startBrowser, 
  sendMessage, 
  setCookies, 
  findLeastRepresentedVowel,
  findLeastRepresentedConsonant,
  generatePhraseState,
  generatePremiumMessage,
  autoStartBrowser
} = require('./sendMessage');

app.post('/start-login', async (req, res) => {
  console.log('Solicitud recibida en /start-login');
  try {
    await startBrowser();
    res.json({ success: true, message: 'Navegador iniciado para inicio de sesión manual.' });
  } catch (error) {
    console.error('Error al iniciar el navegador:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/set-cookies', async (req, res) => {
  const { cookies } = req.body;
  if (!cookies) {
    return res.status(400).json({ success: false, message: 'Cookies son requeridas.' });
  }
  try {
    await setCookies(cookies);
    res.json({ success: true, message: 'Cookies configuradas correctamente.' });
  } catch (error) {
    console.error('Error en el endpoint /set-cookies:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/purchase-vowel', async (req, res) => {
  const { phrase, revealedLetters, category, username } = req.body;
  if (!phrase || !revealedLetters || !category || !username) {
    return res.status(400).json({ 
      success: false, 
      message: 'phrase, revealedLetters, category, username son requeridos.' 
    });
  }
  
  try {
    const vowel = findLeastRepresentedVowel(phrase, revealedLetters);
    if (!vowel) {
      return res.status(400).json({ success: false, message: 'No hay vocales disponibles.' });
    }
    
    const phraseState = generatePhraseState(phrase, revealedLetters, vowel);
    const premiumMessage = generatePremiumMessage('vowel', username, vowel, phraseState, category);
    
    // Por ahora guardamos el mensaje, luego se implementará el detector automático de TikTok
    console.log('MENSAJE PREMIUM GENERADO:', premiumMessage);
    console.log('USUARIO QUE COMPRÓ:', username);
    
    res.json({ 
      success: true, 
      message: 'Vocal procesada exitosamente.', 
      letter: vowel,
      phraseState: phraseState,
      premiumMessage: premiumMessage
    });
  } catch (error) {
    console.error('Error en /purchase-vowel:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/purchase-consonant', async (req, res) => {
  const { phrase, revealedLetters, category, username } = req.body;
  if (!phrase || !revealedLetters || !category || !username) {
    return res.status(400).json({ 
      success: false, 
      message: 'phrase, revealedLetters, category, username son requeridos.' 
    });
  }
  
  try {
    const consonant = findLeastRepresentedConsonant(phrase, revealedLetters);
    if (!consonant) {
      return res.status(400).json({ success: false, message: 'No hay consonantes disponibles.' });
    }
    
    const phraseState = generatePhraseState(phrase, revealedLetters, consonant);
    const premiumMessage = generatePremiumMessage('consonant', username, consonant, phraseState, category);
    
    console.log('MENSAJE PREMIUM GENERADO:', premiumMessage);
    console.log('USUARIO QUE COMPRÓ:', username);
    res.json({ 
      success: true, 
      message: 'Consonante enviada exitosamente.', 
      letter: consonant,
      phraseState: phraseState
    });
  } catch (error) {
    console.error('Error en /purchase-consonant:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/purchase-hint', async (req, res) => {
  const { phrase, category, username } = req.body;
  if (!phrase || !category || !username) {
    return res.status(400).json({ 
      success: false, 
      message: 'phrase, category, username son requeridos.' 
    });
  }
  
  try {
    // Placeholder para el sistema de pistas
    const hintMessage = `🎁 @${username} compró PISTA: "${category}" - Implementar pistas personalizadas aquí 💎`;
    
    console.log('MENSAJE PREMIUM GENERADO:', hintMessage);
    console.log('USUARIO QUE COMPRÓ:', username);
    res.json({ 
      success: true, 
      message: 'Pista enviada exitosamente (placeholder).'
    });
  } catch (error) {
    console.error('Error en /purchase-hint:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/send-message', async (req, res) => {
  const { username, message } = req.body;
  if (!username || !message) {
    return res.status(400).json({ success: false, message: 'Usuario y mensaje son requeridos.' });
  }
  try {
    await sendMessage(username, message);
    res.json({ success: true, message: 'Proceso de envío de mensaje iniciado.' });
  } catch (error) {
    console.error('Error en el endpoint /send-message:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===============================
// ENDPOINTS SISTEMA DE ÓRDENES
// ===============================

// Obtener órdenes pendientes (admin)
app.get('/orders/pending', (req, res) => {
  try {
    const pendingOrders = database.getPendingOrders();
    res.json({ success: true, orders: pendingOrders });
  } catch (error) {
    console.error('Error al obtener órdenes pendientes:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtener todas las órdenes (admin)
app.get('/orders', (req, res) => {
  try {
    const orders = database.getOrders();
    res.json({ success: true, orders });
  } catch (error) {
    console.error('Error al obtener órdenes:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Fulfill una orden (admin)
app.post('/orders/:orderId/fulfill', async (req, res) => {
  const { orderId } = req.params;
  const { fulfillmentContent } = req.body;
  
  if (!fulfillmentContent) {
    return res.status(400).json({ success: false, message: 'Contenido de fulfillment es requerido.' });
  }

  try {
    const order = database.fulfillOrder(orderId, fulfillmentContent);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Orden no encontrada.' });
    }

    // Enviar el contenido via TikTok
    const { sendMessage } = require('./sendMessage');
    const message = `🎁 TU PEDIDO ESTÁ LISTO | Producto: ${order.productTitle} | ${fulfillmentContent}`;
    
    try {
      await sendMessage(order.username, message);
      res.json({ 
        success: true, 
        message: 'Orden fulfillada y enviada por TikTok exitosamente.',
        order
      });
    } catch (messageError) {
      console.error('Error enviando mensaje:', messageError);
      res.json({ 
        success: true, 
        message: 'Orden fulfillada (Error enviando por TikTok). Contenido guardado.',
        order,
        warning: 'No se pudo enviar por TikTok'
      });
    }

  } catch (error) {
    console.error('Error fulfillando orden:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===============================
// ENDPOINTS TIKTOK LIVE INTEGRATION
// ===============================

// Variable global para mantener el estado del servidor Python TikTok Live
let tiktokLiveStatus = {
  connected: false,
  streamer_username: null,
  room_id: null,
  last_update: null,
  lastWinner: null,
  currentGameCoronasReward: 5, // Corona reward for the current active game
  pendingReveals: [], // Queue of pending reveals to send to frontend
  // Estado del juego actual para triggers privados
  currentGamePhrase: null,
  currentGameAnswer: null,
  currentGameCategory: null,
  currentGameIsActive: false,
  // Cache de letras reveladas desde el frontend
  currentRevealedLetters: [],
  // Cache de hints de la frase actual
  currentGameHints: [],
  // Cache para manejar combos y evitar duplicados
  recentGifts: new Map(), // key: "username_giftid", value: { timestamp, quantity }
  // Contadores comunales para likes y follows
  communalCounters: {
    likes: 0,
    follows: 0
  }
};

// Variable global para almacenar los triggers de regalos configurados (7 triggers: 5 originales + 2 comunales extra)
let giftTriggers = [
  {
    id: '1',
    name: 'Trigger Revelar Vocal',
    giftId: 1,
    giftName: 'Rose',
    quantity: 10,
    action: 'reveal_vowel',
    enabled: true
  },
  {
    id: '2',
    name: 'Trigger Revelar Consonante',
    giftId: 2,
    giftName: 'Perfume',
    quantity: 5,
    action: 'reveal_consonant',
    enabled: true
  },
  {
    id: '3',
    name: 'Trigger Comprar Vocal',
    giftId: 3,
    giftName: 'Love Bang',
    quantity: 1,
    action: 'purchase_vowel',
    enabled: true
  },
  {
    id: '4',
    name: 'Trigger Comprar Consonante',
    giftId: 4,
    giftName: 'TikTok',
    quantity: 1,
    action: 'purchase_consonant',
    enabled: true
  },
  {
    id: '5',
    name: 'Trigger Comprar Pista',
    giftId: 5,
    giftName: 'Galaxy',
    quantity: 1,
    action: 'purchase_hint',
    enabled: true
  },
  {
    id: '6',
    name: 'Trigger Comunal Extra A',
    giftId: 'likes',
    giftName: 'Likes',
    quantity: 50,
    action: 'reveal_vowel',
    enabled: false
  },
  {
    id: '7',
    name: 'Trigger Comunal Extra B',
    giftId: 'follows',
    giftName: 'Follows',
    quantity: 10,
    action: 'reveal_consonant',
    enabled: false
  }
];

// Simple broadcast function (sin WebSockets por ahora)
function broadcastWinner(winner) {
  console.log('📢 [BROADCAST] Nuevo ganador disponible para consulta:', winner.username);
  // Por ahora solo almacenamos, el frontend hará polling
}

// Función para obtener letras reveladas actuales desde el cache del frontend
async function getRevealedLettersFromPython() {
  try {
    console.log('📡 [REVEALED LETTERS] Obteniendo letras reveladas del cache...');
    console.log('🔍 [REVEALED LETTERS] Letras reveladas actuales:', tiktokLiveStatus.currentRevealedLetters);

    // Devolver las letras reveladas guardadas en cache desde el frontend
    return tiktokLiveStatus.currentRevealedLetters || [];
  } catch (error) {
    console.error('❌ [REVEALED LETTERS] Error obteniendo letras reveladas:', error);
    return [];
  }
}

// Función para procesar eventos comunales (likes, follows)
async function processCommunalEvent(eventType, count, username) {
  console.log(`🌍 [COMUNAL ${eventType.toUpperCase()}] ${username} contribuyó con ${count} ${eventType}`);

  // Incrementar contador comunal
  tiktokLiveStatus.communalCounters[eventType] += count;
  const currentCount = tiktokLiveStatus.communalCounters[eventType];

  console.log(`📊 [COMUNAL ${eventType.toUpperCase()}] Total acumulado: ${currentCount}`);

  // Buscar triggers que usen este tipo de evento
  const communalTriggers = giftTriggers.filter(trigger =>
    trigger.enabled &&
    trigger.giftId === eventType &&
    currentCount >= trigger.quantity
  );

  if (communalTriggers.length > 0) {
    for (const trigger of communalTriggers) {
      console.log(`🎯 [TRIGGER COMUNAL] ¡META ALCANZADA! ${trigger.name} - ${eventType}: ${currentCount}/${trigger.quantity}`);

      try {
        // Ejecutar acción del trigger
        switch (trigger.action) {
          case 'reveal_vowel':
            console.log(`🔤 [TRIGGER COMUNAL] ¡META ALCANZADA! Revelando vocal automáticamente (${eventType} contribución de ${username})`);
            await executeRevealVowel();
            break;

          case 'reveal_consonant':
            console.log(`🔠 [TRIGGER COMUNAL] ¡META ALCANZADA! Revelando consonante automáticamente (${eventType} contribución de ${username})`);
            await executeRevealConsonant();
            break;

          default:
            console.log(`❓ [TRIGGER COMUNAL] Acción no soportada para trigger comunal: ${trigger.action}`);
        }

        // Resetear contador tras alcanzar objetivo
        tiktokLiveStatus.communalCounters[eventType] = 0;
        console.log(`🔄 [COMUNAL ${eventType.toUpperCase()}] Contador reseteado a 0 tras completar objetivo`);

      } catch (error) {
        console.error(`❌ [TRIGGER COMUNAL] Error ejecutando trigger "${trigger.name}":`, error);
      }
    }
  }
}

// Función para resetear contadores comunales
function resetCommunalCounters() {
  tiktokLiveStatus.communalCounters.likes = 0;
  tiktokLiveStatus.communalCounters.follows = 0;
  console.log('🔄 [COMUNAL] Contadores de likes y follows reseteados');
}

// Función para procesar triggers de regalos
async function processGiftTriggers(giftData) {
  const { username, unique_id, gift_id, gift_name, quantity } = giftData;

  console.log(`🎁 [GIFT TRIGGER] Procesando regalo: ${username} envió ${quantity}x ${gift_name} (ID: ${gift_id})`);

  // Manejar combos - deduplicar regalos recientes del mismo usuario y tipo
  const giftKey = `${username}_${gift_id}`;
  const now = Date.now();
  const recentGift = tiktokLiveStatus.recentGifts.get(giftKey);

  // Si es el mismo regalo del mismo usuario en los últimos 3 segundos, es combo
  if (recentGift && (now - recentGift.timestamp) < 3000) {
    // Actualizar cantidad acumulada
    recentGift.quantity += quantity;
    recentGift.timestamp = now;
    console.log(`🔄 [COMBO] Actualizando combo: ${username} ahora tiene ${recentGift.quantity}x ${gift_name} acumulado`);

    // Usar la cantidad acumulada para verificar triggers
    quantity = recentGift.quantity;
  } else {
    // Nuevo regalo o tiempo expirado, guardar en cache
    tiktokLiveStatus.recentGifts.set(giftKey, { timestamp: now, quantity });
    console.log(`🆕 [NEW GIFT] Nuevo regalo registrado: ${username} - ${quantity}x ${gift_name}`);
  }

  // Limpiar regalos viejos del cache (más de 10 segundos)
  for (const [key, gift] of tiktokLiveStatus.recentGifts.entries()) {
    if ((now - gift.timestamp) > 10000) {
      tiktokLiveStatus.recentGifts.delete(key);
    }
  }

  // Buscar triggers que coincidan
  // Buscar triggers que coincidan por ID o por nombre de regalo (excluyendo comunales)
  const matchingTriggers = giftTriggers.filter(trigger => {
    if (!trigger.enabled) return false;
    if (quantity < trigger.quantity) return false;

    // Excluir triggers comunales (likes, follows) del procesamiento de gifts
    if (trigger.giftId === 'likes' || trigger.giftId === 'follows') {
      return false;
    }

    // Coincidir por ID (para compatibilidad con triggers existentes)
    const matchById = trigger.giftId.toString() === gift_id.toString();

    // Coincidir por nombre (para manejar IDs reales de TikTok)
    const matchByName = trigger.giftName.toLowerCase() === gift_name.toLowerCase();

    return matchById || matchByName;
  });

  if (matchingTriggers.length === 0) {
    console.log(`🎁 [GIFT TRIGGER] No se encontraron triggers activos para regalo ID ${gift_id} con cantidad ${quantity}`);
    console.log(`🔍 [DEBUG] Triggers disponibles:`);
    giftTriggers.forEach(trigger => {
      const matchById = trigger.giftId.toString() === gift_id.toString();
      const matchByName = trigger.giftName.toLowerCase() === gift_name.toLowerCase();
      console.log(`   - ID: ${trigger.giftId}, Name: "${trigger.giftName}", Quantity: ${trigger.quantity}, Enabled: ${trigger.enabled}`);
      console.log(`     Match by ID: ${matchById}, Match by Name: ${matchByName}`);
    });
    console.log(`🔍 [DEBUG] Regalo recibido: ID=${gift_id}, Name="${gift_name}", Quantity=${quantity}`);
    return;
  }

  // Verificar si ya se ejecutó este trigger recientemente para evitar spam
  const executedTriggers = new Set();

  // Ejecutar cada trigger (solo una vez por combo)
  for (const trigger of matchingTriggers) {
    const triggerKey = `${trigger.id}_${trigger.action}`;

    // Evitar ejecutar el mismo trigger múltiples veces en un combo
    if (executedTriggers.has(triggerKey)) {
      console.log(`⏭️ [SKIP] Trigger "${trigger.name}" ya ejecutado en este combo, saltando`);
      continue;
    }

    executedTriggers.add(triggerKey);

    const isCommunal = trigger.action.startsWith('reveal_');
    if (isCommunal) {
      console.log(`🎯 [TRIGGER COMUNAL] Ejecutando "${trigger.name}" - Regalo de ${username} contribuyó a la meta (cantidad: ${quantity})`);
    } else {
      console.log(`🎯 [TRIGGER PRIVADO] Ejecutando "${trigger.name}" para usuario ${username} (cantidad: ${quantity})`);
    }

    try {
      switch (trigger.action) {
        case 'reveal_vowel':
          console.log(`🔤 [TRIGGER COMUNAL] ¡META ALCANZADA! Revelando vocal automáticamente (contribución de ${username})`);
          // NUEVO: Backend hace la revelación directamente
          await executeRevealVowel();
          break;

        case 'reveal_consonant':
          console.log(`🔠 [TRIGGER COMUNAL] ¡META ALCANZADA! Revelando consonante automáticamente (contribución de ${username})`);
          // NUEVO: Backend hace la revelación directamente
          await executeRevealConsonant();
          break;

        case 'purchase_vowel':
          console.log(`💎 [TRIGGER] Procesando compra de vocal para ${username}`);
          if (tiktokLiveStatus.currentGameIsActive && tiktokLiveStatus.currentGameAnswer) {
            try {
              // Obtener letras reveladas actuales desde el Python server
              const revealedLetters = await getRevealedLettersFromPython();

              // Llamar al endpoint de purchase-vowel
              const vowel = findLeastRepresentedVowel(tiktokLiveStatus.currentGameAnswer, revealedLetters);
              if (vowel) {
                const phraseState = generatePhraseState(tiktokLiveStatus.currentGameAnswer, revealedLetters, vowel);
                // Usar unique_id para el bot (que incluye @), pero mostrar username en logs
                const userForBot = unique_id || username; // Fallback a username si no hay unique_id
                const premiumMessage = generatePremiumMessage('vowel', userForBot, vowel, phraseState, tiktokLiveStatus.currentGameCategory);

                // Enviar mensaje automáticamente por TikTok usando unique_id
                await sendMessage(userForBot, premiumMessage);
                console.log(`✅ [TRIGGER] Vocal ${vowel} enviada a ${username} (ID: ${userForBot}): ${premiumMessage}`);
              } else {
                console.log(`❌ [TRIGGER] No hay vocales disponibles para ${username}`);
              }
            } catch (error) {
              console.error(`❌ [TRIGGER] Error procesando compra de vocal para ${username}:`, error);
            }
          } else {
            console.log(`⚠️ [TRIGGER] No hay juego activo para procesar compra de vocal de ${username}`);
          }
          break;

        case 'purchase_consonant':
          console.log(`💎 [TRIGGER] Procesando compra de consonante para ${username}`);
          if (tiktokLiveStatus.currentGameIsActive && tiktokLiveStatus.currentGameAnswer) {
            try {
              // Obtener letras reveladas actuales desde el Python server
              const revealedLetters = await getRevealedLettersFromPython();

              // Llamar al endpoint de purchase-consonant
              const consonant = findLeastRepresentedConsonant(tiktokLiveStatus.currentGameAnswer, revealedLetters);
              if (consonant) {
                const phraseState = generatePhraseState(tiktokLiveStatus.currentGameAnswer, revealedLetters, consonant);
                // Usar unique_id para el bot (que incluye @), pero mostrar username en logs
                const userForBot = unique_id || username; // Fallback a username si no hay unique_id
                const premiumMessage = generatePremiumMessage('consonant', userForBot, consonant, phraseState, tiktokLiveStatus.currentGameCategory);

                // Enviar mensaje automáticamente por TikTok usando unique_id
                await sendMessage(userForBot, premiumMessage);
                console.log(`✅ [TRIGGER] Consonante ${consonant} enviada a ${username} (ID: ${userForBot}): ${premiumMessage}`);
              } else {
                console.log(`❌ [TRIGGER] No hay consonantes disponibles para ${username}`);
              }
            } catch (error) {
              console.error(`❌ [TRIGGER] Error procesando compra de consonante para ${username}:`, error);
            }
          } else {
            console.log(`⚠️ [TRIGGER] No hay juego activo para procesar compra de consonante de ${username}`);
          }
          break;

        case 'purchase_hint':
          console.log(`💡 [TRIGGER] Procesando compra de pista para ${username}`);
          console.log(`🔍 [DEBUG] Estado del juego:`);
          console.log(`   - Juego activo: ${tiktokLiveStatus.currentGameIsActive}`);
          console.log(`   - Cantidad de hints: ${tiktokLiveStatus.currentGameHints.length}`);
          console.log(`   - Hints disponibles:`, tiktokLiveStatus.currentGameHints);
          console.log(`   - Categoría actual: ${tiktokLiveStatus.currentGameCategory}`);
          console.log(`   - Respuesta actual: ${tiktokLiveStatus.currentGameAnswer}`);

          if (tiktokLiveStatus.currentGameIsActive && tiktokLiveStatus.currentGameHints.length > 0) {
            try {
              // Seleccionar una pista aleatoria del cache
              const randomHintIndex = Math.floor(Math.random() * tiktokLiveStatus.currentGameHints.length);
              const selectedHint = tiktokLiveStatus.currentGameHints[randomHintIndex];

              // Generar mensaje de pista premium con formato mejorado
              const hintMessage = `✨💡═══ PISTA PREMIUM ═══💡✨ ⚡ ¡COMPRASTE UNA PISTA! ⚡ ═══ 🔍 TU PISTA: ⟨ ${selectedHint} ⟩ ═══ 📂 ${tiktokLiveStatus.currentGameCategory} ═══ 💝 ¡ÚSALA PARA RESOLVER! 💝`;

              // Usar unique_id para el bot (que incluye @), pero mostrar username en logs
              const userForBot = unique_id || username; // Fallback a username si no hay unique_id

              // Enviar mensaje automáticamente por TikTok usando unique_id
              await sendMessage(userForBot, hintMessage);
              console.log(`✅ [TRIGGER] Pista enviada a ${username} (ID: ${userForBot}): ${selectedHint}`);
            } catch (error) {
              console.error(`❌ [TRIGGER] Error procesando compra de pista para ${username}:`, error);
            }
          } else {
            console.log(`⚠️ [TRIGGER] No hay juego activo o no hay pistas disponibles para ${username}`);
          }
          break;

        default:
          console.log(`❓ [TRIGGER] Acción desconocida: ${trigger.action}`);
      }
    } catch (error) {
      console.error(`❌ [TRIGGER] Error ejecutando trigger "${trigger.name}":`, error);
    }
  }
}

// Endpoint para recibir eventos del servidor Python TikTok Live
app.post('/tiktok-live-event', (req, res) => {
  const { event, data, timestamp } = req.body;
  
  console.log(`📺 [TikTok Live] Event: ${event}`, data);
  
  // Actualizar estado según el evento
  switch (event) {
    case 'connect':
      tiktokLiveStatus.connected = true;
      tiktokLiveStatus.streamer_username = data.username;
      tiktokLiveStatus.room_id = data.room_id;
      tiktokLiveStatus.last_update = timestamp;
      break;

    case 'disconnect':
    case 'live_end':
      tiktokLiveStatus.connected = false;
      tiktokLiveStatus.last_update = timestamp;
      break;

    case 'gift':
      console.log(`🎁 [REGALO] ${data.username} envió ${data.quantity}x ${data.gift_name} (ID: ${data.gift_id})`);
      // Procesar triggers de regalos de forma asíncrona
      processGiftTriggers(data).catch(error => {
        console.error('❌ [GIFT TRIGGER] Error procesando triggers:', error);
      });
      break;

    case 'like':
      console.log(`❤️ [LIKE] ${data.username} dio ${data.count || 1} like(s)`);
      // Procesar likes comunales
      processCommunalEvent('likes', data.count || 1, data.username).catch(error => {
        console.error('❌ [LIKE TRIGGER] Error procesando likes comunales:', error);
      });
      break;

    case 'follow':
      console.log(`👥 [FOLLOW] ${data.username} siguió el canal`);
      // Procesar follows comunales
      processCommunalEvent('follows', 1, data.username).catch(error => {
        console.error('❌ [FOLLOW TRIGGER] Error procesando follows comunales:', error);
      });
      break;

    case 'winner':
      console.log(`🎉 [GANADOR] ${data.username} respondió: "${data.comment}"`);

      // Assign corona reward to the winner immediately using unique_id (user ID)
      const coronaReward = tiktokLiveStatus.currentGameCoronasReward || 5;
      const userId = data.unique_id || data.username; // Use unique_id as primary, fallback to username
      try {
        const winnerCoronas = database.addCoronas(userId, coronaReward, `🎉 Ganó el juego: "${data.phrase}"`);
        console.log(`👑 [CORONA REWARD] ¡${data.username} (ID: ${userId}) ganó ${coronaReward} coronas! Nuevo saldo: ${winnerCoronas}`);
        console.log(`💎 [CORONA REWARD] Saldo actualizado para ID: ${userId}: ${winnerCoronas} coronas totales`);

        // No enviamos mensaje automático para evitar riesgo de bloqueo por automatización
        // El usuario verá las coronas ganadas en la animación del juego

      } catch (error) {
        console.error(`❌ [CORONA REWARD] Error asignando coronas a ID: ${userId} (username: ${data.username}):`, error);
      }

      // Almacenar temporalmente el ganador para que el frontend lo pueda obtener
      tiktokLiveStatus.lastWinner = {
        username: data.username,
        unique_id: data.unique_id,
        profile_picture: data.profile_picture,
        comment: data.comment,
        answer: data.answer,
        phrase: data.phrase,
        category: data.category,
        timestamp: timestamp,
        coronaReward: coronaReward // Include the corona reward in winner data
      };

      // Broadcast del ganador a todos los clientes conectados via WebSocket
      broadcastWinner(tiktokLiveStatus.lastWinner);

      break;
  }
  
  res.json({ success: true, message: 'Evento procesado' });
});

// ===============================
// ENDPOINTS GIFT TRIGGERS
// ===============================

// Obtener triggers configurados
app.get('/gift-triggers', (req, res) => {
  res.json({ success: true, triggers: giftTriggers });
});

// Actualizar triggers
app.post('/gift-triggers', (req, res) => {
  const { triggers } = req.body;
  if (!triggers || !Array.isArray(triggers)) {
    return res.status(400).json({ success: false, message: 'Triggers array es requerido' });
  }

  giftTriggers = triggers;
  console.log(`🎁 [GIFT TRIGGERS] Configuración actualizada: ${triggers.length} triggers`);
  res.json({ success: true, message: 'Triggers actualizados', triggers: giftTriggers });
});

// Endpoint para testing manual de eventos comunales (likes/follows)
app.post('/test-communal-event', async (req, res) => {
  const { eventType, count, username } = req.body;

  if (!eventType || !count || !username) {
    return res.status(400).json({
      success: false,
      message: 'eventType, count y username son requeridos'
    });
  }

  if (!['likes', 'follows'].includes(eventType)) {
    return res.status(400).json({
      success: false,
      message: 'eventType debe ser "likes" o "follows"'
    });
  }

  try {
    console.log(`🧪 [MANUAL COMUNAL] Simulando ${count}x ${eventType} de ${username}`);

    await processCommunalEvent(eventType, count, username);

    res.json({
      success: true,
      message: `Evento comunal ${eventType} ejecutado para ${username}`,
      currentCounters: tiktokLiveStatus.communalCounters
    });
  } catch (error) {
    console.error('❌ [MANUAL COMUNAL] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint para probar trigger manualmente
app.post('/test-gift-trigger', async (req, res) => {
  const { giftId, quantity, username } = req.body;

  if (!giftId || !quantity || !username) {
    return res.status(400).json({
      success: false,
      message: 'giftId, quantity y username son requeridos'
    });
  }

  try {
    console.log(`🧪 [MANUAL TRIGGER] Simulando regalo: ${username} envió ${quantity}x regalo ID ${giftId}`);

    const mockGiftData = {
      username: username,
      unique_id: username, // Simular unique_id sin @ (como viene de TikTok Live real)
      gift_id: giftId,
      gift_name: `Test Gift ${giftId}`,
      quantity: quantity
    };

    await processGiftTriggers(mockGiftData);

    res.json({
      success: true,
      message: `Trigger manual ejecutado para ${username}`,
      processed: mockGiftData
    });
  } catch (error) {
    console.error('❌ [MANUAL TRIGGER] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint para obtener estado del TikTok Live
app.get('/tiktok-live-status', (req, res) => {
  // NUEVO SISTEMA SIMPLIFICADO: Solo enviar señales del backend si existen
  const backendReveal = tiktokLiveStatus.backendReveal;

  // Limpiar señal después de enviarla (se consume una sola vez)
  if (backendReveal) {
    console.log('📡 [BACKEND-REVEAL] Enviando señal de revelación:', backendReveal.type, backendReveal.letter);
    delete tiktokLiveStatus.backendReveal; // Consumir la señal inmediatamente
  }

  res.json({
    success: true,
    status: {
      ...tiktokLiveStatus,
      backendReveal // Solo incluir si existe
    }
  });
});

// Endpoint para obtener el último ganador
app.get('/tiktok-live-winner', (req, res) => {
  if (tiktokLiveStatus.lastWinner) {
    const winner = tiktokLiveStatus.lastWinner;

    // Limpiar el ganador después de enviarlo para evitar mostrar el mismo ganador múltiples veces
    tiktokLiveStatus.lastWinner = null;

    res.json({
      success: true,
      winner: winner
    });
  } else {
    res.json({
      success: true,
      winner: null
    });
  }
});

// Endpoint para obtener revelaciones pendientes
app.get('/pending-reveals', (req, res) => {
  const reveals = [...tiktokLiveStatus.pendingReveals];

  // Limpiar la cola después de enviarla
  tiktokLiveStatus.pendingReveals = [];

  res.json({
    success: true,
    reveals: reveals
  });
});

// Endpoint para iniciar servidor Python TikTok Live
app.post('/tiktok-live-start', async (req, res) => {
  const { username } = req.body;
  
  if (!username) {
    return res.status(400).json({ success: false, message: 'Username es requerido' });
  }
  
  try {
    console.log(`🚀 [TikTok Live] Iniciando conexión a @${username}`);
    const result = await tiktokLiveManager.connectToUser(username);
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: `Conexión iniciada a @${username}`,
        status: tiktokLiveManager.getStatus()
      });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error iniciando TikTok Live:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint para detener servidor Python TikTok Live
app.post('/tiktok-live-stop', async (req, res) => {
  try {
    console.log('🛑 [TikTok Live] Deteniendo conexión');
    const result = await tiktokLiveManager.stop();
    
    if (result.success) {
      tiktokLiveStatus.connected = false;
      res.json({ 
        success: true, 
        message: 'Conexión TikTok Live detenida',
        status: tiktokLiveManager.getStatus()
      });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error deteniendo TikTok Live:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint para actualizar estado del juego en el servidor Python
app.post('/tiktok-live-game-update', async (req, res) => {
  const { phrase, answer, category, isActive, coronaReward } = req.body;

  if (!answer) {
    return res.status(400).json({ success: false, message: 'Answer es requerido' });
  }

  // Actualizar estado del juego actual para triggers privados (con encoding UTF-8 correcto)
  tiktokLiveStatus.currentGamePhrase = phrase;
  tiktokLiveStatus.currentGameAnswer = answer;
  tiktokLiveStatus.currentGameCategory = Buffer.from(category, 'latin1').toString('utf8'); // Fix encoding
  tiktokLiveStatus.currentGameIsActive = isActive;

  // Resetear letras reveladas y hints cuando inicia un nuevo juego
  if (isActive) {
    tiktokLiveStatus.currentRevealedLetters = [];
    tiktokLiveStatus.currentGameHints = []; // Se resetea aquí, pero se debe llenar desde el frontend
    resetCommunalCounters(); // Resetear contadores comunales para nuevo juego
    console.log('🔄 [GAME UPDATE] Letras reveladas, hints y contadores comunales reseteados para nuevo juego');
    console.log('⚠️ [GAME UPDATE] IMPORTANTE: Las hints se resetean aquí y deben ser enviadas desde el frontend!');
  }

  try {
    console.log(`🎮 [Game Update] Respuesta: "${answer}" - Activo: ${isActive} - Coronas: ${coronaReward || 5}`);

    // Update current game corona reward
    if (isActive && coronaReward) {
      tiktokLiveStatus.currentGameCoronasReward = coronaReward;
      console.log(`👑 [Corona Reward] Updated to: ${coronaReward} coronas`);
    } else if (!isActive) {
      tiktokLiveStatus.currentGameCoronasReward = 5; // Reset to default when game is inactive
    }

    // Enviar update al servidor Python
    const result = tiktokLiveManager.updateGameState(phrase, answer, category, isActive);

    if (result.success) {
      res.json({
        success: true,
        message: 'Estado del juego actualizado y enviado a Python',
        data: { phrase, answer, category, isActive, coronaReward: tiktokLiveStatus.currentGameCoronasReward }
      });
    } else {
      // Aún retornamos success pero con warning
      res.json({
        success: true,
        message: 'Estado del juego actualizado (warning: ' + result.error + ')',
        data: { phrase, answer, category, isActive, coronaReward: tiktokLiveStatus.currentGameCoronasReward },
        warning: result.error
      });
    }
  } catch (error) {
    console.error('Error actualizando juego:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint para actualizar letras reveladas desde el frontend
app.post('/update-revealed-letters', (req, res) => {
  const { revealedLetters } = req.body;

  if (!Array.isArray(revealedLetters)) {
    return res.status(400).json({ success: false, message: 'revealedLetters debe ser un array' });
  }

  tiktokLiveStatus.currentRevealedLetters = revealedLetters;
  console.log('📝 [REVEALED LETTERS] Actualizadas desde frontend:', revealedLetters);

  res.json({
    success: true,
    message: 'Letras reveladas actualizadas',
    revealedLetters: tiktokLiveStatus.currentRevealedLetters
  });
});

// Endpoint para actualizar triggers desde el frontend
app.post('/update-gift-triggers', (req, res) => {
  const { triggers } = req.body;

  console.log('🔄 [UPDATE-TRIGGERS] Solicitud recibida con triggers:', triggers);

  if (!Array.isArray(triggers)) {
    console.error('❌ [UPDATE-TRIGGERS] Error: triggers no es un array:', triggers);
    return res.status(400).json({ success: false, message: 'triggers debe ser un array' });
  }

  // Actualizar triggers globales
  giftTriggers = triggers;
  console.log('✅ [GIFT TRIGGERS] Actualizados desde frontend:', triggers.length, 'triggers');
  console.log('🔍 [GIFT TRIGGERS] Triggers activos:');
  giftTriggers.forEach(trigger => {
    console.log(`   - "${trigger.name}": Regalo=${trigger.giftName}, Cantidad=${trigger.quantity}, Enabled=${trigger.enabled}`);
  });

  res.json({
    success: true,
    message: 'Triggers actualizados',
    triggers: giftTriggers
  });
});

// Endpoint para actualizar hints desde el frontend
app.post('/update-game-hints', (req, res) => {
  const { hints } = req.body;

  console.log('💡 [UPDATE-GAME-HINTS] Solicitud recibida con hints:', hints);

  if (!Array.isArray(hints)) {
    console.error('❌ [UPDATE-GAME-HINTS] Error: hints no es un array:', hints);
    return res.status(400).json({ success: false, message: 'hints debe ser un array' });
  }

  tiktokLiveStatus.currentGameHints = hints;
  console.log('✅ [GAME HINTS] Actualizadas desde frontend:', hints);
  console.log('🔍 [GAME HINTS] Estado completo después de actualizar:');
  console.log('   - Juego activo:', tiktokLiveStatus.currentGameIsActive);
  console.log('   - Hints:', tiktokLiveStatus.currentGameHints);
  console.log('   - Cantidad de hints:', tiktokLiveStatus.currentGameHints.length);

  res.json({
    success: true,
    message: 'Hints actualizadas',
    hints: tiktokLiveStatus.currentGameHints
  });
});

// Endpoint para resetear el tablero (limpiar estado del juego)
app.post('/reset-board', async (req, res) => {
  try {
    console.log('🔄 [Board Reset] Reseteando tablero y notificando al servidor Python...');

    // Limpiar el estado del último ganador para evitar detecciones de frases anteriores
    tiktokLiveStatus.lastWinner = null;

    // Resetear letras reveladas y hints
    tiktokLiveStatus.currentRevealedLetters = [];
    tiktokLiveStatus.currentGameHints = [];
    console.log('🔄 [Board Reset] Letras reveladas y hints reseteadas');

    // Resetear contadores comunales
    resetCommunalCounters();

    // Notificar al servidor Python que debe dejar de buscar la frase actual
    const result = tiktokLiveManager.updateGameState('', '', '', false);

    if (result.success) {
      res.json({
        success: true,
        message: 'Tablero reseteado exitosamente. El servidor Python ya no buscará frases anteriores.'
      });
    } else {
      // Aún retornamos success pero con warning
      res.json({
        success: true,
        message: 'Tablero reseteado (warning: ' + result.error + ')',
        warning: result.error
      });
    }
  } catch (error) {
    console.error('Error reseteando tablero:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/ping', (req, res) => {
  res.send('Servidor Express activo');
});

// ===============================
// ENDPOINTS SISTEMA DE CORONAS
// ===============================

// Obtener saldo de coronas de un usuario (usando userId/unique_id)
app.get('/coronas/:username', (req, res) => {
  const { username: userId } = req.params;
  try {
    const users = database.getUsers();
    // Buscar userId de forma case-insensitive
    let foundUser = null;
    let actualUserId = null;

    for (const [key, userData] of Object.entries(users)) {
      if (key.toLowerCase() === userId.toLowerCase()) {
        foundUser = userData;
        actualUserId = key;
        break;
      }
    }

    if (foundUser) {
      res.json({ success: true, userId: actualUserId, coronas: foundUser.coronas || 0 });
    } else {
      // Usuario no encontrado, devolver con 0 coronas
      res.json({ success: true, userId: userId, coronas: 0, isNew: true });
    }
  } catch (error) {
    console.error('Error al obtener coronas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtener todos los usuarios (admin)
app.get('/users', (req, res) => {
  try {
    const users = database.getUsers();
    const usersList = Object.keys(users).map(username => ({
      username,
      coronas: users[username].coronas || 0
    }));
    res.json({ success: true, users: usersList });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Agregar coronas a un usuario (admin) - usando userId/unique_id
app.post('/coronas/add', (req, res) => {
  const { username: userId, amount, description } = req.body;
  if (!userId || !amount) {
    return res.status(400).json({ success: false, message: 'UserId y amount son requeridos.' });
  }
  try {
    const newBalance = database.addCoronas(userId, parseInt(amount), description || 'Admin addition');
    res.json({ success: true, userId, newBalance, added: amount });
  } catch (error) {
    console.error('Error al agregar coronas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Quitar coronas de un usuario (admin) - usando userId/unique_id
app.post('/coronas/remove', (req, res) => {
  const { username: userId, amount, description } = req.body;
  if (!userId || !amount) {
    return res.status(400).json({ success: false, message: 'UserId y amount son requeridos.' });
  }
  try {
    const amountToRemove = parseInt(amount);
    const success = database.subtractCoronas(userId, amountToRemove, description || 'Admin removal');
    if (success) {
      const newBalance = database.getUserCoronas(userId);
      res.json({ success: true, userId, newBalance, removed: amountToRemove });
    } else {
      res.status(400).json({ success: false, message: 'El usuario no tiene suficientes coronas o no existe.' });
    }
  } catch (error) {
    console.error('Error al quitar coronas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Eliminar usuario (admin)
app.delete('/users/:username', (req, res) => {
  const { username: userId } = req.params;
  try {
    const success = database.deleteUser(userId);
    if (success) {
      res.json({ success: true, message: 'Usuario eliminado exitosamente.' });
    } else {
      res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
    }
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtener todos los productos
app.get('/products', (req, res) => {
  try {
    const products = database.getProducts().filter(p => p.active);
    res.json({ success: true, products });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Agregar producto (admin)
app.post('/products', (req, res) => {
  const { title, image, price, description, deliverable } = req.body;
  if (!title || !price) {
    return res.status(400).json({ success: false, message: 'Title y price son requeridos.' });
  }
  try {
    const product = database.addProduct(title, image || '', parseInt(price), description || '', deliverable || '');
    res.json({ success: true, product });
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Actualizar producto (admin)
app.put('/products/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  try {
    const product = database.updateProduct(id, updates);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
    }
    res.json({ success: true, product });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Eliminar producto (admin)
app.delete('/products/:id', (req, res) => {
  const { id } = req.params;
  try {
    const deleted = database.deleteProduct(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
    }
    res.json({ success: true, message: 'Producto eliminado.' });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Iniciar canje de producto
app.post('/redeem', async (req, res) => {
  const { username, productId } = req.body;
  if (!username || !productId) {
    return res.status(400).json({ success: false, message: 'Username y productId son requeridos.' });
  }

  try {
    // Verificar que el producto existe
    const products = database.getProducts();
    const product = products.find(p => p.id === productId && p.active);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
    }

    // Verificar que el usuario tiene suficientes coronas
    const userCoronas = database.getUserCoronas(username);
    if (userCoronas < product.price) {
      return res.status(400).json({ 
        success: false, 
        message: 'Coronas insuficientes.',
        needed: product.price,
        available: userCoronas
      });
    }

    // Generar código de verificación
    const verificationCode = database.generateVerificationCode(username, productId);
    
    // Enviar código de verificación por TikTok
    const verificationMessage = `🎁 CÓDIGO DE CANJE 🎁 Producto: ${product.title} | Precio: ${product.price} coronas | 🔐 Tu código: ${verificationCode} | Ingresa este código en la web para completar tu canje | ⏰ Válido por 5 minutos | ¡Gracias por tu compra! 💎`;

    try {
      await sendMessage(username, verificationMessage);
      console.log(`Código de verificación ${verificationCode} enviado a @${username}`);
      
      res.json({ 
        success: true, 
        message: 'Código de verificación enviado a tu TikTok. Revisa tu inbox.',
        code: verificationCode, // Mostrar código también como backup
        product: product.title,
        price: product.price
      });
    } catch (messageError) {
      console.error('Error enviando código por TikTok:', messageError);
      
      // Si falla el envío, mostrar código directamente como fallback
      res.json({ 
        success: true, 
        message: 'Código de verificación generado (Error enviando por TikTok). Código: ' + verificationCode,
        code: verificationCode,
        product: product.title,
        price: product.price,
        warning: 'No se pudo enviar por TikTok'
      });
    }

  } catch (error) {
    console.error('Error en canje:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Confirmar canje con código
app.post('/confirm-redeem', (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ success: false, message: 'Código es requerido.' });
  }

  try {
    const codeData = database.verifyCode(code);
    if (!codeData) {
      return res.status(400).json({ success: false, message: 'Código inválido o expirado.' });
    }

    // Obtener producto
    const products = database.getProducts();
    const product = products.find(p => p.id === codeData.productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
    }

    // Descontar coronas
    const success = database.subtractCoronas(codeData.username, product.price, `Canje: ${product.title}`);
    if (!success) {
      return res.status(400).json({ success: false, message: 'Error al procesar canje.' });
    }

    // Crear orden pendiente para fulfillment
    const order = database.createOrder(codeData.username, product.id, product.title, product.price);
    const newBalance = database.getUserCoronas(codeData.username);

    res.json({
      success: true,
      message: '¡Canje confirmado! Tu pedido está siendo procesado. Recibirás tu producto por TikTok pronto.',
      product: product.title,
      cost: product.price,
      newBalance,
      orderId: order.id,
      deliverable: product.deliverable
    });

  } catch (error) {
    console.error('Error confirmando canje:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Limpiar códigos expirados (llamar periódicamente)
setInterval(() => {
  database.cleanExpiredCodes();
}, 60000); // cada minuto

// (Aquí luego agregaremos más endpoints si es necesario)

// FIXED: Endpoint para obtener revelaciones pendientes (movido al final para evitar conflictos)
app.get('/pending-reveals-v2', (req, res) => {
  console.log('📡 [DEBUG] GET /pending-reveals-v2 called');
  const reveals = [...(tiktokLiveStatus.pendingReveals || [])];

  // Limpiar la cola después de enviarla
  tiktokLiveStatus.pendingReveals = [];

  console.log('📤 [DEBUG] Enviando revelaciones:', reveals);
  res.json({
    success: true,
    reveals: reveals
  });
});

// ===============================
// NUEVAS FUNCIONES DE REVELACIÓN DIRECTA EN BACKEND
// ===============================

async function executeRevealVowel() {
  try {
    console.log('🔤 [BACKEND REVEAL] Ejecutando revelación de vocal en backend...');

    if (!tiktokLiveStatus.currentGameIsActive || !tiktokLiveStatus.currentGameAnswer) {
      console.log('⚠️ [BACKEND REVEAL] No hay juego activo para revelar vocal');
      return;
    }

    // Obtener letras reveladas actuales
    const currentRevealed = tiktokLiveStatus.currentRevealedLetters || [];
    const phrase = tiktokLiveStatus.currentGameAnswer.toUpperCase();

    // Encontrar vocal no revelada
    const vowels = ['A', 'E', 'I', 'O', 'U'];
    const phraseLetters = phrase.split('').filter(char => char !== ' ');
    const availableVowels = vowels.filter(vowel =>
      phraseLetters.includes(vowel) && !currentRevealed.includes(vowel.toLowerCase())
    );

    if (availableVowels.length === 0) {
      console.log('⚠️ [BACKEND REVEAL] No hay vocales disponibles para revelar');
      return;
    }

    // Seleccionar vocal aleatoria
    const randomVowel = availableVowels[Math.floor(Math.random() * availableVowels.length)];
    console.log(`🔤 [BACKEND REVEAL] Vocal seleccionada: ${randomVowel}`);

    // Agregar a letras reveladas
    tiktokLiveStatus.currentRevealedLetters.push(randomVowel.toLowerCase());

    // Enviar señal al frontend
    tiktokLiveStatus.backendReveal = {
      type: 'vowel',
      letter: randomVowel.toLowerCase(),
      timestamp: Date.now(),
      id: `backend_vowel_${Date.now()}`
    };

    console.log('✅ [BACKEND REVEAL] Vocal revelada exitosamente por backend');
  } catch (error) {
    console.error('❌ [BACKEND REVEAL] Error ejecutando revelación de vocal:', error);
  }
}

async function executeRevealConsonant() {
  try {
    console.log('🔠 [BACKEND REVEAL] Ejecutando revelación de consonante en backend...');

    if (!tiktokLiveStatus.currentGameIsActive || !tiktokLiveStatus.currentGameAnswer) {
      console.log('⚠️ [BACKEND REVEAL] No hay juego activo para revelar consonante');
      return;
    }

    // Obtener letras reveladas actuales
    const currentRevealed = tiktokLiveStatus.currentRevealedLetters || [];
    const phrase = tiktokLiveStatus.currentGameAnswer.toUpperCase();

    // Encontrar consonante no revelada
    const consonants = 'BCDFGHJKLMNPQRSTVWXYZ'.split('');
    const phraseLetters = phrase.split('').filter(char => char !== ' ');
    const availableConsonants = consonants.filter(consonant =>
      phraseLetters.includes(consonant) && !currentRevealed.includes(consonant.toLowerCase())
    );

    if (availableConsonants.length === 0) {
      console.log('⚠️ [BACKEND REVEAL] No hay consonantes disponibles para revelar');
      return;
    }

    // Seleccionar consonante aleatoria
    const randomConsonant = availableConsonants[Math.floor(Math.random() * availableConsonants.length)];
    console.log(`🔠 [BACKEND REVEAL] Consonante seleccionada: ${randomConsonant}`);

    // Agregar a letras reveladas
    tiktokLiveStatus.currentRevealedLetters.push(randomConsonant.toLowerCase());

    // Enviar señal al frontend
    tiktokLiveStatus.backendReveal = {
      type: 'consonant',
      letter: randomConsonant.toLowerCase(),
      timestamp: Date.now(),
      id: `backend_consonant_${Date.now()}`
    };

    console.log('✅ [BACKEND REVEAL] Consonante revelada exitosamente por backend');
  } catch (error) {
    console.error('❌ [BACKEND REVEAL] Error ejecutando revelación de consonante:', error);
  }
}

// Catch-all handler para React Router (solo en producción)
if (isProduction) {
  app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

app.listen(PORT, async () => {
  if (isProduction) {
    console.log(`🚀 Servidor en producción: Puerto ${PORT}`);
    console.log(`🎮 Panel Admin: /admin`);
    console.log(`💎 Sistema Coronas: /coronas`);
  } else {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
    console.log(`🎮 Panel Admin: http://localhost:5173/admin`);
    console.log(`💎 Sistema Coronas: http://localhost:5173/coronas`);
  }

  // Auto-iniciar navegador TikTok si está configurado
  setTimeout(async () => {
    await autoStartBrowser();
  }, 2000);

  // Auto-iniciar servidor TikTok Live (sin conectar automáticamente)
  setTimeout(async () => {
    console.log('🐍 [TikTok Live] Iniciando servidor Python (modo espera)...');
    try {
      const result = await tiktokLiveManager.startStandby(); // Inicia en modo espera
      if (result.success) {
        console.log('✅ [TikTok Live] Servidor Python iniciado en modo espera');
        console.log('📺 Para conectar al live, ve al Panel Admin y configura tu usuario TikTok');
      } else {
        console.log('⚠️ [TikTok Live] No se pudo iniciar servidor Python:', result.error);
        console.log('💡 Verifica que Python esté instalado y ejecuta: cd server && python -m pip install -r requirements.txt');
      }
    } catch (error) {
      console.log('⚠️ [TikTok Live] Error iniciando servidor Python:', error.message);
    }
  }, 3000); // Esperar 3 segundos para que Express esté completamente listo
});