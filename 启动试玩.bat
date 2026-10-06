@echo off
chcp 65001 >nul
cd /d "%~dp0"
start "英杰传原型服务器" /min cmd /c "node server.mjs"
timeout /t 1 /nobreak >nul
start "" "http://127.0.0.1:4173"
