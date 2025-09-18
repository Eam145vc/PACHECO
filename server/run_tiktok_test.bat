@echo off
echo ==========================================
echo  TikTok Live Data Extraction Test
echo ==========================================
echo.
echo Conectando a @wahanfx en TikTok Live...
echo Detectara 1 evento y extraera todos los datos
echo.
cd /d "%~dp0"
python tiktok_test_script.py --username wahanfx
echo.
echo ==========================================
echo  Test completado!
echo ==========================================
echo.
if exist "tiktok_data_extraction.json" (
    echo Datos guardados en: tiktok_data_extraction.json
    echo.
    echo Contenido del archivo:
    echo ==========================================
    type tiktok_data_extraction.json
    echo.
    echo ==========================================
) else (
    echo No se generaron datos de salida.
)
echo.
pause