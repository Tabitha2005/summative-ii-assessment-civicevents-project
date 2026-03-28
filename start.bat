@echo off
echo Stopping any process on port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
    taskkill /PID %%a /F >nul 2>&1
)
timeout /t 2 /nobreak >nul

echo.
echo Starting CivicEvents+ backend...
echo Open your browser at: http://localhost:3000
echo Press Ctrl+C to stop the server.
echo.

cd /d "%~dp0backend"
node server.js
