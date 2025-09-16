@echo off
echo ================================
echo  SISTEMA CORONAS TIKTOK - INICIO
echo ================================
echo.
echo 🔍 Verificando configuración de ngrok...
ngrok config check >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ CONFIGURACIÓN REQUERIDA: ngrok necesita autenticación
    echo.
    echo 📋 PASOS PARA CONFIGURAR NGROK:
    echo 1. Ve a: https://ngrok.com/signup
    echo 2. Crea cuenta GRATIS
    echo 3. Ve a: https://dashboard.ngrok.com/get-started/your-authtoken
    echo 4. Copia tu authtoken
    echo 5. Ejecuta: ngrok config add-authtoken TU_TOKEN_AQUI
    echo.
    echo 💡 O ejecuta este comando con tu token:
    echo    ngrok config add-authtoken PEGA_TU_TOKEN_AQUI
    echo.
    echo Después de configurar, ejecuta este script de nuevo.
    pause
    exit /b 1
)
echo ✅ ngrok configurado correctamente
echo.
echo 1. Iniciando servidor backend...
cd server
start "Backend TikTok Coronas" cmd /k "node index.js"
echo    ✅ Backend iniciado en: http://localhost:3002
echo.
echo 2. Esperando 3 segundos para que el servidor esté listo...
timeout /t 3 /nobreak >nul
echo.
echo 3. Iniciando ngrok para exponer puerto público...
start "ngrok Tunnel" cmd /k "ngrok http 3002"
echo    ⚠️ IMPORTANTE: Copia la URL HTTPS de ngrok para usar en Render
echo.
echo ================================
echo  AMBOS SERVICIOS INICIADOS
echo ================================
echo.
echo 📋 QUÉ HACER A CONTINUACIÓN:
echo 1. Ve a la ventana de ngrok y copia la URL HTTPS
echo    Ejemplo: https://abc123.ngrok.io
echo 2. En Render, configura VITE_API_BASE_URL con esa URL
echo 3. ¡Tu sistema estará accesible públicamente!
echo.
echo 🔄 La URL cambia cada vez que reinicias ngrok (versión gratis)
echo 💰 Para URL fija: ngrok Pro (8 USD/mes)
echo.
pause