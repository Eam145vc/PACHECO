// Script de prueba para el sistema de cola de mensajes
const { messageQueue } = require('./sendMessage');

// Simular múltiples solicitudes de envío de mensajes
async function testMessageQueue() {
  console.log('🧪 Iniciando prueba del sistema de cola de mensajes...\n');

  // Verificar estado inicial
  console.log('📊 Estado inicial de la cola:', messageQueue.getStatus());

  // Simular múltiples mensajes enviados al mismo tiempo
  const testMessages = [
    { username: 'user1', message: 'Primer mensaje de prueba' },
    { username: 'user2', message: 'Segundo mensaje de prueba' },
    { username: 'user3', message: 'Tercer mensaje de prueba' },
    { username: 'user1', message: 'Cuarto mensaje de prueba para user1' },
    { username: 'user4', message: 'Quinto mensaje de prueba' }
  ];

  console.log('🚀 Enviando múltiples mensajes simultáneamente...\n');

  // Enviar todos los mensajes al mismo tiempo
  const promises = testMessages.map(({ username, message }, index) => {
    console.log(`📤 Enviando mensaje ${index + 1} para ${username}`);
    return messageQueue.enqueue(username, message)
      .then(() => {
        console.log(`✅ Mensaje ${index + 1} completado para ${username}`);
      })
      .catch((error) => {
        console.error(`❌ Error en mensaje ${index + 1} para ${username}:`, error.message);
      });
  });

  // Verificar estado durante el procesamiento
  setTimeout(() => {
    console.log('\n📊 Estado durante procesamiento:', messageQueue.getStatus());
  }, 500);

  // Esperar a que todos los mensajes se procesen
  try {
    await Promise.all(promises);
    console.log('\n✅ Todos los mensajes han sido procesados');
  } catch (error) {
    console.error('\n❌ Error durante el procesamiento:', error);
  }

  // Verificar estado final
  console.log('\n📊 Estado final de la cola:', messageQueue.getStatus());
}

// Función para prueba de limpieza de cola
async function testQueueClear() {
  console.log('\n🧪 Probando función de limpieza de cola...');

  // Agregar algunos mensajes a la cola
  messageQueue.enqueue('test_user1', 'Mensaje para limpiar 1');
  messageQueue.enqueue('test_user2', 'Mensaje para limpiar 2');
  messageQueue.enqueue('test_user3', 'Mensaje para limpiar 3');

  console.log('📊 Estado antes de limpiar:', messageQueue.getStatus());

  // Limpiar la cola
  const clearedCount = messageQueue.clear();
  console.log(`🧹 Mensajes limpiados: ${clearedCount}`);

  console.log('📊 Estado después de limpiar:', messageQueue.getStatus());
}

// Ejecutar las pruebas solo si se ejecuta directamente este archivo
if (require.main === module) {
  console.log('⚠️  NOTA: Esta es una prueba simulada del sistema de cola.');
  console.log('⚠️  Los mensajes no se enviarán realmente a TikTok porque no está configurado el navegador.\n');

  // Reemplazar la función _sendMessage con una simulación para la prueba
  const originalSendMessage = require('./sendMessage');

  // Mock de la función interna para simular envío
  const mockSendMessage = async (username, message) => {
    console.log(`🎭 [SIMULACIÓN] Enviando a ${username}: "${message}"`);
    // Simular tiempo de envío
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

    // Simular algunos errores ocasionales para prueba
    if (Math.random() < 0.1) {
      throw new Error('Error simulado de red');
    }

    console.log(`🎭 [SIMULACIÓN] Mensaje enviado exitosamente a ${username}`);
  };

  // Ejecutar las pruebas
  testMessageQueue()
    .then(() => testQueueClear())
    .then(() => {
      console.log('\n🎉 Pruebas completadas');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error en las pruebas:', error);
      process.exit(1);
    });
}

module.exports = { testMessageQueue, testQueueClear };