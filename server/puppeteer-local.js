require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');

console.log('🚀 Iniciando Puppeteer local conectado a Render...');
console.log('🌐 Backend Render:', process.env.VITE_API_BASE_URL || 'https://backrey.onrender.com');

// Cargar solo el módulo sendMessage
const {
  startBrowser,
  sendMessage,
  setCookies,
  autoStartBrowser
} = require('./sendMessage');

const app = express();
const PORT = process.env.PORT || 3003;

// CORS para permitir requests del frontend de Render
app.use(cors({
  origin: '*', // Permitir todos los orígenes para testing
  credentials: true
}));

app.use(express.json());

console.log('📨 Módulo sendMessage cargado exitosamente');

// Endpoints básicos para Puppeteer
app.post('/start-login', async (req, res) => {
  console.log('🔑 [LOCAL] Solicitud de inicio de sesión TikTok recibida');
  try {
    await startBrowser();
    res.json({ success: true, message: 'Navegador iniciado para inicio de sesión manual.' });
  } catch (error) {
    console.error('❌ [LOCAL] Error al iniciar el navegador:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/set-cookies', async (req, res) => {
  const { cookies } = req.body;
  console.log('🍪 [LOCAL] Configurando cookies de TikTok...');
  if (!cookies) {
    return res.status(400).json({ success: false, message: 'Cookies son requeridas.' });
  }
  try {
    await setCookies(cookies);
    res.json({ success: true, message: 'Cookies configuradas correctamente.' });
  } catch (error) {
    console.error('❌ [LOCAL] Error configurando cookies:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/send-message', async (req, res) => {
  const { username, message } = req.body;
  console.log(`📤 [LOCAL] Enviando mensaje a @${username}: ${message}`);
  if (!username || !message) {
    return res.status(400).json({ success: false, message: 'Usuario y mensaje son requeridos.' });
  }
  try {
    await sendMessage(username, message);
    res.json({ success: true, message: 'Mensaje enviado exitosamente.' });
  } catch (error) {
    console.error('❌ [LOCAL] Error enviando mensaje:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/ping', (req, res) => {
  res.json({
    success: true,
    message: 'Puppeteer local activo',
    renderBackend: process.env.VITE_API_BASE_URL || 'https://backrey.onrender.com'
  });
});

// Función para iniciar ngrok y registrar URL
async function startNgrokAndRegister() {
  return new Promise((resolve, reject) => {
    console.log('🌐 Iniciando ngrok...');
    const ngrokProcess = exec('ngrok http 3003 --log=stdout', (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Error iniciando ngrok:', error);
        reject(error);
        return;
      }
    });

    let ngrokUrl = null;
    ngrokProcess.stdout.on('data', (data) => {
      const output = data.toString();

      // Buscar la URL de ngrok en el output
      const urlMatch = output.match(/https:\/\/[a-zA-Z0-9-]+\.ngrok-free\.app/);
      if (urlMatch && !ngrokUrl) {
        ngrokUrl = urlMatch[0];
        console.log(`✅ ngrok URL: ${ngrokUrl}`);

        // Registrar URL con Render
        registerWithRender(ngrokUrl);
        resolve(ngrokUrl);
      }
    });

    ngrokProcess.stderr.on('data', (data) => {
      console.log('ngrok stderr:', data.toString());
    });

    // Timeout de 10 segundos para obtener la URL
    setTimeout(() => {
      if (!ngrokUrl) {
        console.log('⚠️ Timeout obteniendo URL de ngrok');
        resolve(null);
      }
    }, 10000);
  });
}

// Función para registrar la URL con Render
async function registerWithRender(ngrokUrl) {
  try {
    const renderBackend = process.env.VITE_API_BASE_URL || 'https://backrey.onrender.com';
    console.log(`🔗 Intentando registrar con: ${renderBackend}/register-puppeteer-url`);
    console.log(`📡 Enviando URL: ${ngrokUrl}`);

    const response = await fetch(`${renderBackend}/register-puppeteer-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ puppeteerUrl: ngrokUrl })
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ URL registrada con Render: ${ngrokUrl}`);
      console.log(`📋 Respuesta:`, result);
    } else {
      const errorText = await response.text();
      console.log(`⚠️ Error registrando URL con Render: ${response.status} ${response.statusText}`);
      console.log(`📋 Detalle:`, errorText);
    }
  } catch (error) {
    console.log('⚠️ Error conectando con Render:', error.message);
    console.log('💡 Verifica que el servidor de Render esté activo y accesible');
  }
}

// Iniciar servidor local
app.listen(PORT, async () => {
  console.log('🎉 ¡Puppeteer local iniciado exitosamente!');
  console.log(`🔗 Servidor local: http://localhost:${PORT}`);
  console.log(`🌐 Backend Render: ${process.env.VITE_API_BASE_URL || 'https://backrey.onrender.com'}`);
  console.log('📋 Endpoints disponibles:');
  console.log('  POST /start-login - Iniciar sesión TikTok');
  console.log('  POST /set-cookies - Configurar cookies');
  console.log('  POST /send-message - Enviar mensaje');
  console.log('  GET /ping - Verificar estado');

  // Iniciar ngrok
  try {
    await startNgrokAndRegister();
  } catch (error) {
    console.log('⚠️ Error iniciando ngrok:', error.message);
    console.log('💡 Puedes usar ngrok manualmente: ngrok http 3003');
  }

  // Auto-iniciar navegador TikTok
  console.log('🚀 Auto-iniciando navegador TikTok...');
  try {
    await autoStartBrowser();
    console.log('✅ Navegador TikTok iniciado correctamente');
  } catch (error) {
    console.log('⚠️ Error auto-iniciando navegador:', error.message);
    console.log('💡 Usa POST /start-login para iniciar manualmente');
  }
});

console.log('📡 Servidor Puppeteer local configurado...');