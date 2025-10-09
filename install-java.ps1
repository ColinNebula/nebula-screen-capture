# Install Java JDK for Android Development
# This script helps you install Java JDK required for keytool

Write-Host "☕ Java JDK Installation Helper" -ForegroundColor Cyan
Write-Host ""

# Check if Java is already installed
Write-Host "Checking for existing Java installation..." -ForegroundColor Yellow
try {
    $javaVersion = java -version 2>&1 | Select-String "version"
    Write-Host "✅ Java is already installed: $javaVersion" -ForegroundColor Green
    
    # Check if keytool is available
    try {
        keytool -help | Out-Null
        Write-Host "✅ keytool is available!" -ForegroundColor Green
        Write-Host ""
        Write-Host "You can now run:" -ForegroundColor Cyan
        Write-Host "  keytool -genkey -v -keystore release-key.keystore -alias nebula-release -keyalg RSA -keysize 2048 -validity 10000" -ForegroundColor White
        exit 0
    } catch {
        Write-Host "⚠️ Java is installed but keytool is not in PATH" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Java is not installed" -ForegroundColor Red
}

Write-Host ""
Write-Host "📦 Installation Options:" -ForegroundColor Cyan
Write-Host ""

# Check for package managers
$hasChoco = Get-Command choco -ErrorAction SilentlyContinue
$hasWinget = Get-Command winget -ErrorAction SilentlyContinue

if ($hasWinget) {
    Write-Host "Option 1: Install via Winget (Recommended)" -ForegroundColor Green
    Write-Host "  winget install Microsoft.OpenJDK.17" -ForegroundColor White
    Write-Host ""
    
    $response = Read-Host "Install Java via Winget now? (y/n)"
    if ($response -eq 'y' -or $response -eq 'Y') {
        Write-Host "Installing Microsoft OpenJDK 17..." -ForegroundColor Yellow
        winget install Microsoft.OpenJDK.17
        Write-Host ""
        Write-Host "✅ Installation complete!" -ForegroundColor Green
        Write-Host "⚠️ Please restart your PowerShell terminal and try again" -ForegroundColor Yellow
        exit 0
    }
}

if ($hasChoco) {
    Write-Host "Option 2: Install via Chocolatey" -ForegroundColor Green
    Write-Host "  choco install openjdk11" -ForegroundColor White
    Write-Host ""
    
    $response = Read-Host "Install Java via Chocolatey now? (y/n)"
    if ($response -eq 'y' -or $response -eq 'Y') {
        Write-Host "Installing OpenJDK 11..." -ForegroundColor Yellow
        choco install openjdk11 -y
        Write-Host ""
        Write-Host "✅ Installation complete!" -ForegroundColor Green
        Write-Host "⚠️ Please restart your PowerShell terminal and try again" -ForegroundColor Yellow
        exit 0
    }
}

Write-Host "Option 3: Manual Installation" -ForegroundColor Green
Write-Host "  1. Download from: https://adoptium.net/" -ForegroundColor White
Write-Host "  2. Choose: Latest LTS (Java 17 or 11)" -ForegroundColor White
Write-Host "  3. Select: Windows x64 MSI installer" -ForegroundColor White
Write-Host "  4. Run installer and check 'Set JAVA_HOME' and 'Add to PATH'" -ForegroundColor White
Write-Host "  5. Restart PowerShell" -ForegroundColor White
Write-Host ""

Write-Host "Option 4: Use Android Studio's JDK (if already installed)" -ForegroundColor Green
$androidStudioPaths = @(
    "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe",
    "C:\Program Files\Android\Android Studio\jre\bin\keytool.exe"
)

foreach ($path in $androidStudioPaths) {
    if (Test-Path $path) {
        Write-Host "  ✅ Found Android Studio's keytool at:" -ForegroundColor Yellow
        Write-Host "     $path" -ForegroundColor White
        Write-Host ""
        Write-Host "  Run this command in PowerShell:" -ForegroundColor Cyan
        Write-Host '  & "' -NoNewline -ForegroundColor White
        Write-Host "$path" -NoNewline -ForegroundColor White
        Write-Host '" -genkey -v -keystore release-key.keystore -alias nebula-release -keyalg RSA -keysize 2048 -validity 10000' -ForegroundColor White
        Write-Host ""
        
        $response = Read-Host "Use Android Studio keytool now? (y/n)"
        if ($response -eq 'y' -or $response -eq 'Y') {
            Write-Host ""
            Write-Host "Running keytool..." -ForegroundColor Yellow
            & $path -genkey -v -keystore release-key.keystore -alias nebula-release -keyalg RSA -keysize 2048 -validity 10000
            exit 0
        }
        break
    }
}

Write-Host ""
Write-Host "📖 After installation:" -ForegroundColor Cyan
Write-Host "  1. Restart your PowerShell terminal" -ForegroundColor White
Write-Host "  2. Verify: java -version" -ForegroundColor White
Write-Host "  3. Run: keytool -genkey -v -keystore release-key.keystore -alias nebula-release -keyalg RSA -keysize 2048 -validity 10000" -ForegroundColor White
Write-Host ""
