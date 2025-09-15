# 🚀 Deployment Guide - Sistema de Coronas TikTok

## 📋 Opciones de Hosting Recomendadas

### 🔥 OPCIÓN 1: Railway (RECOMENDADA)
✅ **GRATIS hasta 500 horas/mes**
✅ **Deploy automático desde GitHub**
✅ **HTTPS automático**

#### Pasos para Railway:
1. **Crear cuenta gratuita**: https://railway.app/
2. **Subir código a GitHub** (crear repositorio público)
3. **Conectar GitHub a Railway**
4. **Deploy automático**

### 🚀 OPCIÓN 2: Render
✅ **Completamente GRATIS**
✅ **Deploy desde GitHub**

#### Pasos para Render:
1. **Crear cuenta**: https://render.com/
2. **Conectar repositorio GitHub**
3. **Configurar como Web Service**

### ⚡ OPCIÓN 3: Vercel
✅ **Perfecto para el frontend**
✅ **Deploy instantáneo**

## 🔧 Configuración de Variables de Entorno

Configurar en tu plataforma de hosting:

```bash
NODE_ENV=production
PORT=3002
```

## 📁 Estructura del Proyecto

```
tiktok-word-game/
├── src/                    # Frontend React
├── server/                 # Backend Express
├── Dockerfile             # Configuración Docker
├── railway.json           # Configuración Railway
└── package.json           # Dependencias principales
```

## 🌐 URLs del Sistema Desplegado

Después del deployment, tendrás acceso a:

- **🏠 Página Principal**: `https://tu-app.railway.app/`
- **🎮 Panel Admin**: `https://tu-app.railway.app/admin`
- **💎 Sistema Coronas**: `https://tu-app.railway.app/coronas`
- **🔧 API Backend**: `https://tu-app.railway.app/ping`

## 🔍 Verificación Post-Deployment

1. **Verificar servidor**: `GET /ping`
2. **Probar API usuarios**: `GET /users`
3. **Probar API productos**: `GET /products`
4. **Verificar frontend**: Navegar a `/coronas`

## 📞 Soporte

Si tienes problemas con el deployment, verifica:
- ✅ Variables de entorno configuradas
- ✅ Puerto configurado correctamente
- ✅ Logs del servidor sin errores
- ✅ Base de datos inicializada