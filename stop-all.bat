@echo off
echo ================================
echo  TERMINANDO TODOS LOS PROCESOS
echo ================================
echo.

echo 1. Terminando solo procesos Node.js del proyecto...
netstat -ano | findstr :3002 > temp_ports.txt 2>nul
if exist temp_ports.txt (
    for /f "tokens=5" %%a in (temp_ports.txt) do (
        echo    Terminando proceso en puerto 3002 (PID %%a)
        taskkill /pid %%a /f 2>nul
    )
    del temp_ports.txt
)

netstat -ano | findstr :5173 > temp_ports.txt 2>nul
if exist temp_ports.txt (
    for /f "tokens=5" %%a in (temp_ports.txt) do (
        echo    Terminando proceso en puerto 5173 (PID %%a)
        taskkill /pid %%a /f 2>nul
    )
    del temp_ports.txt
)

echo.
echo 2. Terminando solo procesos Python con TikTok Live...
wmic process where "name='python.exe' and commandline like '%%tiktok_live_simple.py%%'" delete 2>nul
wmic process where "name='python3.exe' and commandline like '%%tiktok_live_simple.py%%'" delete 2>nul

echo.
echo 3. Terminando ventanas de CMD relacionadas...
taskkill /fi "WindowTitle eq Backend*" /f 2>nul
taskkill /fi "WindowTitle eq Frontend*" /f 2>nul

echo.
echo ================================
echo  TODOS LOS PROCESOS TERMINADOS
echo ================================
echo.
echo ✅ Ahora puedes ejecutar start-simple.bat de nuevo
echo.
pause