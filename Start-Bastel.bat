@echo off
title Bastel Local Launcher
echo Starting Bastel Pvt Ltd local servers...

start "BastelBackend" cmd /k "cd /d %~dp0backend && node server.js"
start "BastelFrontend" cmd /k "cd /d %~dp0 && node frontend-server.js"

timeout /t 3 /nobreak >nul

start chrome "http://localhost:5500/index.html"

exit
