@echo off
REM Quick installer build script
echo.
echo ========================================
echo  Nebula Screen Capture - Quick Build
echo ========================================
echo.

REM Run the PowerShell build script
powershell -ExecutionPolicy Bypass -File build-installer.ps1

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Build failed! Press any key to exit...
    pause >nul
    exit /b %ERRORLEVEL%
)

echo.
echo Press any key to exit...
pause >nul
