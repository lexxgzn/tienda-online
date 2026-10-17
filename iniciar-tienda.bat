@echo off
title MiTienda Online - Iniciando...
color 0A

echo.
echo  ==========================================
echo    MiTienda Online - Iniciando servidor
echo  ==========================================
echo.

:: Ruta de ngrok
set NGROK="C:\Users\leog9\AppData\Local\Microsoft\WinGet\Packages\Ngrok.Ngrok_Microsoft.Winget.Source_8wekyb3d8bbwe\ngrok.exe"

:: Iniciar servidor Node en ventana aparte
echo  [1/2] Iniciando servidor Node.js en puerto 3000...
start "Servidor Node - MiTienda" cmd /k "cd /d "%~dp0" && node server.js"

:: Esperar 3 segundos a que el servidor arranque
timeout /t 3 /nobreak >nul

:: Iniciar ngrok en ventana aparte
echo  [2/2] Iniciando tunel ngrok...
start "Tunel ngrok - MiTienda" cmd /k "%NGROK% http 3000"

:: Esperar a que ngrok levante
timeout /t 4 /nobreak >nul

:: Abrir el dashboard de ngrok en el navegador para ver el link
echo.
echo  Abriendo dashboard de ngrok en tu navegador...
echo  -> Busca la linea "Forwarding" para ver tu link publico
echo.
start http://localhost:4040

echo  ==========================================
echo   Listo! Revisa el navegador para el link
echo   El link luce asi: https://xxxx.ngrok-free.app
echo  ==========================================
echo.
pause
