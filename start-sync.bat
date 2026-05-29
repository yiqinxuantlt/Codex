@echo off
setlocal
cd /d "%~dp0"
echo.
echo Reading Note Reviewer - LAN Sync
echo --------------------------------
echo This starts a local sync server for trusted Wi-Fi only.
echo Keep this window open while using phone/desktop sync.
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found. Please install Node.js or run the app in local file mode.
  pause
  exit /b 1
)
node sync-server.js
echo.
echo Sync server stopped.
pause
