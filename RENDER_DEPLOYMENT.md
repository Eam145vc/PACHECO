# Deployment del Sistema de Coronas TikTok en Render

Este documento explica cómo desplegar solo el frontend del sistema de coronas en Render, mientras el backend se ejecuta localmente.

## Configuración

### 1. Frontend en Render (Página de Coronas)
- **Tipo**: Static Site
- **URL**: Se generará automáticamente por Render
- **Conecta con**: Backend local en `http://localhost:3002`

### 2. Backend Local (Sistema Completo)
- **Puerto**: 3002
- **Incluye**: TikTok Live, Bot, Base de datos, Panel Admin
- **Debe estar ejecutándose localmente**

## Pasos para Deployment

### Paso 1: Preparar el repositorio
```bash
# Verificar que todos los archivos estén committeados
git status
git add .
git commit -m "Configuración para deployment en Render"
git push origin main
```

### Paso 2: Crear cuenta en Render
1. Ve a [render.com](https://render.com)
2. Crea una cuenta o inicia sesión
3. Conecta tu repositorio de GitHub

### Paso 3: Crear Static Site en Render
1. Click en "New +" → "Static Site"
2. Conecta tu repositorio GitHub
3. Configuración:
   - **Name**: `tiktok-coronas-frontend`
   - **Branch**: `main`
   - **Build Command**: `npm ci && npm run build`
   - **Publish Directory**: `dist`

### Paso 4: Configurar Variables de Entorno con ngrok
En la configuración del site en Render, agregar:
- **Variable**: `VITE_API_BASE_URL`
- **Valor**: `https://TU_URL_NGROK` (ej: https://abc123.ngrok.io)

⚠️ **CONFIGURACIÓN CON NGROK (RECOMENDADO)**:

1. **Iniciar el sistema completo**:
```bash
# Opción 1: Script automático (recomendado)
start-complete.bat

# Opción 2: Manual
# Terminal 1 - Backend:
cd server && node index.js

# Terminal 2 - ngrok:
ngrok http 3002
```

2. **Copiar URL de ngrok**:
   - En la ventana de ngrok, buscar la línea: `Forwarding https://abc123.ngrok.io -> http://localhost:3002`
   - Copiar la URL HTTPS (ej: `https://abc123.ngrok.io`)
   - Esta será tu `VITE_API_BASE_URL` en Render

✅ **Ventajas de ngrok**:
- ✅ No necesitas configurar router ni firewall
- ✅ HTTPS automático y seguro
- ✅ No expones tu IP real
- ✅ Fácil de usar y configurar

⚠️ **Limitaciones ngrok gratis**:
- URL cambia cada vez que reinicias ngrok
- Para URL fija necesitas cuenta de pago ($8/mes)
- 20.000 requests/mes gratis

### Paso 5: Deploy
1. Click "Create Static Site"
2. Render construirá y desplegará automáticamente
3. Una vez completado, obtendrás una URL como: `https://tu-app.onrender.com`

## 🚀 INICIO RÁPIDO (ngrok)

### Paso a paso simplificado:

1. **Ejecutar el script automático**:
```bash
# En el directorio del proyecto:
start-complete.bat
```

2. **Copiar URL de ngrok**:
   - Se abrirán 2 ventanas: Backend + ngrok
   - En la ventana de ngrok, copiar la URL HTTPS
   - Ejemplo: `https://abc123.ngrok.io`

3. **Configurar en Render**:
   - Variable: `VITE_API_BASE_URL`
   - Valor: La URL de ngrok que copiaste

4. **¡Listo!** Tu sistema de coronas estará público

## Configuración Manual (Alternativa)

### Si prefieres hacerlo paso a paso:

1. **Iniciar el backend local**:
```bash
npm run start
# O alternativamente:
npm run dev:full
```

2. **Verificar que el servidor esté corriendo**:
```bash
# Debe responder con "Servidor Express activo"
curl http://localhost:3002/ping
```

3. **Configurar firewall** (si es necesario):
   - Permitir conexiones entrantes en puerto 3002
   - En Windows: Panel de Control → Firewall → Reglas de entrada

## URLs del Sistema

### Frontend (Render)
- **Página de Coronas**: `https://tu-app.onrender.com/coronas`
- **Admin de Coronas**: `https://tu-app.onrender.com/coronas/admin`

### Backend (Local)
- **Panel Admin Principal**: `http://localhost:5173/admin`
- **Stream Overlay**: `http://localhost:5173/stream`
- **API Backend**: `http://localhost:3002`

## Funcionalidades Disponibles en Render

✅ **Consulta de Coronas**: Los jugadores pueden ver su saldo
✅ **Catálogo de Productos**: Ver productos disponibles para canje
✅ **Sistema de Canje**: Generar códigos de verificación
✅ **Panel Admin de Coronas**: Gestionar usuarios y productos

❌ **No disponible en Render**:
- Panel Admin principal (TikTok Live, Gift Triggers)
- Stream Overlay con detección de ganadores
- Conexión directa a TikTok Live

## Troubleshooting

### Error "Network Error" o "Failed to fetch"
1. Verificar que el backend local esté corriendo
2. Comprobar la IP local en `VITE_API_BASE_URL`
3. Verificar firewall y permisos de red

### Error de CORS
- El backend ya está configurado para permitir cualquier origen
- Si persiste, reiniciar el servidor local

### Problemas de Build en Render
1. Verificar que `package.json` tenga las dependencias correctas
2. Comprobar que no haya errores en el código TypeScript
3. Revisar los logs de build en Render

## Actualización

Para actualizar la página desplegada:
```bash
git add .
git commit -m "Actualización del sistema"
git push origin main
```

Render detectará automáticamente los cambios y redesplegará.

## Seguridad

⚠️ **CONSIDERACIONES CRÍTICAS DE SEGURIDAD**:

### IP Pública Expuesta
- Tu backend estará accesible desde internet en `http://TU_IP_PUBLICA:3002`
- **RIESGO**: Cualquiera puede acceder a tu API si conoce tu IP
- **RECOMENDACIÓN**: Implementar autenticación básica

### Configuración de Seguridad Básica
1. **Cambiar puerto por defecto** (opcional):
```javascript
// En server/index.js, cambiar:
const PORT = process.env.PORT || 8457; // Puerto menos común
```

2. **Agregar autenticación básica para endpoints críticos**:
```javascript
// Middleware de autenticación simple
app.use('/admin', (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || auth !== 'Bearer TU_TOKEN_SECRETO') {
    return res.status(401).json({ error: 'No autorizado' });
  }
  next();
});
```

3. **Configurar IP estática** (recomendado):
   - Contactar tu ISP para IP estática
   - Evitar cambios constantes de configuración

### Alternativa Más Segura: ngrok
En lugar de exponer tu IP pública, usar ngrok:
```bash
# Instalar ngrok
npm install -g ngrok

# Exponer puerto 3002
ngrok http 3002

# Usar la URL de ngrok en VITE_API_BASE_URL
# Ejemplo: https://abc123.ngrok.io
```

⚠️ **IMPORTANTE**:
- Con ngrok gratis, la URL cambia cada vez que reinicias
- Para URL fija necesitas cuenta de pago
- Pero es más seguro que exponer tu IP directamente

## Monitoreo

Para monitorear el uso:
1. **Render Dashboard**: Ver estadísticas de tráfico del frontend
2. **Backend Local**: Logs en consola del servidor Express
3. **Base de datos**: Archivo local en `server/database.json`