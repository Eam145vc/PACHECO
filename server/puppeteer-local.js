require('dotenv').config();
const express = require('express');
const cors = require('cors');

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