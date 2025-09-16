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

### Paso 4: Configurar Variables de Entorno
En la configuración del site en Render, agregar:
- **Variable**: `VITE_API_BASE_URL`
- **Valor**: `http://TU_IP_LOCAL:3002` (reemplazar por tu IP local)

⚠️ **Importante**: Reemplaza `TU_IP_LOCAL` con tu IP local real. Para obtenerla:
```bash
# Windows
ipconfig | findstr IPv4

# Mac/Linux
ifconfig | grep inet
```

### Paso 5: Deploy
1. Click "Create Static Site"
2. Render construirá y desplegará automáticamente
3. Una vez completado, obtendrás una URL como: `https://tu-app.onrender.com`

## Configuración del Backend Local

### Antes de usar la página desplegada:

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

⚠️ **Consideraciones importantes**:
- El backend local debe estar protegido (no exposer a internet sin seguridad)
- Solo el frontend está públicamente accesible
- Las funciones de admin requieren acceso local
- Los datos de TikTok Live permanecen en el entorno local

## Monitoreo

Para monitorear el uso:
1. **Render Dashboard**: Ver estadísticas de tráfico del frontend
2. **Backend Local**: Logs en consola del servidor Express
3. **Base de datos**: Archivo local en `server/database.json`