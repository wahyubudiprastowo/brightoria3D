@echo off
set "PATH=%~dp0.local-node;%PATH%"
node "%~dp0node_modules\vite\bin\vite.js" --host 0.0.0.0 %*