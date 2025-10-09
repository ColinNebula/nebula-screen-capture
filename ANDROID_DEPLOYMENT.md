# Android Deployment Guide for Google Play

## 📱 Preparing Nebula Screen Capture for Google Play Store

This guide walks you through converting your React web app into an Android app and publishing it to Google Play.

---

## 🎯 Deployment Strategy

Since this is a React web app, we'll use **Capacitor** (by Ionic) to wrap it as a native Android app.

### Why Capacitor?
- ✅ Easy integration with React apps
- ✅ Access to native Android APIs (camera, storage, notifications)
- ✅ Better performance than older solutions
- ✅ Active development and support
- ✅ PWA capabilities built-in

---

## 📋 Prerequisites

### 1. Install Required Software

#### Android Studio
- Download from: https://developer.android.com/studio
- Install Android SDK (API Level 33 or higher recommended)
- Set up Android Virtual Device (AVD) for testing

#### Java Development Kit (JDK)
- Install JDK 11 or higher
- Set JAVA_HOME environment variable

#### Node.js & npm
- Already installed ✅

---

## 🚀 Step 1: Install Capacitor

```bash
# Install Capacitor core and CLI
npm install @capacitor/core @capacitor/cli

# Initialize Capacitor in your project
npx cap init

# When prompted:
# App name: Nebula Screen Capture
# App ID: com.colinNebula.screenCapture (use your own domain)
# Web asset directory: build

# Add Android platform
npm install @capacitor/android
npx cap add android
```

---

## 🔧 Step 2: Configure Capacitor

### Update `capacitor.config.json`

```json
{
  "appId": "com.colinnebula.screencapture",
  "appName": "Nebula Screen Capture",
  "webDir": "build",
  "server": {
    "androidScheme": "https",
    "allowNavigation": [
      "https://*.github.io"
    ]
  },
  "android": {
    "buildOptions": {
      "keystorePath": "release-key.keystore",
      "keystoreAlias": "nebula-release",
      "releaseType": "APK"
    }
  },
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 2000,
      "backgroundColor": "#667eea",
      "androidScaleType": "CENTER_CROP",
      "showSpinner": false
    },
    "StatusBar": {
      "style": "dark",
      "backgroundColor": "#667eea"
    }
  }
}
```

---

## 📦 Step 3: Install Required Capacitor Plugins

```bash
# Core plugins
npm install @capacitor/app
npm install @capacitor/haptics
npm install @capacitor/keyboard
npm install @capacitor/status-bar
npm install @capacitor/splash-screen
npm install @capacitor/filesystem
npm install @capacitor/share
npm install @capacitor/toast
npm install @capacitor/network

# Screen recording plugin (community)
npm install capacitor-screen-recorder
```

---

## 🎨 Step 4: Create App Icons and Splash Screen

### Icon Requirements

Create icons in the following sizes and place them in `android/app/src/main/res/`:

```
mipmap-mdpi/       48x48px
mipmap-hdpi/       72x72px
mipmap-xhdpi/      96x96px
mipmap-xxhdpi/     144x144px
mipmap-xxxhdpi/    192x192px
```

### Automated Icon Generation

Use a tool like `cordova-res`:

```bash
npm install -g cordova-res

# Place a 1024x1024 icon.png in the resources folder
cordova-res android --skip-config --copy
```

### Splash Screen

Create `splash.png` (2732x2732px) and place in `resources/` folder.

---

## ⚙️ Step 5: Configure Android Manifest

Edit `android/app/src/main/AndroidManifest.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.colinnebula.screencapture">

    <!-- Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.VIBRATE" />
    
    <!-- Android 11+ -->
    <uses-permission android:name="android.permission.MANAGE_EXTERNAL_STORAGE" />
    
    <!-- Screen Recording -->
    <uses-permission android:name="android.permission.RECORD_DISPLAY" />
    <uses-permission android:name="android.permission.CAPTURE_VIDEO_OUTPUT" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="true">

        <activity
            android:name=".MainActivity"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:label="@string/app_name"
            android:launchMode="singleTask"
            android:theme="@style/AppTheme.NoActionBarLaunch"
            android:exported="true">

            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

---

## 🔐 Step 6: Create Signing Key

For Google Play, you need a signed release APK:

```bash
# Generate keystore (keep this file SECURE!)
keytool -genkey -v -keystore release-key.keystore -alias nebula-release -keyalg RSA -keysize 2048 -validity 10000

# When prompted, enter:
# - Strong password (SAVE THIS!)
# - Your name and organization details
# - City, State, Country

# Store credentials securely - you'll need them for every release
```

⚠️ **CRITICAL**: Never commit your keystore file to git! Add to `.gitignore`:

```
*.keystore
*.jks
release-key.*
```

---

## 🏗️ Step 7: Build the App

```bash
# 1. Build React app
npm run build

# 2. Copy web assets to Android
npx cap copy android

# 3. Sync Android project
npx cap sync android

# 4. Open in Android Studio
npx cap open android
```

### In Android Studio:

1. **Build > Clean Project**
2. **Build > Rebuild Project**
3. **Build > Generate Signed Bundle / APK**
4. Select **APK** or **Android App Bundle (AAB)** (AAB recommended for Play Store)
5. Select your keystore file
6. Enter keystore password and key alias
7. Choose release variant
8. Wait for build to complete

---

## 📤 Step 8: Prepare for Google Play Console

### Required Assets

#### 1. App Screenshots (REQUIRED)
- Minimum 2 screenshots per device type
- **Phone**: 1080x1920 or 1080x2340
- **Tablet (optional)**: 1600x2560
- PNG or JPEG format

#### 2. Feature Graphic (REQUIRED)
- Size: **1024x500**
- PNG or JPEG
- Should represent your app visually

#### 3. App Icon (REQUIRED)
- Size: **512x512**
- PNG format (32-bit with alpha channel)

#### 4. Privacy Policy (REQUIRED)
- Must be hosted online (use GitHub Pages)
- URL format: https://nebula3ddev.com/privacy
- Terms: https://nebula3ddev.com/terms

#### 5. App Description

**Short Description** (80 characters max):
```
Professional screen recording and screenshot capture made simple
```

**Full Description** (4000 characters max):
```
🎬 NEBULA SCREEN CAPTURE - Professional Screen Recording Made Simple

Transform the way you capture your screen with Nebula Screen Capture, the most intuitive and powerful screen recording app for Android.

⭐ KEY FEATURES

📹 High-Quality Recording
• Record in HD, Full HD, or 4K quality
• Multiple frame rate options (30/60 FPS)
• Crystal-clear audio capture
• Advanced video codecs (VP9, H.264)

📸 Smart Screenshot Tools
• Instant full-screen captures
• Selective window capture
• Built-in annotation tools
• Quick sharing options

🎨 Powerful Editing
• Trim and cut recordings
• Add annotations and drawings
• Insert text overlays
• Professional video effects

☁️ Cloud Storage & Sharing
• Unlimited storage (Premium)
• Instant sharing to social media
• Direct YouTube upload
• Export to multiple formats

📊 Analytics Dashboard
• Track recording metrics
• Storage management
• Activity insights
• Performance statistics

🎯 Perfect For:
• Content creators & YouTubers
• Game streamers
• Educators & students
• Business professionals
• App developers & testers
• Tutorial creators

💎 SUBSCRIPTION PLANS

FREE
• 10 recordings/month
• 720p quality
• 500MB storage
• Basic features

PRO ($4.99/month)
• Unlimited recordings
• 1080p quality
• 10GB storage
• Advanced editing
• No watermark

PREMIUM ($9.99/month)
• Everything in Pro
• 4K quality
• 100GB storage
• Priority support
• Cloud backup

🔒 Privacy First
• No ads, ever
• Your data stays yours
• Encrypted storage
• GDPR compliant

Download Nebula Screen Capture today and start creating professional content!

Support: support@nebula-capture.com
Privacy Policy: https://nebula3ddev.com/privacy
Terms of Service: https://nebula3ddev.com/terms
```

---

## 🎯 Step 9: Google Play Console Setup

### Create Developer Account
1. Go to https://play.google.com/console
2. Pay one-time $25 registration fee
3. Complete account setup

### Create New App
1. Click **Create app**
2. Fill in app details:
   - Default language: English (US)
   - App name: Nebula Screen Capture
   - Category: Video Players & Editors
   - Developer contact email: colinnebula@gmail.com

### Complete Store Listing
1. **App details**: Name, description, categories
2. **Graphics**: Screenshots, icons, feature graphic
3. **Privacy Policy**: Add URL
4. **App content**: Rating questionnaire, target audience
5. **News apps**: N/A

### Set Up Pricing
1. **Pricing & distribution**
2. Select countries (or Worldwide)
3. Free/Paid (Free with in-app purchases)
4. Accept content guidelines

### App Content Rating
1. Complete questionnaire honestly
2. Submit for ESRB/PEGI rating
3. Wait for rating (usually instant)

### Upload APK/AAB
1. Go to **Production** or **Internal Testing**
2. Create new release
3. Upload your AAB file
4. Add release notes
5. Review and rollout

---

## ✅ Pre-Launch Checklist

- [ ] App builds successfully in release mode
- [ ] Tested on multiple Android devices/versions
- [ ] All features work offline (if applicable)
- [ ] Screen recording works properly
- [ ] Permissions are requested at appropriate times
- [ ] No crash reports or ANR (App Not Responding)
- [ ] App icon and splash screen display correctly
- [ ] Privacy policy created and hosted
- [ ] Terms of service created and hosted
- [ ] Screenshots captured (2-8 per type)
- [ ] Feature graphic created (1024x500)
- [ ] App description written
- [ ] Content rating completed
- [ ] Pricing configured
- [ ] Countries/regions selected
- [ ] Google Play Console policies accepted
- [ ] Signing key backed up securely
- [ ] Release notes written
- [ ] App version incremented (versionCode & versionName)

---

## 🔄 Update Process (Future Releases)

```bash
# 1. Update version in package.json
# "version": "1.0.1" -> "1.0.2"

# 2. Update Android version
# Edit android/app/build.gradle:
# versionCode 2
# versionName "1.0.1"

# 3. Build new version
npm run build
npx cap copy android
npx cap sync android

# 4. Generate signed AAB in Android Studio

# 5. Upload to Google Play Console
# - Create new release
# - Upload AAB
# - Add release notes
# - Review and publish
```

---

## 📊 App Metrics to Track

After launch, monitor:
- **Installs**: Daily/weekly/monthly
- **Crashes**: Use Firebase Crashlytics
- **ANR rate**: Keep below 0.5%
- **User ratings**: Respond to reviews
- **Retention**: Day 1, 7, 30 retention rates
- **Subscription conversion**: Free to paid ratio

---

## 🛠️ Recommended Tools

### Testing
- **Firebase Test Lab**: Test on real devices
- **BrowserStack**: Cross-device testing
- **LeakCanary**: Memory leak detection

### Analytics
- **Google Analytics for Firebase**
- **Mixpanel**: User behavior tracking
- **Amplitude**: Product analytics

### Crash Reporting
- **Firebase Crashlytics**: Free crash reporting
- **Sentry**: Error tracking

### Monetization
- **Google Play Billing**: In-app purchases
- **RevenueCat**: Subscription management
- **Stripe**: Payment processing

---

## 🚨 Common Issues & Solutions

### Issue: Build fails with "Could not find SDK"
**Solution**: Set ANDROID_HOME environment variable
```bash
# Windows
setx ANDROID_HOME "C:\Users\YourName\AppData\Local\Android\Sdk"

# Add to PATH
setx PATH "%PATH%;%ANDROID_HOME%\tools;%ANDROID_HOME%\platform-tools"
```

### Issue: App crashes on launch
**Solution**: Check Android logs
```bash
# View logs
adb logcat

# Filter for your app
adb logcat | grep "com.colinnebula"
```

### Issue: Screen recording doesn't work
**Solution**: Request MEDIA_PROJECTION permission
```java
// Request permission in MainActivity
startActivityForResult(
    MediaProjectionManager.createScreenCaptureIntent(),
    REQUEST_CODE
);
```

---

## 📞 Support & Resources

- **Capacitor Docs**: https://capacitorjs.com/docs
- **Android Developer Docs**: https://developer.android.com
- **Google Play Console Help**: https://support.google.com/googleplay/android-developer
- **Stack Overflow**: Tag `capacitor` or `android`

---

## 🎉 Next Steps

1. Follow this guide step-by-step
2. Test thoroughly on multiple devices
3. Create all required graphics and screenshots
4. Set up Google Play Console account
5. Submit for review
6. Monitor and respond to user feedback
7. Plan regular updates

Good luck with your app launch! 🚀
