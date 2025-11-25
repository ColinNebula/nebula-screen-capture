@echo off
REM Complete build and test script
cls
echo.
echo ============================================
echo   Nebula Screen Capture
echo   Complete Build ^& Test
echo ============================================
echo.
echo This will:
echo   1. Build the application
echo   2. Create installers
echo   3. Run tests
echo.
pause

REM Build the installer
echo.
echo [1/2] Building installer...
echo ============================================
powershell -ExecutionPolicy Bypass -File build-installer.ps1

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo BUILD FAILED!
    pause
    exit /b %ERRORLEVEL%
)

REM Test the installer
echo.
echo [2/2] Testing installer...
echo ============================================
powershell -ExecutionPolicy Bypass -File test-installer.ps1

echo.
echo ============================================
echo  BUILD COMPLETE!
echo ============================================
echo.
echo Check the dist/ folder for your installers!
echo.
pause
