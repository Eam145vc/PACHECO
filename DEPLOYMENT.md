# Despliegue en Render - TikTok Word Game

Este proyecto está configurado para desplegarse automáticamente en Render usando el archivo `render.yaml`.

## Pasos para el despliegue:

### 1. Preparar el repositorio
```bash
# Asegúrate de que todos los cambios estén committeados
git add .
git commit -m "Configurar para despliegue en Render"
git push origin main
```

### 2. Configurar en Render

1. Ve a [render.com](https://render.com) y crea una cuenta
2. Conecta tu repositorio de GitHub
3. Render detectará automáticamente el archivo `render.yaml`
4. Crear dos servicios:
   - **Backend**: `tiktok-word-game-backend`
   - **Frontend**: `tiktok-word-game-frontend`

### 3. Variables de entorno requeridas

El archivo `render.yaml` ya incluye las variables necesarias:

**Backend:**
- `NODE_ENV=production`
- `PORT=3002`
- `VITE_SUPABASE_URL=https://ikrjjodyclyizrefqclt.supabase.co`
- `VITE_SUPABASE_ANON_KEY=[clave incluida]`

**Frontend:**
- `NODE_ENV=production`
- `VITE_API_BASE_URL=https://tiktok-word-game-backend.onrender.com`
- `VITE_SUPABASE_URL=https://ikrjjodyclyizrefqclt.supabase.co`
- `VITE_SUPABASE_ANON_KEY=[clave incluida]`

### 4. URLs de producción

Una vez desplegado, tendrás:

- **Frontend**: `https://tiktok-word-game-frontend.onrender.com`
- **Backend API**: `https://tiktok-word-game-backend.onrender.com`

### 5. Overlays para OBS

Los overlays estarán disponibles en:

- **Stream Overlay**: `https://tiktok-word-game-frontend.onrender.com/stream-overlay`
- **Communal Objectives**: `https://tiktok-word-game-frontend.onrender.com/communal-objective-overlay`
- **Daily Ranking**: `https://tiktok-word-game-frontend.onrender.com/daily-ranking-overlay`
- **Admin Panel**: `https://tiktok-word-game-frontend.onrender.com/admin`
- **Coronas Admin**: `https://tiktok-word-game-frontend.onrender.com/coronas-admin`

### 6. Notas importantes

- **Plan gratuito**: Render ofrece 750 horas gratis por mes por servicio
- **Sleep mode**: Los servicios gratuitos se duermen después de 15 minutos de inactividad
- **Base de datos**: Supabase ya está configurado y funcionando
- **CORS**: Ya configurado para aceptar requests del frontend de Render

### 7. Monitoreo

Puedes ver los logs en tiempo real desde el dashboard de Render para depurar cualquier problema.

### 8. Actualizaciones

Cualquier push a la rama `main` desplegará automáticamente ambos servicios.