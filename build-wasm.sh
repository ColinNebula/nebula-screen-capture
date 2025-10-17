#!/bin/bash

# Build script for WebAssembly modules
# Requires Emscripten SDK to be installed and activated

echo "🔨 Building Nebula Screen Capture WASM Modules..."

# Check if emcc is available
if ! command -v em++ &> /dev/null; then
    echo "❌ Error: Emscripten not found. Please install and activate emsdk first."
    echo "   Run: cd emsdk && ./emsdk install latest && ./emsdk activate latest"
    exit 1
fi

# Create output directory
mkdir -p public/wasm

# Build Video Encoder
echo "📹 Building video-encoder.wasm..."
em++ src/wasm/video-encoder.cpp \
    -O3 \
    -s WASM=1 \
    -s MODULARIZE=1 \
    -s EXPORT_ES6=1 \
    -s EXPORT_NAME="createVideoEncoderModule" \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s MAXIMUM_MEMORY=512MB \
    --bind \
    -o public/wasm/video-encoder.js

if [ $? -eq 0 ]; then
    echo "✅ video-encoder.wasm built successfully"
else
    echo "❌ Failed to build video-encoder.wasm"
    exit 1
fi

# Build Audio Processor
echo "🎵 Building audio-processor.wasm..."
em++ src/wasm/audio-processor.cpp \
    -O3 \
    -s WASM=1 \
    -s MODULARIZE=1 \
    -s EXPORT_ES6=1 \
    -s EXPORT_NAME="createAudioProcessorModule" \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s MAXIMUM_MEMORY=256MB \
    --bind \
    -o public/wasm/audio-processor.js

if [ $? -eq 0 ]; then
    echo "✅ audio-processor.wasm built successfully"
else
    echo "❌ Failed to build audio-processor.wasm"
    exit 1
fi

# Display sizes
echo ""
echo "📊 Build Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ls -lh public/wasm/*.wasm | awk '{print "  " $9 " → " $5}'
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✨ WASM modules ready! Include them in your React app."
