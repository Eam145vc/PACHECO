# 🎮 TikTok Word Game with Live Integration

Un juego interactivo de adivinar palabras completamente integrado con **TikTok Live** para detectar respuestas automáticamente.

## 🚀 **Inicio Rápido - UN SOLO COMANDO**

```bash
# Método 1: Script Simple (Recomendado)
START.bat

# Método 2: NPM
npm start
```

¡Eso es todo! 🎉 Automáticamente inicia:
- ✅ Frontend (React + Vite)
- ✅ Backend (Express + TikTok Bot)  
- ✅ TikTok Live Integration (Python)
- ✅ Instalación automática de dependencias

## 🔗 **URLs del Sistema**

- 🎮 **Juego Principal**: http://localhost:5173
- ⚙️ **Panel Admin**: http://localhost:5173/admin
- 👑 **Sistema Coronas**: http://localhost:5173/coronas
- 📡 **API Backend**: http://localhost:3002

## ✨ **Características Principales**

### 🎯 **Juego de Palabras**
- Frases categorizadas (Tecnología, Comida, Lugares, etc.)
- Revelación manual de vocales y consonantes
- Sistema de puntuación con coronas
- Múltiples niveles de dificultad

### 📺 **Integración TikTok Live**
- **Detección automática** de respuestas en el chat
- **Primer usuario** que responde correctamente gana
- **Reconexión automática** si se pierde conexión
- **Estado en tiempo real** del live

### 🏪 **Sistema de Coronas**
- Tienda virtual con productos personalizables
- Sistema de canje con códigos de verificación
- Panel de administración completo
- Historial de transacciones

### 🤖 **Bot de TikTok**
- Envío automático de mensajes
- Navegador automatizado (Puppeteer)
- Cookies persistentes
- Auto-login

## 📋 **Requisitos**

- **Node.js** (v16+)
- **Python** (v3.8+) - Se instala automáticamente
- **NPM** o **Yarn**

## 🛠️ **Desarrollo**

```bash
# Instalar dependencias
npm install

# Desarrollo completo
npm start

# Solo frontend
npm run dev

# Solo backend
npm run server
```

## 📁 **Estructura del Proyecto**

```
tiktok-word-game/
├── src/                    # Frontend React
│   ├── components/         # Componentes React
│   ├── pages/             # Páginas principales
│   ├── services/          # APIs y servicios
│   └── contexts/          # Contextos de estado
├── server/                # Backend Express + Python
│   ├── index.js           # Servidor principal
│   ├── tiktok_live_server.py  # Integración TikTok Live
│   ├── tiktokLiveManager.js   # Gestor proceso Python
│   └── requirements.txt   # Dependencias Python
└── START.bat             # Inicio con un click
```

## 🎯 **Cómo Usar con TikTok Live**

1. **Ejecuta**: `START.bat`
2. **Ve al Panel Admin**: http://localhost:5173/admin
3. **Configura tu usuario** de TikTok en el header rojo
4. **Conecta al live** con el botón
5. **Inicia una frase** en el juego
6. **Los usuarios del live** escriben la respuesta
7. **¡El sistema detecta automáticamente quién respondió primero!** 🏆

## 🐛 **Troubleshooting**

### Error: Python no encontrado
```bash
# Instala Python desde: https://python.org/downloads/
# Marca "Add Python to PATH" durante instalación
```

### Error: Dependencias de Python
```bash
cd server
pip install -r requirements.txt
```

### Error: No se puede conectar al live
- ✅ Verifica que el usuario esté **haciendo live ahora**
- ✅ Escribe el username **sin @**
- ✅ Verifica tu conexión a internet

## 🤝 **Contribuir**

1. Fork el repositorio
2. Crea una rama nueva (`git checkout -b feature/nueva-funcionalidad`)  
3. Commit tus cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear un Pull Request

## 🌐 **Deployment Público**

### Para Render.com:

**Build Command:**
```bash
npm run render-build
```

**Start Command:**
```bash
npm run render-start
```

**Variables de Entorno:**
- `NODE_ENV=production`
- `PORT=10000`

## 📄 **Licencia**

Este proyecto está bajo la Licencia MIT.

---

**¡Disfruta tu juego interactivo con TikTok Live!** 🎉📺