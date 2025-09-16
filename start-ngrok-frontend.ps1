Write-Host "Iniciando ngrok para exponer el frontend en puerto 5174..." -ForegroundColor Green
Write-Host ""
Write-Host "¡IMPORTANTE! Copia la URL HTTPS que aparece abajo para usar en OBS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "La URL sera algo como: https://abc123.ngrok.io/game" -ForegroundColor Cyan
Write-Host ""
& ngrok http 5174