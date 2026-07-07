@echo off
title Bastel Local Stopper
echo Stopping Bastel Pvt Ltd local servers...

taskkill /FI "WINDOWTITLE eq BastelBackend*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq BastelFrontend*" /T /F >nul 2>&1

echo Done — all Bastel local servers stopped.
pause
