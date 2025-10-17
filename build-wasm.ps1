# Build script for WebAssembly modules (Windows PowerShell)
# Requires Emscripten SDK to be installed and activated

Write-Host "Building Nebula Screen Capture WASM Modules..." -ForegroundColor Cyan

# Check if em++ is available
$emppPath = Get-Command em++ -ErrorAction SilentlyContinue
if (-not $emppPath) {
    Write-Host "Error: Emscripten not found." -ForegroundColor Red
    Write-Host "Please install and activate emsdk first:" -ForegroundColor Yellow
    Write-Host "cd emsdk; .\emsdk install latest; .\emsdk activate latest" -ForegroundColor Yellow
    exit 1
}

# Create output directory
New-Item -Path "public\wasm" -ItemType Directory -Force | Out-Null

# Build Video Encoder
Write-Host "Building video-encoder.wasm..." -ForegroundColor Yellow
em++ src\wasm\video-encoder.cpp `
    -O3 `
    -s WASM=1 `
    -s MODULARIZE=1 `
    -s EXPORT_ES6=1 `
    -s EXPORT_NAME="createVideoEncoderModule" `
    -s ALLOW_MEMORY_GROWTH=1 `
    -s MAXIMUM_MEMORY=512MB `
    --bind `
    -o public\wasm\video-encoder.js

if ($LASTEXITCODE -eq 0) {
    Write-Host "video-encoder.wasm built successfully" -ForegroundColor Green
} else {
    Write-Host "Failed to build video-encoder.wasm" -ForegroundColor Red
    exit 1
}

# Build Audio Processor
Write-Host "Building audio-processor.wasm..." -ForegroundColor Yellow
em++ src\wasm\audio-processor.cpp `
    -O3 `
    -s WASM=1 `
    -s MODULARIZE=1 `
    -s EXPORT_ES6=1 `
    -s EXPORT_NAME="createAudioProcessorModule" `
    -s ALLOW_MEMORY_GROWTH=1 `
    -s MAXIMUM_MEMORY=256MB `
    --bind `
    -o public\wasm\audio-processor.js

if ($LASTEXITCODE -eq 0) {
    Write-Host "audio-processor.wasm built successfully" -ForegroundColor Green
} else {
    Write-Host "Failed to build audio-processor.wasm" -ForegroundColor Red
    exit 1
}

# Build Frame Differ (NEW - for recording preview optimization)
Write-Host "Building frame-differ.wasm..." -ForegroundColor Yellow
em++ src\wasm\frame-differ.cpp `
    -O3 `
    -s WASM=1 `
    -s MODULARIZE=1 `
    -s EXPORT_ES6=1 `
    -s EXPORT_NAME="createFrameDifferModule" `
    -s ALLOW_MEMORY_GROWTH=1 `
    -s MAXIMUM_MEMORY=128MB `
    --bind `
    -o public\wasm\frame-differ.js

if ($LASTEXITCODE -eq 0) {
    Write-Host "frame-differ.wasm built successfully" -ForegroundColor Green
} else {
    Write-Host "Failed to build frame-differ.wasm" -ForegroundColor Red
    exit 1
}

# Build Thumbnail Generator (NEW - for virtual scrolling optimization)
Write-Host "Building thumbnail-generator.wasm..." -ForegroundColor Yellow
em++ src\wasm\thumbnail-generator.cpp `
    -O3 `
    -s WASM=1 `
    -s MODULARIZE=1 `
    -s EXPORT_ES6=1 `
    -s EXPORT_NAME="createThumbnailGeneratorModule" `
    -s ALLOW_MEMORY_GROWTH=1 `
    -s MAXIMUM_MEMORY=256MB `
    --bind `
    -o public\wasm\thumbnail-generator.js

if ($LASTEXITCODE -eq 0) {
    Write-Host "thumbnail-generator.wasm built successfully" -ForegroundColor Green
} else {
    Write-Host "Failed to build thumbnail-generator.wasm" -ForegroundColor Red
    exit 1
}

# Display sizes
Write-Host ""
Write-Host "Build Summary:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Gray
Get-ChildItem public\wasm\*.wasm | ForEach-Object {
    $size = "{0:N2} KB" -f ($_.Length / 1KB)
    Write-Host "  $($_.Name) -> $size" -ForegroundColor White
}
Write-Host "========================================" -ForegroundColor Gray
Write-Host ""
Write-Host "WASM modules ready! Include them in your React app." -ForegroundColor Green
