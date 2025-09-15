# ⚙️ Configuración Local del Juego TikTok

## 🎯 **Setup Completo**

### **1. Sistema Dividido:**
- **🏠 Local (tu PC):** Juego completo + TikTok Bot + Admin Panel
- **☁️ Render (público):** Solo consulta de coronas para jugadores

### **2. Configuración Inicial:**

1. **Clonar y configurar:**
   ```bash
   git clone https://github.com/Eam145vc/PACHECO.git
   cd PACHECO
   cp .env.example .env
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   cd server
   npm install
   cd ..
   ```

3. **Verificar archivo .env:**
   ```env
   PORT=3002
   NODE_ENV=development
   TIKTOK_HEADLESS=false
   TIKTOK_AUTO_START=true
   CORONAS_API_URL=https://pacheco-ixg9.onrender.com
   DEBUG=true
   ```

### **3. Ejecutar el juego:**
```bash
npm run start
```

Esto iniciará:
- ✅ Frontend del juego: http://localhost:5173
- ✅ Servidor backend: http://localhost:3002
- ✅ Panel Admin: http://localhost:5173/admin
- ✅ Sistema coronas local: http://localhost:5173/coronas
- ✅ TikTok Bot (automático)

### **4. URLs Importantes:**

**🏠 Local (solo tú):**
- Juego: http://localhost:5173
- Admin Panel: http://localhost:5173/admin
- Servidor: http://localhost:3002

**☁️ Público (jugadores):**
- Consulta Coronas: https://pacheco-ixg9.onrender.com

### **5. Flujo de Funcionamiento:**

1. **Juegas localmente** en tu PC
2. **Jugadores ganan coronas** → Se guardan localmente
3. **Automáticamente se sincronizan** → Sistema público en Render
4. **Jugadores consultan** sus coronas en https://pacheco-ixg9.onrender.com

### **6. Comandos Útiles:**

```bash
# Desarrollo completo
npm run start

# Solo frontend
npm run dev

# Solo backend
npm run server

# Build para producción
npm run build
```

### **7. Configurar Render (ya hecho):**
- Repositorio: Rama `coronas-only`
- URL: https://pacheco-ixg9.onrender.com
- Se actualiza automáticamente cuando ejecutes el juego local

## 🔧 **Resolución de Problemas:**

**Si el TikTok Bot no funciona:**
- Verifica que Chrome esté instalado
- Revisa las cookies en `server/sendMessage.js`

**Si no sincroniza coronas:**
- Verifica que `CORONAS_API_URL` esté en `.env`
- Comprueba que https://pacheco-ixg9.onrender.com esté funcionando

**Si hay problemas de puertos:**
- Cambia `PORT=3002` en `.env` por otro puerto libre