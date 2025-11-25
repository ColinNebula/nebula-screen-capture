# Nebula Screen Capture - Electron Desktop App

Transform your Nebula PWA into a powerful desktop application with native OS integration!

## 🚀 Quick Start

### Development Mode
Run the app in development mode with hot reload:
```bash
npm run electron:dev
```

This will:
1. Start the Vite dev server (http://localhost:3000)
2. Wait for the server to be ready
3. Launch Electron and load the app

### Production Build

#### Build for Windows
```bash
npm run electron:build:win
```

#### Build for macOS
```bash
npm run electron:build:mac
```

#### Build for Linux
```bash
npm run electron:build:linux
```

#### Build for all platforms
```bash
npm run electron:build
```

Built installers will be in the `dist/` folder.

## 📦 What's Included

### Files Created
- `electron.js` - Main Electron process
- `preload.js` - Secure bridge between main and renderer
- `electron-builder.json` - Build configuration
- `build/entitlements.mac.plist` - macOS permissions
- `src/utils/electronIntegration.js` - Helper utilities

### Features

#### ✅ Native Screen Capture
- Access to all screens and windows
- Better performance than browser API
- No browser permission prompts

#### ✅ Window Management
- Minimize/restore window during recording
- Hide window completely if needed
- Full screen control

#### ✅ OS Integration
- Native file system access
- System tray support (ready to add)
- Auto-launch on startup (ready to add)
- Native notifications

#### ✅ Enhanced Privacy
- No browser restrictions
- Local processing only
- Full control over recordings

## 🛠️ Architecture

### Main Process (`electron.js`)
- Creates and manages windows
- Handles system-level operations
- Provides IPC handlers for renderer

### Preload Script (`preload.js`)
- Secure API exposure via contextBridge
- No direct Node.js access in renderer
- Type-safe IPC communication

### Renderer Process (Your Svelte App)
- Runs your existing web app
- Uses `window.electron` API when available
- Falls back to browser APIs gracefully

## 🔧 Using Electron APIs in Your Code

```javascript
import { isElectron, windowManager, getCaptureStream } from './utils/electronIntegration';

// Check if running in Electron
if (isElectron()) {
  console.log('Running in Electron!');
}

// Minimize window during recording
await windowManager.minimize();

// Get screen capture with Electron
const stream = await getCaptureStream(sourceId);

// Restore window after recording
await windowManager.restore();
```

## 📱 Available APIs

### Window Management
```javascript
await window.electron.minimizeWindow();
await window.electron.restoreWindow();
await window.electron.hideWindow();
await window.electron.showWindow();
```

### Screen Capture
```javascript
const sources = await window.electron.getSources({
  types: ['window', 'screen'],
  thumbnailSize: { width: 300, height: 200 }
});
```

### App Info
```javascript
const version = await window.electron.getAppVersion();
const userDataPath = await window.electron.getAppPath('userData');
const platform = window.electron.platform; // 'win32', 'darwin', 'linux'
```

### App Control
```javascript
await window.electron.quitApp();
```

## 🎨 Customization

### App Icon
Place your icons in the `build/` folder:
- `icon.ico` - Windows icon
- `icon.icns` - macOS icon
- `icons/` - Linux icons (various sizes)

### Build Settings
Edit `electron-builder.json` to customize:
- App ID and name
- Target formats
- Installation options
- Code signing (for distribution)

### Window Options
Edit `electron.js` `createWindow()` to change:
- Window size and position
- Frame style
- Background color
- Web preferences

## 🔒 Security

### Content Security Policy
The app uses strict CSP by default. If you need to adjust it, edit the CSP meta tag in `public/index.html`.

### Context Isolation
- Enabled by default ✅
- Node integration disabled ✅
- Remote module disabled ✅
- Secure preload script ✅

## 📦 Distribution

### Code Signing (Recommended)
For Windows:
```json
"win": {
  "certificateFile": "path/to/cert.pfx",
  "certificatePassword": "your-password"
}
```

For macOS:
```json
"mac": {
  "identity": "Developer ID Application: Your Name"
}
```

### Auto Updates (Optional)
Add electron-updater:
```bash
npm install electron-updater --save
```

Configure in `electron-builder.json`:
```json
"publish": {
  "provider": "github",
  "owner": "ColinNebula",
  "repo": "nebula-screen-capture"
}
```

## 🐛 Troubleshooting

### Port 3000 already in use
```bash
# Kill the process using port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use a different port in vite.config.js
```

### Electron won't start
```bash
# Clear node_modules and reinstall
npm run clean
npm install
```

### Build fails
```bash
# Clear electron-builder cache
npx electron-builder clean
npm run electron:build
```

## 📚 Learn More

- [Electron Documentation](https://www.electronjs.org/docs/latest)
- [Electron Builder](https://www.electron.build/)
- [Security Best Practices](https://www.electronjs.org/docs/latest/tutorial/security)

## 🎯 Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Run in dev mode: `npm run electron:dev`
3. 🎨 Customize the app icon in `build/`
4. 🔧 Integrate Electron APIs in your components
5. 📦 Build for production: `npm run electron:build:win`
6. 🚀 Distribute your app!

---

**Note**: The app works as both a web app (PWA) and desktop app (Electron). All features gracefully fall back to browser APIs when not running in Electron.
