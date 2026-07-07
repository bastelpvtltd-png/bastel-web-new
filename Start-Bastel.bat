@echo off
title Bastel Local Launcher
echo Starting Bastel Pvt Ltd local server...

start "BastelServer" cmd /k "cd /d %~dp0backend && node server.js"

timeout /t 3 /nobreak >nul

start chrome "http://localhost:3000/index.html"

exit
