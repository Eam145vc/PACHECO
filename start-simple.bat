@echo off
echo ================================
echo  SISTEMA CORONAS - SIN NGROK
echo ================================
echo.
echo 0. Limpiando procesos previos...
taskkill /f /im "node.exe" 2>nul >nul
timeout /t 1 /nobreak >nul
echo    ✅ Limpieza completada
echo.
echo 1. Iniciando servidor backend...
start "Backend" cmd /c "cd /d %~dp0 && npm run server"
echo    ✅ Backend iniciando en puerto 3002...
echo.
echo 2. Esperando 3 segundos...
timeout /t 3 /nobreak >nul
echo.
echo 3. Iniciando frontend...
start "Frontend" cmd /c "cd /d %~dp0 && npm run dev"
echo    ✅ Frontend iniciando...
echo.
echo ================================
echo  SERVICIOS INICIADOS
echo ================================
echo.
echo 🔧 Backend:  http://localhost:3002
echo 🌐 Frontend: http://localhost:5173
echo.
echo ⚠️  RECUERDA: Ejecuta ngrok por separado
echo     ngrok http 3002
echo.
echo URL actual en config: https://14f830f8dc90.ngrok-free.app
echo.
pause