<div align="center">

# 🌌 Nebula Screen Capture

### Professional Screen Recording Made Simple

*A cutting-edge Progressive Web App for high-quality screen recording*

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/ColinNebula/nebula-screen-capture)
[![React](https://img.shields.io/badge/React-19.2-61dafb.svg)](https://reactjs.org/)
[![PWA](https://img.shields.io/badge/PWA-Enabled-5a0fc8.svg)](https://web.dev/progressive-web-apps/)
[![License](https://img.shields.io/badge/license-MIT-purple.svg)](LICENSE)

**[Live Demo](https://nebula3ddev.com)** • **[Report Bug](https://github.com/ColinNebula/nebula-screen-capture/issues)** • **[Request Feature](https://github.com/ColinNebula/nebula-screen-capture/issues)**

---

**Developed by [Colin Nebula](https://github.com/ColinNebula)**  
**for [Nebula Media 3D](https://github.com/ColinNebula)** 🚀

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Live Demo](#-live-demo)
- [Quick Start](#-quick-start)
- [Usage Guide](#-usage-guide)
- [PWA Capabilities](#-pwa-capabilities)
- [Technical Stack](#-technical-stack)
- [Browser Support](#-browser-support)
- [Development](#-development)
- [Deployment](#-deployment)
- [Documentation](#-documentation)
- [Contributing](#-contributing)
- [License](#-license)
- [About](#-about)

---

## 🌟 Overview

**Nebula Screen Capture** is a state-of-the-art Progressive Web App (PWA) designed to deliver professional-grade screen recording capabilities directly in your browser. Built with modern web technologies, it offers a native app-like experience with the convenience of web accessibility.

### Why Nebula Screen Capture?

- ✨ **Zero Installation Required**: Works instantly in any modern browser
- 📱 **Installable PWA**: Add to home screen on mobile, tablet, and desktop
- 🔒 **Privacy First**: All processing happens locally - your recordings never leave your device
- 🎨 **Beautiful UI**: Modern, intuitive interface with dynamic state-aware header
- ⚡ **Lightning Fast**: Optimized performance with service worker caching
- 🌙 **Dark/Light Theme**: Automatic theme detection with manual toggle
- 📴 **Offline Ready**: Works without internet after first load

---

## 🎯 Key Features

### 🎬 **Professional Recording Engine**

#### Quality Options
- **Video Resolution**: 720p, 1080p, 1440p (2K), 4K Ultra HD
- **Frame Rates**: 15, 24 (cinematic), 30 (standard), 60 FPS (ultra-smooth)
- **Audio Quality**: 32, 64, 96, 128, 192 kbps bitrates
- **Format**: WebM with VP9 codec for optimal compression

#### Capture Modes
- 🖥️ **Full Screen**: Capture entire desktop
- 🪟 **Window Mode**: Record specific application windows
- 🌐 **Browser Tab**: Capture individual browser tabs
- ✂️ **Custom Area**: Pixel-perfect region selection with visual overlay

#### Recording Controls
- ⏸️ **Pause/Resume**: Seamlessly pause and continue recordings
- ⏱️ **Live Timer**: Real-time duration tracking with millisecond precision
- 🎬 **Pre-recording Countdown**: 3-2-1 visual countdown
- 📊 **Storage Monitoring**: Real-time storage usage tracking

---

### 🎵 **Advanced Audio System**

#### Multi-Source Audio
- **System Audio**: Capture application sounds, music, and notifications
- **Microphone Input**: Record commentary and voiceovers
- **Dual Channel**: Simultaneously record system and mic audio
- **Device Selection**: Choose from available microphone devices

#### Audio Enhancement
- 🎚️ **Noise Suppression**: Remove background noise automatically
- 🔊 **Echo Cancellation**: Eliminate audio feedback
- 📈 **Auto Gain Control**: Normalize audio levels
- 🎛️ **Volume Control**: Adjustable microphone input levels (0-100%)

---

### 🎨 **Dynamic User Interface**

#### State-Aware Header
The header dynamically adapts to your recording state:

- **🔴 Recording State**: Red gradient with live timer and pulse animation
- **⏸️ Paused State**: Orange gradient with "Paused" indicator
- **🎬 Reviewing State**: Green gradient when reviewing recordings
- **✨ Default State**: Purple/blue gradient with gradient animation

#### Component Features
- **Theme Toggle**: Quick switch between light and dark modes
- **Notification Center**: Real-time tips and system messages
- **User Profile**: Account stats, storage usage, plan information
- **Premium Features**: Upgrade prompts and feature gates

---

### 📁 **Intelligent File Management**

#### Organization Tools
- 📊 **Smart Grid View**: Responsive card layout with video thumbnails
- 🔍 **Real-time Search**: Instant filtering by filename
- 📑 **Multi-Sort Options**: 
  - Date (newest/oldest first)
  - Size (largest/smallest)
  - Duration (longest/shortest)
  - Name (A-Z/Z-A)

#### Batch Operations
- ✅ **Multi-Select**: Select multiple recordings for bulk actions
- ⬇️ **Bulk Download**: Download selected recordings as ZIP
- 🗑️ **Bulk Delete**: Remove multiple recordings at once
- 📊 **Storage Analytics**: View total storage, file count, and usage stats

#### Preview System
- 🎥 **Video Thumbnails**: Auto-generated preview images
- ▶️ **Quick Preview**: In-app video player with controls
- 📝 **Metadata Display**: Filename, size, duration, date
- 🏷️ **Format Indicators**: Visual codec and quality badges

---

### ⌨️ **Keyboard Shortcuts**

Boost your productivity with comprehensive keyboard support:

| Shortcut | Action |
|----------|--------|
| `Ctrl/⌘ + R` | Start/Stop Recording |
| `Space` | Pause/Resume Recording |
| `Escape` | Cancel Recording or Area Selection |
| `Ctrl/⌘ + D` | Download Current Recording |
| `Ctrl/⌘ + H` | Open Help Modal |
| `Ctrl/⌘ + /` | Show Keyboard Shortcuts |

---

### 📱 **Progressive Web App (PWA) Features**

#### Installation
- 📲 **Add to Home Screen**: Install on iOS, Android, Windows, macOS, Linux
- 🖥️ **Desktop Integration**: Appears like a native desktop application
- 🎯 **App Shortcuts**: Quick actions from home screen/taskbar
  - Start Recording
  - View Recordings

#### Offline Capabilities
- 💾 **Service Worker Caching**: App shell cached for offline use
- ⚡ **Fast Loading**: Instant startup after first visit
- 🔄 **Auto Updates**: Background updates with user notification
- 📦 **Asset Optimization**: Compressed resources for faster load times

#### Mobile Optimizations
- 👆 **Touch-Friendly**: 44px minimum touch targets
- 📐 **Safe Area Support**: iPhone notch and gesture navigation
- 🔄 **Orientation Support**: Landscape and portrait modes
- 🚫 **No Pull-to-Refresh**: Better app-like experience
- ⚡ **Performance**: Reduced animations on mobile devices

---

### 🛡️ **Premium Features & Plans**

#### Free Plan
- ✅ 720p & 1080p recording
- ✅ 5GB storage
- ✅ Basic features
- ✅ Unlimited recordings (up to storage limit)

#### Pro Plan
- ✅ Everything in Free
- ✅ 1440p (2K) recording
- ✅ 50GB storage
- ✅ Advanced audio settings
- ✅ Batch operations

#### Premium Plan
- ✅ Everything in Pro
- ✅ 4K Ultra HD recording
- ✅ Unlimited storage
- ✅ Priority support
- ✅ Analytics dashboard
- ✅ Custom branding

---

### 🎯 **Smart Features**

#### Browser Compatibility Detection
- Automatic feature detection and graceful degradation
- Browser-specific optimizations
- Compatibility warnings and suggestions

#### Performance Monitoring
- Real-time performance metrics
- Automatic quality adjustment for low-end devices
- Frame drop detection and notification

#### Error Handling
- Comprehensive error boundaries
- User-friendly error messages
- Automatic recovery suggestions
- Debug logging for troubleshooting

#### Notification System
- Real-time recording tips
- Storage warnings
- Feature discovery prompts
- Update notifications

---

## 🚀 Live Demo

**Experience Nebula Screen Capture now:**  
### 🌐 **Access Anywhere**

👉 **https://nebula3ddev.com**

### Quick Start on Mobile:
1. Visit the link on your smartphone
2. Tap the "Install" prompt or use "Add to Home Screen"
3. Launch from your home screen like a native app!

---

## 💻 Installation

### For Users

#### Web App (No Installation)
### 🌐 Try It Now

Simply visit: https://nebula3ddev.com

#### Install as PWA

**On Android/Chrome:**
1. Visit the web app
2. Click "Install" button in the address bar or custom prompt
3. App appears on home screen

**On iOS/Safari:**
1. Open in Safari browser
2. Tap Share button (📤)
3. Scroll and tap "Add to Home Screen"
4. Tap "Add"

**On Desktop (Chrome/Edge):**
1. Visit the web app
2. Click install icon (⊕) in address bar
3. Click "Install" in popup

---

### For Developers

#### Prerequisites
- **Node.js**: 14.x or higher
- **npm**: 6.x or higher (or yarn 1.22+)
- **Git**: For cloning the repository
- **Modern Browser**: Chrome 72+, Firefox 66+, or Edge 79+

#### Clone & Install

```bash
# Clone the repository
git clone https://github.com/ColinNebula/nebula-screen-capture.git

# Navigate to directory
cd nebula-screen-capture

# Install dependencies
npm install
```

#### Development Server

```bash
# Start development server
npm start
```

The app will open at `http://localhost:3000`

#### Build for Production

```bash
# Create optimized production build
npm run build
```

Build output will be in the `build/` directory.

#### Deploy to GitHub Pages

```bash
# Deploy to gh-pages branch
npm run deploy
```

---

## 📖 Usage Guide

### Starting Your First Recording

1. **Launch the App**: Open Nebula Screen Capture in your browser
2. **Configure Settings** (Optional):
   - Select video quality (720p - 4K)
   - Choose frame rate (15-60 FPS)
   - Configure audio sources
   - Set capture area

3. **Start Recording**:
   - Click "Start Recording" button
   - Or press `Ctrl/⌘ + R`
   - Grant screen capture permissions when prompted
   - Select which screen/window/tab to record

4. **During Recording**:
   - Monitor timer and recording state in header
   - Use pause/resume as needed (Space bar)
   - Notifications will guide you

5. **Stop & Save**:
   - Click "Stop Recording" or press `Ctrl/⌘ + R`
   - Recording automatically appears in File Manager
   - Download or preview your recording

### Advanced Workflows

#### Custom Area Recording
Perfect for tutorials and presentations:

```
1. Recording Options → Capture Area → "Custom Area"
2. Click "Select Recording Area"
3. Drag to select desired region
4. See dimensions in real-time
5. Click "Use This Area" to confirm
6. Start recording as normal
```

#### Audio Mixing
Record system audio with commentary:

```
1. Expand Audio Settings
2. Source → "System + Microphone"
3. Select your microphone device
4. Adjust mic volume (50-100% recommended)
5. Enable noise suppression & echo cancellation
6. Test levels before recording
```

#### Batch Management
Organize multiple recordings:

```
1. Use search to filter recordings
2. Select multiple videos (checkboxes)
3. Click "Download Selected" for ZIP export
4. Or "Delete Selected" to free up space
5. Sort by date/size/duration as needed
```

---

## 🔧 PWA Capabilities

### Service Worker Features

#### Caching Strategy
- **App Shell**: Precached for instant loading
- **Images**: Cache-first with 30-day expiration
- **CSS/JS**: Stale-while-revalidate for optimal performance
- **Videos**: No caching (too large, user-managed)

#### Update Mechanism
```javascript
// Automatic background updates
// User prompted when new version available
"New version available! Reload to update?"
```

#### Offline Behavior
- ✅ App interface loads offline
- ✅ View cached recordings
- ✅ Access settings and help
- ❌ Recording requires online (browser API limitation)

### Manifest Configuration

```json
{
  "name": "Nebula Screen Capture",
  "short_name": "Nebula",
  "display": "standalone",
  "theme_color": "#667eea",
  "background_color": "#1a1a2e",
  "icons": [
    { "src": "logo192.png", "sizes": "192x192", "purpose": "any maskable" },
    { "src": "logo512.png", "sizes": "512x512", "purpose": "any maskable" }
  ],
  "shortcuts": [
    {
      "name": "Start Recording",
      "url": "/?action=record",
      "icons": [{ "src": "logo192.png", "sizes": "192x192" }]
    }
  ]
}
```

---

## 🛠️ Technical Stack

### Frontend Framework
- **React 19.2**: Latest React with concurrent features
- **React Hooks**: useState, useEffect, useRef, useCallback, useContext
- **Context API**: Theme management and global state

### Web APIs
- **MediaRecorder API**: Video/audio recording
- **Screen Capture API**: Display media access
- **Web Audio API**: Audio processing and enhancement
- **MediaDevices API**: Device enumeration
- **File System API**: Download management

### PWA Technologies
- **Service Workers**: Offline support and caching
- **Workbox**: Advanced service worker utilities
- **Web App Manifest**: Installation metadata
- **Cache API**: Asset and data caching

### Styling
- **CSS3**: Modern CSS with variables
- **CSS Grid**: Responsive layouts
- **Flexbox**: Component alignment
- **Media Queries**: Responsive breakpoints
- **Animations**: Smooth transitions and effects

### Build Tools
- **Create React App 5.0**: Zero-config setup
- **Webpack 5**: Module bundling
- **Babel**: JavaScript transpilation
- **PostCSS**: CSS processing

### Development Tools
- **ESLint**: Code linting
- **React DevTools**: Component debugging
- **Chrome DevTools**: Performance profiling
- **Lighthouse**: PWA auditing

---

## 🌐 Browser Support

### Fully Supported ✅

| Browser | Min Version | Notes |
|---------|-------------|-------|
| **Chrome** | 72+ | Best performance, all features |
| **Edge** | 79+ | Full support (Chromium-based) |
| **Firefox** | 66+ | Full support with minor UI differences |
| **Opera** | 60+ | Full support (Chromium-based) |

### Partially Supported ⚠️

| Browser | Min Version | Limitations |
|---------|-------------|-------------|
| **Safari (Desktop)** | 13+ | Limited audio options, no system audio capture |
| **Safari (iOS/iPhone)** | iOS 14+ | **❌ No screen recording** - iOS Safari does not support Screen Capture API |
| **Safari (iPad)** | iPadOS 14+ | **❌ No screen recording** - Same iOS limitation |
| **Samsung Internet** | 11+ | Full support on desktop mode |

### Not Supported ❌
- Internet Explorer (all versions)
- Legacy Edge (pre-Chromium)
- Opera Mini
- **All iOS browsers** (Chrome, Firefox, Edge on iOS use Safari engine - same limitations)

### iOS/iPhone Limitations 📱

**Important Notice for iPhone/iPad Users:**

Unfortunately, Apple's iOS Safari **does not support the Screen Capture API** (`getDisplayMedia`), which is required for screen recording. This is a **platform limitation**, not an app limitation.

**Why iOS doesn't work:**
- Apple restricts browser access to screen recording APIs for security/privacy
- All browsers on iOS (Chrome, Firefox, Edge) use Safari's WebKit engine
- Even Chrome or Firefox on iPhone cannot bypass this restriction
- iOS only allows screen recording through native apps or system features

**Alternatives for iOS users:**
1. **Use Native iOS Screen Recording:**
   - Open Control Center (swipe down from top-right on iPhone X+)
   - Tap the record button (⏺)
   - Record your screen natively
   - Access recordings in Photos app

2. **Use the App on Desktop/Android:**
   - Access on Mac, Windows, Linux, or Chromebook
   - Use on Android devices (full support)
   - Install as PWA on supported platforms

3. **Mirror to Desktop:**
   - Use QuickTime (Mac) to mirror iPhone screen
   - Record the mirrored display using Nebula Screen Capture

We're actively monitoring iOS updates and will support screen recording immediately when Apple enables the API in Safari.

### Feature Detection
The app automatically detects browser capabilities and:
- Disables unsupported features
- Shows helpful error messages
- Suggests alternative browsers when needed

---

## � Comprehensive Device Support Matrix

### Desktop Devices ✅ Full Support

| Platform | Screen Recording | Camera | Screenshots | Notes |
|----------|------------------|--------|-------------|-------|
| **Windows 10/11** | ✅ Full | ✅ | ✅ | Best performance on Chrome/Edge |
| **macOS** | ✅ Full | ✅ | ✅ | All features supported |
| **Linux** | ✅ Full | ✅ | ✅ | Chrome/Firefox recommended |
| **ChromeOS** | ✅ Full | ✅ | ✅ | Native Chrome support |

### Mobile & Tablet Devices

#### Android Smartphones & Tablets ✅ Supported

| Device | Screen Recording | Camera | Screenshots | Notes |
|--------|------------------|--------|-------------|-------|
| **Android 10+** | ✅ Chrome 72+ | ✅ | ✅ | Full screen recording support |
| **Samsung Devices** | ✅ Samsung Internet | ✅ | ✅ | Native browser works great |
| **Google Pixel** | ✅ Chrome | ✅ | ✅ | Optimal performance |
| **Other Android** | ⚠️ Varies | ✅ | ✅ | Chrome recommended |

**Android Capabilities:**
- **Screen Recording**: ✅ Supported on Android 10+ with Chrome
- **Camera Recording**: ✅ Fully supported - record with front/back camera
- **Screenshots**: ✅ Can capture screenshots during recording
- **Installation**: ✅ Can install as PWA on home screen

#### iOS/iPadOS Devices ❌ Limited

| Device | Screen Recording | Camera | Screenshots | Notes |
|--------|------------------|--------|-------------|-------|
| **iPhone** | ❌ | ✅ | ✅ | Use native iOS screen recorder |
| **iPad** | ❌ | ✅ | ✅ | Same Safari limitations |
| **iPad Pro** | ❌ | ✅ | ✅ | Desktop mode doesn't help |

**iOS Workarounds:**
1. **Native Screen Recording**: Use iOS Control Center (⏺ button)
2. **Camera Mode**: Available for recording with iPhone camera
3. **Desktop Access**: Use the app on Mac/PC for screen recording
4. **AirPlay Mirroring**: Mirror to Mac and record there

### Smart Devices & Special Cases

#### Chromebook 💻 ✅ Excellent Support
- Full screen recording capability
- Camera and webcam support
- Can install as Chrome app
- All features work perfectly

#### Surface Devices (Windows) 📱✅ Full Support
- Complete feature set
- Touch-optimized interface
- Tablet and laptop modes supported
- Edge browser recommended

#### Android Tablets 📲 ✅ Full Support
- **Samsung Galaxy Tab**: Full support via Samsung Internet/Chrome
- **Google Pixel Tablet**: Optimal performance
- **Other Tablets**: Chrome browser recommended

### Feature Availability by Device Type

#### Screen Recording
- ✅ **Desktop** (Windows, Mac, Linux, ChromeOS)
- ✅ **Android** smartphones & tablets (OS 10+)
- ❌ **iOS/iPadOS** (all versions)
- ✅ **Chromebook** (all versions)

#### Camera Recording
- ✅ **All devices** with camera access
- ✅ **Front and back cameras** on mobile
- ✅ **Webcam** on desktop/laptop
- ✅ **Multiple camera** selection

#### Screenshots
- ✅ **All devices** during recording
- ✅ **High resolution** capture
- ✅ **Instant download** capability
- ✅ **Multiple screenshots** per session

### Device-Specific Recommendations

#### For Latest Smartphones (2023-2025)

**Android Users (Samsung Galaxy S23/24, Google Pixel 8/9, OnePlus, etc.):**
- ✅ **Full Support**: Screen recording works in Chrome
- ✅ **Install as PWA**: Add to home screen for app-like experience
- ✅ **Best Browser**: Chrome or Samsung Internet
- ✅ **All Features**: Screen recording, camera, screenshots

**iPhone Users (iPhone 15, 14, 13, etc.):**
- ❌ **No Screen Recording**: Use iOS native recorder instead
- ✅ **Camera Recording**: Works for recording video with camera
- ✅ **Install as PWA**: Can add to home screen
- ⚠️ **Limitation**: Safari API restriction, not app limitation

### Adaptive Features

The app automatically detects your device and:
1. **Shows Available Options**: Only displays features your device supports
2. **Recommends Best Method**: Suggests optimal recording approach
3. **Provides Alternatives**: Offers workarounds for unsupported features
4. **Optimizes Performance**: Adjusts quality based on device capability

### Testing Matrix

We've tested on:
- ✅ Windows 11 (Chrome, Edge, Firefox)
- ✅ macOS Sonoma/Ventura (Chrome, Safari, Firefox)
- ✅ Ubuntu 22.04 (Chrome, Firefox)
- ✅ ChromeOS (Chrome)
- ✅ Android 13/14 (Samsung S23, Pixel 8)
- ✅ iPhone 15/14 Pro (Safari) - Camera mode only
- ✅ iPad Pro (Safari) - Camera mode only
- ✅ Samsung Galaxy Tab S9 (Samsung Internet, Chrome)

---

## �👨‍💻 Development

### Project Structure

```
nebula-screen-capture/
├── public/
│   ├── index.html          # HTML template with PWA meta tags
│   ├── manifest.json       # PWA manifest
│   ├── robots.txt          # SEO
│   └── icons/              # App icons (192x192, 512x512)
├── src/
│   ├── components/         # React components
│   │   ├── ScreenRecorder.js       # Main recording component
│   │   ├── DynamicHeader.js        # State-aware header
│   │   ├── RecordingControls.js    # Control buttons
│   │   ├── RecordingOptions.js     # Settings panel
│   │   ├── FileManager.js          # File management
│   │   ├── VideoPreview.js         # Video player
│   │   ├── AreaSelector.js         # Custom area selector
│   │   ├── UserProfile.js          # User profile dropdown
│   │   ├── NotificationCenter.js   # Notification system
│   │   ├── InstallPrompt.js        # PWA install prompt
│   │   └── ...
│   ├── contexts/           # React contexts
│   │   └── ThemeContext.js # Theme management
│   ├── utils/              # Utility functions
│   │   ├── hooks.js        # Custom React hooks
│   │   └── planFeatures.js # Plan feature management
│   ├── styles/             # Global styles
│   │   └── themes.css      # Theme variables
│   ├── service-worker.js   # Service worker
│   ├── serviceWorkerRegistration.js
│   ├── App.js              # Root component
│   ├── index.js            # Entry point
│   └── index.css           # Global styles
├── package.json
└── README.md
```

### Available Scripts

```bash
# Development
npm start              # Start dev server (localhost:3000)
npm test              # Run test suite
npm run build         # Production build

# Deployment
npm run deploy        # Deploy to GitHub Pages

# Code Quality
npm run lint          # Run ESLint
npm run format        # Format with Prettier
```

### Custom Hooks

```javascript
// Performance monitoring
usePerformanceMonitoring()

// Keyboard shortcuts
useKeyboardShortcuts(handlers)

// Browser support detection
checkBrowserSupport()

// Recording settings optimization
optimizeRecordingSettings(device)
```

### Environment Variables

Create a `.env.local` file:

```env
REACT_APP_VERSION=1.0.0
REACT_APP_API_URL=https://api.example.com
PUBLIC_URL=/nebula-screen-capture
```

---

## 🚀 Deployment

### GitHub Pages (Current)

```bash
# Automatic deployment
npm run deploy
```

**Live URL**: https://nebula3ddev.com

### Other Platforms

#### Vercel
```bash
npm install -g vercel
vercel --prod
```

#### Netlify
```bash
npm run build
# Drag & drop build/ folder to Netlify
```

#### Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

---
---

## 📚 Documentation

All comprehensive guides and documentation have been moved to the `/documentation` folder for a cleaner repository structure.

### Key Documentation

**Publishing & Deployment:**
- 📖 [Google Play Publishing Guide](documentation/GOOGLE_PLAY_GUIDE.md)
- 🛠️ [Android Deployment](documentation/ANDROID_DEPLOYMENT.md)
- 🎨 [App Graphics Guide](documentation/APP_GRAPHICS_GUIDE.md)
- ✅ [Launch Checklist](documentation/LAUNCH_CHECKLIST.md)

**Legal:**
- ⚖️ [Privacy Policy](documentation/PRIVACY_POLICY.md)
- 📜 [Terms of Service](documentation/TERMS_OF_SERVICE.md)

**Technical:**
- 📧 [Email Setup Guide](documentation/EMAIL_SETUP_GUIDE.md)
- 🔒 [Security Implementation](documentation/SECURITY_IMPLEMENTATION.md)
- 💳 [Payment Setup](documentation/PAYMENT_SETUP.md)

[View All Documentation →](documentation/)

---

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Reporting Bugs
1. Check existing issues first
2. Create detailed bug report with:
   - Browser and version
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable

### Feature Requests
1. Search existing feature requests
2. Describe the feature and use case
3. Explain why it would benefit users

### Pull Requests
1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

### Code Style
- Follow existing code patterns
- Use meaningful variable names
- Comment complex logic
- Run `npm run lint` before committing

---

## 📄 License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2025 Colin Nebula / Nebula Media 3D

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

See [LICENSE](LICENSE) file for full details.

---

## 👨‍💻 About

### Developer

**Colin Nebula**  
Full-Stack Developer & Creator

- 🌐 GitHub: [@ColinNebula](https://github.com/ColinNebula)
- 💼 LinkedIn: [Colin Nebula](https://linkedin.com/in/colin-nebula)
- 📧 Email: colin@nebulamedia3d.com

### Company

**Nebula Media 3D**  
*Innovation in Media & Technology*

Nebula Media 3D is committed to creating cutting-edge web applications and multimedia solutions. We specialize in:
- Progressive Web Apps
- 3D Visualization
- Media Processing
- Interactive Experiences

🌐 Website: [nebulamedia3d.com](https://nebulamedia3d.com)  
📧 Contact: info@nebulamedia3d.com

---

### Acknowledgments

Special thanks to:
- React team for amazing framework
- Chrome DevRel for PWA guidance
- MDN Web Docs for comprehensive documentation
- Open source community for inspiration

---

## 🔒 Security

Nebula Screen Capture takes security seriously. We've implemented multiple layers of protection to keep your data safe and prevent manipulation.

### Security Features

#### 🛡️ Content Security Policy (CSP)
- Strict CSP headers prevent XSS attacks
- Only trusted sources can load scripts and resources
- `frame-ancestors: none` prevents clickjacking
- Inline script restrictions with nonces

#### 🔐 Input Validation & Sanitization
- All user inputs validated and sanitized
- Filename validation prevents directory traversal
- HTML sanitization prevents XSS injection
- URL validation prevents SSRF attacks
- See `src/utils/security.js` for implementation

#### 🔒 Security Headers
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(self), microphone=(self)
```

#### 🚦 Rate Limiting
- Client-side rate limiting prevents abuse
- Configurable limits on user actions
- Automatic cleanup of old request records

#### 🔐 Secure Context Requirements
- Requires HTTPS in production
- Screen Capture API only in secure contexts
- Service workers require secure origins

#### 📊 Dependency Security
- Automated vulnerability scanning via GitHub Actions
- Dependabot configured for weekly security updates
- Regular `npm audit` checks
- No high-severity vulnerabilities in production dependencies

#### 🎯 Data Protection
- **Local-Only Storage**: All recordings stored in your browser (IndexedDB)
- **Zero Server Transmission**: No data sent to external servers
- **Blob URL Validation**: Ensures media URLs are from same origin
- **Secure Storage Wrapper**: Protected localStorage with validation

### Security Best Practices

#### For Users:
✅ Always use HTTPS (automatically enforced on GitHub Pages)  
✅ Keep your browser updated  
✅ Review recording permissions before granting  
✅ Download sensitive recordings promptly  
✅ Clear browser data if using public computers

#### For Developers:
✅ Never commit secrets to repository  
✅ Use provided security utilities (`security.js`)  
✅ Run `npm audit` before every commit  
✅ Validate all user inputs  
✅ Follow OWASP security guidelines  
✅ Test security features in PRs

### Vulnerability Reporting

Found a security issue? We take it seriously!

**Please DO:**
- Report privately to: [security@nebulamedia3d.com]
- Provide detailed reproduction steps
- Allow 90 days for fix before public disclosure
- Act in good faith

**Response Timeline:**
- Initial response: 48 hours
- Critical fixes: 7 days
- High severity: 30 days
- Medium/Low: 60-90 days

See our full [Security Policy](SECURITY.md) for details.

### Security Audits

Automated security checks run on:
- ✅ Every push to main branch
- ✅ All pull requests
- ✅ Weekly scheduled scans
- ✅ Dependency updates

View our security status:
- [Security Audit Workflow](.github/workflows/security-audit.yml)
- [Dependabot Configuration](.github/dependabot.yml)
- [Security Policy](SECURITY.md)

### Environment Variables

Sensitive configuration protected:
- `.env` files in `.gitignore`
- `.env.example` template provided
- No secrets in source code
- Environment variables validated

### Known Security Limitations

⚠️ **Browser-Based Constraints:**
- Recordings stored in browser can be cleared
- Malicious browser extensions could access data
- Physical device access bypasses browser security

⚠️ **Platform-Specific:**
- iOS Safari: Limited API support
- Private browsing: Reduced functionality

---

### Support

Need help? Have questions?

- 📖 [Documentation](https://github.com/ColinNebula/nebula-screen-capture/wiki)
- 💬 [Discussions](https://github.com/ColinNebula/nebula-screen-capture/discussions)
- 🐛 [Issues](https://github.com/ColinNebula/nebula-screen-capture/issues)
- 🔒 [Security Policy](SECURITY.md)
- 📧 Email: support@nebulamedia3d.com

---

<div align="center">

### ⭐ Star this repository if you find it helpful!

**Made with ❤️ by Colin Nebula for Nebula Media 3D**

*Professional Screen Recording • Anywhere, Anytime*

[Website](https://nebulamedia3d.com) • [GitHub](https://github.com/ColinNebula) • [Twitter](https://twitter.com/ColinNebula)

---

**© 2025 Nebula Media 3D. All Rights Reserved.**

</div>
