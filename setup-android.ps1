# Nebula Screen Capture - Android Setup Script
# Run this script to set up Android/Capacitor integration

Write-Host "🚀 Setting up Nebula Screen Capture for Android..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Install Capacitor
Write-Host "📦 Step 1/5: Installing Capacitor..." -ForegroundColor Yellow
npm install @capacitor/core @capacitor/cli

# Step 2: Initialize Capacitor
Write-Host "🔧 Step 2/5: Initializing Capacitor..." -ForegroundColor Yellow
Write-Host ""
Write-Host "You will be prompted for:" -ForegroundColor Gray
Write-Host "  - App name: Nebula Screen Capture" -ForegroundColor Gray
Write-Host "  - App ID: com.colinnebula.screencapture" -ForegroundColor Gray
Write-Host "  - Web directory: build" -ForegroundColor Gray
Write-Host ""

npx cap init

# Step 3: Add Android platform
Write-Host "📱 Step 3/5: Adding Android platform..." -ForegroundColor Yellow
npm install @capacitor/android
npx cap add android

# Step 4: Install plugins
Write-Host "🔌 Step 4/5: Installing Capacitor plugins..." -ForegroundColor Yellow
npm install @capacitor/app @capacitor/haptics @capacitor/keyboard @capacitor/status-bar @capacitor/splash-screen @capacitor/filesystem @capacitor/share @capacitor/toast @capacitor/network

# Step 5: Build and sync
Write-Host "🏗️ Step 5/5: Building and syncing..." -ForegroundColor Yellow
npm run build
npx cap copy android
npx cap sync android

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Install Android Studio from: https://developer.android.com/studio" -ForegroundColor White
Write-Host "  2. Open Android project: npx cap open android" -ForegroundColor White
Write-Host "  3. Create signing key (see ANDROID_DEPLOYMENT.md)" -ForegroundColor White
Write-Host "  4. Generate signed APK/AAB in Android Studio" -ForegroundColor White
Write-Host ""
Write-Host "📖 Documentation:" -ForegroundColor Cyan
Write-Host "  - Full guide: ANDROID_DEPLOYMENT.md" -ForegroundColor White
Write-Host "  - Play Store: PLAY_STORE_LISTING.md" -ForegroundColor White
Write-Host "  - Privacy: PRIVACY_POLICY.md" -ForegroundColor White
Write-Host "  - Terms: TERMS_OF_SERVICE.md" -ForegroundColor White
Write-Host ""
