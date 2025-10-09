# 🎨 Android Studio Setup & Release Build Guide

## 📥 Step 1: Download & Install Android Studio

### Download
1. Visit: https://developer.android.com/studio
2. Click **"Download Android Studio"**
3. Accept the terms and conditions
4. Download size: ~1 GB (installer), ~3-5 GB (full installation)

### Installation Steps

1. **Run the Installer**
   - Double-click the downloaded `.exe` file
   - Click "Next" through the setup wizard

2. **Choose Components**
   - ✅ Android Studio
   - ✅ Android Virtual Device (for testing)
   - Click "Next"

3. **Installation Location**
   - Default: `C:\Program Files\Android\Android Studio`
   - Click "Next"

4. **Start Menu Folder**
   - Keep default
   - Click "Install"

5. **Wait for Installation**
   - This takes 5-10 minutes
   - Click "Finish" when done

### First Launch Setup

1. **Import Settings**
   - Select "Do not import settings"
   - Click "OK"

2. **Data Sharing**
   - Choose your preference
   - Click "Next"

3. **Install Type**
   - Select **"Standard"** installation
   - Click "Next"

4. **UI Theme**
   - Choose "Light" or "Darcula" (dark theme)
   - Click "Next"

5. **Verify Settings**
   - Review the components to be installed:
     - Android SDK
     - Android SDK Platform
     - Performance (Intel® HAXM)
     - Android Virtual Device
   - Click "Finish"

6. **Download Components**
   - This downloads ~2-3 GB
   - Takes 10-30 minutes depending on internet speed
   - Click "Finish" when complete

---

## 🔧 Step 2: Configure Android SDK

### Verify SDK Installation

1. Click **"More Actions"** (or "Configure") on welcome screen
2. Select **"SDK Manager"**
3. Verify installed:
   - ✅ Android API 33 (Android 13.0)
   - ✅ Android SDK Build-Tools
   - ✅ Android SDK Platform-Tools
   - ✅ Google Play Services

### Set Environment Variables (Important!)

**Option 1: Using System Settings**

1. Press `Win + X`, select "System"
2. Click "Advanced system settings"
3. Click "Environment Variables"
4. Under "User variables", click "New"
5. Add:
   ```
   Variable name: ANDROID_HOME
   Variable value: C:\Users\YOUR_USERNAME\AppData\Local\Android\Sdk
   ```
6. Find "Path" variable, click "Edit"
7. Add new entry:
   ```
   %ANDROID_HOME%\platform-tools
   ```
8. Click "OK" on all dialogs

**Option 2: Using PowerShell**

```powershell
# Set ANDROID_HOME
[System.Environment]::SetEnvironmentVariable("ANDROID_HOME", "$env:LOCALAPPDATA\Android\Sdk", "User")

# Add to PATH
$path = [System.Environment]::GetEnvironmentVariable("Path", "User")
[System.Environment]::SetEnvironmentVariable("Path", "$path;$env:LOCALAPPDATA\Android\Sdk\platform-tools", "User")

# Refresh current session
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:Path += ";$env:LOCALAPPDATA\Android\Sdk\platform-tools"
```

**Verify Installation:**
```powershell
# Close and reopen PowerShell, then run:
adb --version
```

---

## 📱 Step 3: Open Your Project in Android Studio

### Method 1: Using NPM Script (Recommended)

```bash
npm run android:open
```

### Method 2: Manual Open

1. Open Android Studio
2. Click "Open"
3. Navigate to: `Z:\Directory\projects\nebula-screen-capture\android`
4. Click "OK"

### First Open (Gradle Sync)

1. Android Studio will start **Gradle Sync**
2. This downloads dependencies (~100-500 MB)
3. Takes 5-15 minutes
4. Wait for "Gradle sync finished" message
5. You may see some warnings - that's normal

### Potential Issues & Fixes

**Issue: "Gradle version too old"**
- Solution: Click "Update Gradle" button
- Let it download and sync

**Issue: "License not accepted"**
- Solution: Click the blue link in error
- Accept licenses
- Re-sync

**Issue: "SDK not found"**
- Solution: File > Settings > Appearance & Behavior > System Settings > Android SDK
- Set SDK location: `C:\Users\YOUR_USERNAME\AppData\Local\Android\Sdk`
- Click "Apply"

---

## 🔑 Step 4: Configure Signing Key

### Copy Keystore to Android Folder

```powershell
# Create keystore directory
New-Item -Path "android\app\keystore" -ItemType Directory -Force

# Copy your keystore (DON'T commit this!)
Copy-Item release-key.keystore android\app\keystore\release-key.keystore
```

### Create key.properties File

Create: `android\key.properties`

```properties
storePassword=YOUR_KEYSTORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=nebula-release
storeFile=keystore/release-key.keystore
```

⚠️ **IMPORTANT**: Add to `.gitignore`:
```
android/key.properties
android/app/keystore/
```

### Update build.gradle

Open: `android\app\build.gradle`

Find the `android {` block and add BEFORE it:

```gradle
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

Find `buildTypes {` section and update `release`:

```gradle
buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled false
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

Add `signingConfigs` BEFORE `buildTypes`:

```gradle
signingConfigs {
    release {
        keyAlias keystoreProperties['keyAlias']
        keyPassword keystoreProperties['keyPassword']
        storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
        storePassword keystoreProperties['storePassword']
    }
}
```

### Sync Gradle Again

1. Click "Sync Now" banner
2. Or: File > Sync Project with Gradle Files
3. Wait for sync to complete

---

## 🏗️ Step 5: Generate Signed AAB (Android App Bundle)

### Using Android Studio GUI

1. **Select Build Variant**
   - View > Tool Windows > Build Variants
   - Set to "release"

2. **Start Build Process**
   - Build > Generate Signed Bundle / APK
   - Select **"Android App Bundle"**
   - Click "Next"

3. **Choose Keystore**
   - Key store path: `android\app\keystore\release-key.keystore`
   - Key store password: [Your keystore password]
   - Key alias: `nebula-release`
   - Key password: [Your key password]
   - Click "Next"

4. **Select Build Variant**
   - Destination folder: `android\app\release`
   - Build variant: **"release"**
   - ✅ Check "Export encrypted key"
   - Click "Create"

5. **Wait for Build**
   - Build progress shows in bottom panel
   - Takes 2-5 minutes
   - Success message: "Generate Signed Bundle: APK(s) generated successfully"

6. **Locate Your AAB**
   - Click "locate" in the popup
   - Or navigate to: `android\app\release\app-release.aab`

### Using Gradle (Command Line)

```bash
# In Android Studio Terminal or PowerShell
cd android
./gradlew bundleRelease
```

Output: `android\app\build\outputs\bundle\release\app-release.aab`

---

## ✅ Step 6: Verify Your AAB

### Check File Size
```powershell
ls android\app\release\app-release.aab
```

Expected size: 5-20 MB (depending on your app)

### Test Installation (Optional)

Convert AAB to APK for testing:

```bash
# Download bundletool
# https://github.com/google/bundletool/releases

# Generate APKs
java -jar bundletool-all.jar build-apks --bundle=app-release.aab --output=app-release.apks --mode=universal

# Install on device
java -jar bundletool-all.jar install-apks --apks=app-release.apks
```

---

## 📤 Step 7: Prepare for Google Play Upload

### What You Have Now:
✅ `app-release.aab` - Your signed app bundle  
✅ `release-key.keystore` - Your signing key (BACKUP THIS!)  
✅ Key passwords saved securely  

### Before Upload Checklist:

**Technical:**
- [ ] AAB file generated successfully
- [ ] App version code incremented (in `build.gradle`)
- [ ] App version name updated (e.g., "1.0.0")
- [ ] Tested on physical device or emulator
- [ ] No critical errors or crashes

**Graphics:**
- [ ] App icon (512x512 PNG)
- [ ] Feature graphic (1024x500 PNG/JPEG)
- [ ] Phone screenshots (2-8 images, 1080x1920)
- [ ] Tablet screenshots (optional, 7-8 inch and 10 inch)

**Legal:**
- [ ] Privacy Policy hosted online
- [ ] Privacy Policy URL ready
- [ ] Terms of Service created
- [ ] Content rating questionnaire completed

**Store Listing:**
- [ ] App title (max 50 characters)
- [ ] Short description (max 80 characters)
- [ ] Full description (max 4000 characters)
- [ ] App category selected
- [ ] Contact email set
- [ ] Website URL (optional)

---

## 🚀 Next Steps

### Option 1: Continue to Google Play Console Setup

See: **GOOGLE_PLAY_CONSOLE_SETUP.md** (to be created)

Steps:
1. Create Google Play Console account ($25 fee)
2. Set up app listing
3. Upload AAB
4. Submit for review

### Option 2: Test More First

```bash
# Run on connected device
npm run android:run

# Or open in Android Studio
npm run android:open
# Then: Run > Run 'app'
```

---

## 🐛 Troubleshooting

### Build Failed: "Signing key not found"
- Verify `key.properties` exists
- Check file paths are correct
- Ensure keystore file is in `android/app/keystore/`

### Build Failed: "Wrong password"
- Double-check passwords in `key.properties`
- Try generating keystore again
- Verify alias name matches

### Gradle Sync Failed
- Click "Try Again"
- Check internet connection
- Clear Gradle cache: File > Invalidate Caches / Restart

### AAB Size Too Large (>150MB)
- Enable ProGuard (minification)
- Remove unused resources
- Optimize images
- Use WebP format for images

### "This app bundle contains native code"
- This is normal for Capacitor apps
- Google Play will generate optimized APKs
- No action needed

---

## 📊 App Versioning

Update these in `android/app/build.gradle`:

```gradle
android {
    defaultConfig {
        versionCode 1        // Increment for each release
        versionName "1.0.0"  // User-visible version
    }
}
```

**Version Scheme:**
- `versionCode`: Integer, increments by 1 each release (1, 2, 3...)
- `versionName`: String, semantic versioning (1.0.0, 1.0.1, 1.1.0, 2.0.0...)

---

## 🎉 Success!

Once you have your `app-release.aab` file, you're ready to upload to Google Play!

**Your AAB file location:**
```
Z:\Directory\projects\nebula-screen-capture\android\app\release\app-release.aab
```

**Next Guide:** Upload to Google Play Console  
**Estimated time to launch:** 1-2 days (after review)

---

**Prepared by**: GitHub Copilot  
**Date**: October 8, 2025  
**For**: Nebula Screen Capture Android Deployment
