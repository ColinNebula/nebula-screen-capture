param(
    [switch]$Clean,
    [switch]$SkipBuild,
    [ValidateSet("all", "msi", "nsis")]
    [string]$Target = "all"
)

$ErrorActionPreference = "Stop"

Write-Host "`n=== Nebula Screen Capture - Windows Installer Builder ===" -ForegroundColor Cyan
Write-Host "Tauri + Svelte + Vite`n" -ForegroundColor Gray

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "[OK] Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js not found" -ForegroundColor Red
    exit 1
}

try {
    $rustVersion = rustc --version
    Write-Host "[OK] Rust: $rustVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Rust not found. Install from https://rustup.rs/" -ForegroundColor Red
    exit 1
}

# Clean if requested
if ($Clean) {
    Write-Host "`nCleaning build artifacts..." -ForegroundColor Yellow
    if (Test-Path "build") { Remove-Item -Path "build" -Recurse -Force }
    if (Test-Path "src-tauri\target") { Remove-Item -Path "src-tauri\target" -Recurse -Force }
    Write-Host "[OK] Clean complete" -ForegroundColor Green
}

# Install dependencies
Write-Host "`nInstalling dependencies..." -ForegroundColor Yellow
npm install
Write-Host "[OK] Dependencies installed" -ForegroundColor Green

# Build frontend
if (-not $SkipBuild) {
    Write-Host "`nBuilding frontend..." -ForegroundColor Yellow
    npm run build
    Write-Host "[OK] Frontend built" -ForegroundColor Green
} else {
    Write-Host "`nSkipping frontend build" -ForegroundColor Gray
}

# Build Tauri
Write-Host "`nBuilding Tauri installer..." -ForegroundColor Yellow
Write-Host "This may take several minutes...`n"

if ($Target -eq "msi") {
    npx tauri build --bundles msi
} elseif ($Target -eq "nsis") {
    npx tauri build --bundles nsis
} else {
    npx tauri build
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n[OK] Build complete!" -ForegroundColor Green
    Write-Host "Installers located in: src-tauri\target\release\bundle\" -ForegroundColor Cyan
} else {
    Write-Host "`n[ERROR] Build failed" -ForegroundColor Red
    exit 1
}
