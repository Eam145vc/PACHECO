# 📺 TikTok Live Integration - Guía de Instalación y Uso

## 🚀 **¿Qué hace esta integración?**

Esta integración conecta tu juego de palabras con **TikTok Live en tiempo real** para:

- **🎯 Detectar automáticamente** quién fue el primero en responder correctamente
- **🏆 Activar triggers** de premios y coronas automáticamente  
- **💬 Leer comentarios del live** en tiempo real
- **🔄 Reconexión automática** si se pierde la conexión
- **📊 Estado persistente** de conexión

---

## 📋 **Requisitos Previos**

1. **Python 3.8+** instalado en tu sistema
   - Descarga desde: https://python.org/downloads/
   - ✅ Asegúrate de marcar "Add Python to PATH"

2. **Cuenta de TikTok** con el username que usarás
   - El usuario debe estar **haciendo live** para conectarse

---

## 🔧 **Instalación**

### **¡Instalación AUTOMÁTICA!** 🚀

**No necesitas instalar nada manualmente.** El sistema se encarga de todo:

1. **Ejecuta el juego** con `START.bat` o `npm start`
2. **Python se instala automáticamente** si no lo tienes
3. **Dependencias se instalan automáticamente** la primera vez
4. **¡Listo para usar!** 🎉

### **Si tienes problemas (Instalación Manual)**

```bash
# Solo si la automática falla
cd server
pip install -r requirements.txt
```

---

## 🎮 **Cómo Usar**

### **1. Iniciar Todo con UN SOLO COMANDO** ✨

**Opción 1: Script Simple (Recomendado)**
```bash
# Doble clic en START.bat 
# O desde terminal:
START.bat
```

**Opción 2: NPM Command**
```bash
npm start
```

**¡Eso es todo!** 🎉 Un solo comando inicia:
- ✅ Frontend (React) 
- ✅ Backend (Express)
- ✅ Servidor Python TikTok Live
- ✅ Instalación automática de dependencias Python

### **2. Configurar en el Panel Admin**

1. Ve a: http://localhost:5173/admin
2. En el **header rojo "TikTok Live"**:
   - 📝 Ingresa tu usuario de TikTok (sin @)
   - 💾 Se guardará automáticamente
   - 🔴 Haz clic en "Conectar al Live"

### **3. ¡Comienza a Jugar!**

1. **Inicia una frase** en el juego
2. **Los usuarios del live** escriben la respuesta en los comentarios
3. **El sistema detecta automáticamente** quién respondió primero
4. **Se activan los triggers** de premios/coronas

---

## 🎯 **Estados de Conexión**

| Estado | Color | Significado |
|--------|-------|-------------|
| 🔴 **Conectado** | Verde | ✅ Leyendo comentarios del live |
| 🔄 **Conectando** | Amarillo | ⏳ Estableciendo conexión |
| ⚫ **Desconectado** | Gris | ❌ No conectado al live |

---

## 🔧 **Solución de Problemas**

### **"Error instalando TikTokLive"**
```bash
pip install --upgrade pip
pip install TikTokLive aiohttp
```

### **"No se puede conectar al usuario"**
- ✅ Verifica que el usuario esté **haciendo live ahora**
- ✅ Escribe el username **sin @**
- ✅ Verifica tu conexión a internet

### **"Python no encontrado"**
- Instala Python desde: https://python.org/downloads/
- ✅ Marca "Add Python to PATH" durante instalación

---

## 🏗️ **Arquitectura del Sistema**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React App     │    │  Express Server  │    │  Python Server  │
│  (Frontend)     │◄──►│   (Backend)      │◄──►│  (TikTok Live)  │
│                 │    │                  │    │                 │
│ • Panel Admin   │    │ • Game Logic     │    │ • Chat Reader   │
│ • TikTok Header │    │ • API Endpoints  │    │ • Auto Detect   │
│ • Game Display  │    │ • Corona System  │    │ • Reconnection  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │  Local Storage  │    │   TikTok Live   │
                       │ • Game State    │    │ • Real Comments │
                       │ • Settings      │    │ • Live Events   │
                       └─────────────────┘    └─────────────────┘
```

---

## 📝 **Funcionalidades**

### **✅ Ya Implementado:**
- 🔗 Conexión a TikTok Live
- 💬 Lectura de comentarios en tiempo real
- 🎯 Detección de respuestas correctas
- 🔄 Reconexión automática
- 💾 Persistencia de configuración
- 🎮 Integración con el juego existente

### **🚧 Por Implementar (próximamente):**
- 🎁 Sistema de triggers por regalos
- 🏆 Premios automáticos por primer usuario
- 📊 Dashboard de estadísticas del live
- 🔔 Notificaciones push

---

## 🐛 **Debug y Logs**

### **Ver logs del servidor Python:**
```bash
# Los logs aparecen automáticamente en la consola
python tiktok_live_server.py
```

### **Ver logs del servidor Express:**
```bash
# Los eventos aparecen con prefijo [TikTok Live]
npm run server
```

---

## 🤝 **Contribuciones**

¿Tienes ideas para mejorar la integración? ¡Contribuye!

1. 🍴 Fork del repositorio
2. 🌿 Crea una rama nueva
3. 💡 Implementa tu mejora
4. 📬 Envía un pull request

---

## 📞 **Soporte**

Si tienes problemas:

1. 📋 Revisa esta documentación
2. 🔍 Verifica los logs en consola
3. 🐛 Reporta bugs con detalles específicos

---

## 🎉 **¡Disfruta tu juego con TikTok Live!**

Con esta integración, tu juego de palabras ahora puede:
- **Detectar ganadores automáticamente** 🏆
- **Interactuar con tu audiencia** en tiempo real 💬
- **Crear experiencias únicas** en tus lives 🎯

¡Que tengas un excelente streaming! 🚀