@echo off
title Bastel Local Stopper
echo Stopping Bastel Pvt Ltd local server...

taskkill /FI "WINDOWTITLE eq BastelServer*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq BastelBackend*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq BastelFrontend*" /T /F >nul 2>&1

echo Done — Bastel local server stopped.
pause
