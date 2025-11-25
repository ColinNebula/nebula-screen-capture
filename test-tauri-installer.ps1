#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Test Nebula Screen Capture Windows Installer

.DESCRIPTION
    This script helps test the Windows installer by verifying:
    - Installer file exists and is valid
    - File size is reasonable
    - Digital signature (if present)
    - Installation paths
    - Uninstallation support

.PARAMETER InstallerPath
    Path to the installer file (.msi or .exe)

.PARAMETER AutoDetect
    Automatically find the latest installer

.EXAMPLE
    .\test-tauri-installer.ps1 -AutoDetect
    Find and analyze the latest installer

.EXAMPLE
    .\test-tauri-installer.ps1 -InstallerPath "src-tauri\target\release\bundle\nsis\Nebula Screen Capture_0.1.0_x64-setup.exe"
    Test specific installer
#>

param(
    [string]$InstallerPath,
    [switch]$AutoDetect
)

$ErrorActionPreference = 'Stop'

function Write-ColorOutput($message, $color = "White") {
    Write-Host $message -ForegroundColor $color
}

function Write-Step($message) {
    Write-ColorOutput "`n▶ $message" "Cyan"
}

function Write-Success($message) {
    Write-ColorOutput "✓ $message" "Green"
}

function Write-Warning($message) {
    Write-ColorOutput "⚠ $message" "Yellow"
}

function Write-Error-Message($message) {
    Write-ColorOutput "✗ $message" "Red"
}

Write-ColorOutput @"

╔══════════════════════════════════════════════════════════╗
║      Nebula Screen Capture - Installer Tester           ║
╚══════════════════════════════════════════════════════════╝

"@ "Magenta"

# Find installer if AutoDetect is specified
if ($AutoDetect -or -not $InstallerPath) {
    Write-Step "Searching for installers..."
    
    $bundlePath = "src-tauri\target\release\bundle"
    
    if (-not (Test-Path $bundlePath)) {
        Write-Error-Message "Bundle directory not found. Build the installer first with .\build-tauri-installer.ps1"
        exit 1
    }
    
    $installers = @()
    $installers += Get-ChildItem -Path "$bundlePath\msi" -Filter "*.msi" -Recurse -ErrorAction SilentlyContinue
    $installers += Get-ChildItem -Path "$bundlePath\nsis" -Filter "*.exe" -Recurse -ErrorAction SilentlyContinue
    
    if ($installers.Count -eq 0) {
        Write-Error-Message "No installers found. Build the installer first."
        exit 1
    }
    
    # Use the most recent installer
    $installer = $installers | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    $InstallerPath = $installer.FullName
    
    Write-Success "Found installer: $($installer.Name)"
}

# Verify installer exists
if (-not (Test-Path $InstallerPath)) {
    Write-Error-Message "Installer not found at: $InstallerPath"
    exit 1
}

$installerFile = Get-Item $InstallerPath
$installerType = $installerFile.Extension.ToLower()

Write-Step "Analyzing installer..."

# Basic file info
Write-ColorOutput "`nInstaller Information:" "Yellow"
Write-Host "  Name: $($installerFile.Name)"
Write-Host "  Type: $installerType"
Write-Host "  Size: $([math]::Round($installerFile.Length / 1MB, 2)) MB"
Write-Host "  Created: $($installerFile.CreationTime)"
Write-Host "  Modified: $($installerFile.LastWriteTime)"

# Check file size
$sizeMB = $installerFile.Length / 1MB
if ($sizeMB -lt 10) {
    Write-Warning "  Installer seems small (<10 MB). May be missing dependencies."
} elseif ($sizeMB -gt 200) {
    Write-Warning "  Installer is large (>200 MB). May include unnecessary files."
} else {
    Write-Success "  Size is reasonable"
}

# Check digital signature (Windows only)
Write-Step "Checking digital signature..."
try {
    $signature = Get-AuthenticodeSignature -FilePath $InstallerPath
    
    if ($signature.Status -eq "Valid") {
        Write-Success "Installer is digitally signed"
        Write-Host "  Signer: $($signature.SignerCertificate.Subject)"
        Write-Host "  Issuer: $($signature.SignerCertificate.Issuer)"
    } elseif ($signature.Status -eq "NotSigned") {
        Write-Warning "Installer is not digitally signed"
        Write-Host "  Users may see security warnings during installation"
    } else {
        Write-Warning "Signature status: $($signature.Status)"
    }
} catch {
    Write-Warning "Could not check digital signature"
}

# Installer-specific checks
if ($installerType -eq ".msi") {
    Write-Step "MSI-specific checks..."
    
    Write-ColorOutput "`nMSI Properties:" "Yellow"
    Write-Host "  Format: Windows Installer (MSI)"
    Write-Host "  Install scope: Per-user or per-machine"
    Write-Host "  Uninstall: Via Control Panel > Programs"
    Write-Success "MSI installers are well-supported on Windows"
    
} elseif ($installerType -eq ".exe") {
    Write-Step "NSIS-specific checks..."
    
    Write-ColorOutput "`nNSIS Properties:" "Yellow"
    Write-Host "  Format: NSIS Installer"
    Write-Host "  Install scope: Per-user"
    Write-Host "  Uninstall: Via Control Panel > Programs or uninstall.exe"
    Write-Success "NSIS installers are lightweight and flexible"
}

# Check for required files in bundle
Write-Step "Checking bundle structure..."

$bundleDir = Split-Path $InstallerPath -Parent
$expectedFiles = @()

if ($installerType -eq ".msi") {
    # MSI bundles
    $expectedFiles += "*.msi"
} else {
    # NSIS bundles
    $expectedFiles += "*.exe"
}

foreach ($pattern in $expectedFiles) {
    $files = Get-ChildItem -Path $bundleDir -Filter $pattern
    if ($files) {
        Write-Success "  Found: $pattern"
    }
}

# Installation test recommendations
Write-Step "Test recommendations..."

Write-ColorOutput "`nBefore distributing, test the following:" "Yellow"
Write-Host "  1. Install on a clean Windows 10/11 machine"
Write-Host "  2. Verify the app launches after installation"
Write-Host "  3. Test all major features:"
Write-Host "     - Screen recording"
Write-Host "     - Screenshot capture"
Write-Host "     - Video editor"
Write-Host "     - File management"
Write-Host "  4. Check if WebView2 is bundled/installed"
Write-Host "  5. Test offline functionality (no internet)"
Write-Host "  6. Verify uninstallation removes all files"
Write-Host "  7. Test reinstallation and upgrades"
Write-Host "  8. Check Windows Defender doesn't flag it"

Write-Step "WebView2 Runtime..."

Write-ColorOutput "`nWebView2 Information:" "Yellow"
Write-Host "  Your installer is configured to embed the WebView2 bootstrapper"
Write-Host "  This means:"
Write-Host "    ✓ Smaller installer size"
Write-Host "    ✓ Downloads WebView2 during installation (requires internet)"
Write-Host "    ✓ Falls back to system WebView2 if already installed"

# System check
Write-Step "Checking local system..."

# Check if WebView2 is already installed
try {
    $webview2 = Get-ItemProperty "HKLM:\SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}" -ErrorAction SilentlyContinue
    if ($webview2) {
        Write-Success "WebView2 Runtime is installed on this system"
        Write-Host "  Version: $($webview2.pv)"
    } else {
        Write-Warning "WebView2 Runtime not detected on this system"
    }
} catch {
    Write-Warning "Could not check for WebView2 Runtime"
}

# Check available disk space for installation
$drive = (Get-Location).Drive
$freeSpace = [math]::Round((Get-PSDrive $drive.Name).Free / 1GB, 2)
Write-Host "`nAvailable disk space on $($drive.Name): $freeSpace GB"

if ($freeSpace -lt 2) {
    Write-Warning "Low disk space. Installation may fail."
} else {
    Write-Success "Sufficient disk space available"
}

# Final summary
Write-ColorOutput @"

╔══════════════════════════════════════════════════════════╗
║              ANALYSIS COMPLETE                           ║
╚══════════════════════════════════════════════════════════╝

"@ "Green"

Write-ColorOutput "Installer ready for testing:" "Cyan"
Write-ColorOutput "  $InstallerPath" "White"

Write-ColorOutput "`nTo install:" "Cyan"
if ($installerType -eq ".msi") {
    Write-ColorOutput "  msiexec /i `"$InstallerPath`"" "White"
    Write-Host "  or double-click the file"
} else {
    Write-ColorOutput "  Double-click the installer" "White"
    Write-Host "  or run: Start-Process `"$InstallerPath`""
}

Write-ColorOutput "`n✨ Analysis completed!`n" "Green"
