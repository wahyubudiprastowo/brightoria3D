@echo off
set "PATH=%~dp0.local-node;%PATH%"
call npm run dev:full -- %*
