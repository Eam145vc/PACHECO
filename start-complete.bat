@echo off
echo ================================
echo  SISTEMA CORONAS TIKTOK - INICIO
echo ================================
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
echo Qué hacer a continuación:
echo 1. Ve a la ventana de ngrok y copia la URL HTTPS (ej: https://abc123.ngrok.io)
echo 2. En Render, configura VITE_API_BASE_URL con esa URL
echo 3. ¡Tu sistema estará accesible públicamente!
echo.
pause