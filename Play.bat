@echo off
title Naruto: Seventh Dawn
cd /d "%~dp0"
echo.
echo  NARUTO: SEVENTH DAWN  (unofficial fan game, 18+)
echo  ------------------------------------------------
echo  Looking for your art in "naruto characters", "sprite" and "music"...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\scan-assets.ps1"
echo  Starting the game in your browser...
start "" "%~dp0index.html"
timeout /t 3 >nul
