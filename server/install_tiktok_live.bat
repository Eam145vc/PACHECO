@echo off
echo ====================================
echo   INSTALACION TIKTOK LIVE INTEGRATION
echo ====================================
echo.

echo [1/3] Verificando Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python no esta instalado. Por favor instala Python 3.8+ desde https://python.org/downloads/
    pause
    exit /b 1
)
echo ✅ Python encontrado

echo.
echo [2/3] Instalando dependencias de Python...
python -m pip install --upgrade pip
python -m pip install -r requirements.txt

if errorlevel 1 (
    echo ❌ Error instalando dependencias. Verifica tu conexion a internet.
    pause
    exit /b 1
)
echo ✅ Dependencias instaladas correctamente

echo.
echo [3/3] Verificando instalacion...
python -c "from TikTokLive import TikTokLiveClient; print('✅ TikTokLive instalado correctamente')"

if errorlevel 1 (
    echo ❌ Error verificando la instalacion
    pause
    exit /b 1
)

echo.
echo ========================================
echo   ✅ INSTALACION COMPLETADA CON EXITO
echo ========================================
echo.
echo Para usar:
echo 1. Ejecuta: npm run server (para el servidor Express)
echo 2. Ejecuta: python tiktok_live_server.py (para TikTok Live)
echo 3. Ve al panel admin en http://localhost:5173/admin
echo.
pause