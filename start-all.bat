@echo off
echo ===============================================
echo    INICIANDO JUEGO DE PALABRAS TIKTOK
echo ===============================================
echo.

echo [1/2] Iniciando servidor backend...
start "Backend Server" cmd /k "cd /d "%~dp0server" && node index.js"

echo [2/2] Esperando 3 segundos...
timeout /t 3 /nobreak > nul

echo [2/2] Iniciando servidor frontend...
start "Frontend Server" cmd /k "cd /d "%~dp0" && npm run dev"

echo.
echo ===============================================
echo    SERVIDORES INICIADOS
echo ===============================================
echo Backend: http://localhost:3002
echo Frontend: Se mostrara en la segunda ventana
echo Admin Panel: Accede desde el frontend /admin
echo ===============================================
echo.
echo Presiona cualquier tecla para cerrar este launcher...
pause > nul