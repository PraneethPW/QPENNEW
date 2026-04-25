@echo off
setlocal

set "PROJECT_ROOT=%~dp0"
set "BACKEND_PY=C:\Users\prane\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"

echo Starting QPEN backend...
start "QPEN Backend" cmd /k "cd /d "%PROJECT_ROOT%" && "%BACKEND_PY%" app_server.py --port 8001"

echo Starting QPEN frontend...
start "QPEN Frontend" cmd /k "cd /d "%PROJECT_ROOT%frontend-react" && python -m http.server 5173"

echo.
echo QPEN is starting in two windows:
echo   Backend:  http://127.0.0.1:8001
echo   Frontend: http://127.0.0.1:5173
echo.
echo Open:
echo   http://127.0.0.1:5173/
echo   http://127.0.0.1:5173/app.html
echo.
pause
