# Sistema de Cola de Mensajes para TikTok Bot

## Descripción

Se ha implementado un sistema de cola para manejar múltiples solicitudes de envío de mensajes privados al bot de TikTok. Esto evita problemas cuando se reciben varias órdenes de envío simultáneamente.

## Características

- **Cola FIFO**: Los mensajes se procesan en orden de llegada
- **Procesamiento secuencial**: Un mensaje a la vez para evitar problemas de concurrencia
- **Delay entre mensajes**: 2 segundos de espera entre envíos para evitar spam
- **Logging detallado**: Seguimiento completo del estado de la cola
- **Manejo de errores**: Los errores no detienen el procesamiento de otros mensajes
- **Endpoints de monitoreo**: APIs para verificar estado y limpiar la cola

## Uso Programático

```javascript
const { sendMessage, messageQueue } = require('./sendMessage');

// Enviar un mensaje (se agrega automáticamente a la cola)
try {
  await sendMessage('username', 'Mensaje a enviar');
  console.log('Mensaje enviado exitosamente');
} catch (error) {
  console.error('Error enviando mensaje:', error);
}

// Verificar estado de la cola
const status = messageQueue.getStatus();
console.log('Cola actual:', status.queueLength);
console.log('Procesando:', status.processing);

// Limpiar la cola (opcional)
const clearedCount = messageQueue.clear();
console.log(`Se limpiaron ${clearedCount} mensajes`);
```

## Endpoints de API

### GET /message-queue/status
Obtiene el estado actual de la cola de mensajes.

**Respuesta:**
```json
{
  "success": true,
  "status": {
    "queueLength": 3,
    "processing": true
  }
}
```

### POST /message-queue/clear
Limpia todos los mensajes pendientes en la cola.

**Respuesta:**
```json
{
  "success": true,
  "message": "Cola limpiada. 5 mensajes descartados."
}
```

## Logs del Sistema

El sistema genera logs detallados para seguimiento:

```
📬 Mensaje agregado a la cola para user123. Cola actual: 3 mensajes
🔄 Iniciando procesamiento de cola con 3 mensajes
📤 Procesando mensaje para user123: "Tu mensaje aquí"
✅ Mensaje enviado exitosamente a user123
⏱️ Esperando 2 segundos antes del siguiente mensaje...
✅ Procesamiento de cola completado
```

## Ventajas

1. **Evita conflictos**: No más problemas por múltiples envíos simultáneos
2. **Orden garantizado**: Los mensajes se envían en el orden recibido
3. **Resistente a errores**: Un fallo no afecta otros mensajes
4. **Monitoreable**: Estado visible en tiempo real
5. **Controlable**: Posibilidad de limpiar la cola si es necesario

## Casos de Uso

- Múltiples usuarios comprando vocales/consonantes al mismo tiempo
- Envío masivo de mensajes de bienvenida
- Procesamiento de recompensas automáticas
- Cualquier escenario que requiera envío de mensajes privados en TikTok