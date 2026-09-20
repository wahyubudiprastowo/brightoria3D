@echo off
set "PATH=%~dp0.local-node;%PATH%"
node "%~dp0node_modules\typescript\bin\tsc" -b && node "%~dp0node_modules\vite\bin\vite.js" build %*