# Electron Build Checklist

This document ensures all necessary files and configurations are in place before building the Electron app.

## ✅ Pre-Build Checklist

### Required Files
- [x] `electron.js` - Main Electron process
- [x] `preload.cjs` - Preload script (CommonJS)
- [x] `package.json` - Package configuration
- [x] `electron-builder.json` - Build configuration
- [x] `build/index.html` - Built application entry point
- [x] `build/static/` - Built static assets (JS, CSS)

### Configuration Files
- [x] `electron-builder.json` - Includes `preload.cjs` in files list
- [x] `electron.js` - References `preload.cjs` (not `preload.js`)
- [x] `electron.js` - Loads `build/index.html` for production
- [x] `vite.config.js` - Uses `base: './'` for relative paths
- [x] `package.json` - `"main": "electron.js"`
- [x] `package.json` - `"type": "module"` for ES6 modules

### Build Output Verification
- [x] `build/` directory exists
- [x] `build/index.html` exists
- [x] `build/static/*.js` files exist
- [x] `build/static/*.css` files exist
- [x] CSP headers allow `file://` protocol
- [x] All asset paths are relative (not absolute)

## 🔧 Build Configuration

### electron-builder.json
```json
{
  "files": [
    "build/**/*",        // All built files
    "electron.js",       // Main process
    "preload.cjs",       // Preload script (CommonJS)
    "package.json",      // Package metadata
    "node_modules/**/*"  // Dependencies
  ],
  "asarUnpack": [
    "build/wasm/**/*",   // WASM files (unpacked for loading)
    "build/static/**/*"  // Static assets (unpacked if needed)
  ]
}
```

### Files Excluded (via .electronbuilderignore)
- `src/` - Source files (already built)
- `public/` - Public assets (already copied to build/)
- `docs/` - Documentation
- `*.md` - Markdown files (except README.md)
- Development configuration files
- Git files and folders

## 🚀 Build Commands

### Verify Before Building
```bash
npm run verify:electron
```

### Build for Windows
```bash
npm run electron:build:win
```
This will:
1. Build the Vite app → `build/`
2. Verify all files are present
3. Package with electron-builder
4. Create installers in `dist/`

### Build Outputs
- `dist/win-unpacked/` - Unpacked application
- `dist/Nebula Screen Capture Setup 0.1.0.exe` - NSIS installer
- `dist/Nebula Screen Capture 0.1.0.exe` - Portable version

## 🔍 Verification Script

The verification script (`scripts/verify-electron-build.js`) checks:

1. **Required Files**: electron.js, preload.cjs, package.json, etc.
2. **Required Directories**: build/, build/static/
3. **Build Output**: JS and CSS files in build/static/
4. **electron-builder.json**: Correct file references
5. **electron.js**: References preload.cjs and build/index.html

Run it manually:
```bash
node scripts/verify-electron-build.js
```

## ⚠️ Common Issues

### Issue: Preload script error
**Solution**: Ensure `preload.cjs` is referenced in both:
- `electron-builder.json` → `files` array
- `electron.js` → `webPreferences.preload` path

### Issue: CSP blocking scripts
**Solution**: Update `public/index.html` CSP to allow `file:` protocol:
```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self' file:; script-src 'self' 'unsafe-inline' 'unsafe-eval' file:; ...">
```

### Issue: Service Worker errors
**Solution**: Service Worker detection in `updateNotificationService.js`:
```javascript
const isElectron = window.electron?.isElectron || 
                   navigator.userAgent.toLowerCase().includes('electron') ||
                   window.location.protocol === 'file:';
if (isElectron) return; // Skip service worker in Electron
```

### Issue: Assets not found
**Solution**: 
- Ensure `vite.config.js` has `base: './'`
- Check that `electron.js` loads `build/index.html`
- Verify all paths in HTML are relative (not starting with `/`)

## 📦 What Gets Packaged

### Included in ASAR
- `electron.js` (main process)
- `preload.cjs` (preload script)
- `package.json` (metadata)
- `build/**/*` (built application)
- `node_modules/**/*` (dependencies)

### Unpacked (asarUnpack)
- `build/wasm/**/*` (WASM modules need to be unpacked)
- `build/static/**/*` (static assets)

### Excluded
- Source code (`src/`)
- Development tools
- Documentation
- Build scripts
- Git files

## 🎯 Best Practices

1. **Always run verification before building**:
   ```bash
   npm run verify:electron
   ```

2. **Clean build for major changes**:
   ```bash
   npm run clean
   npm install
   npm run electron:build:win
   ```

3. **Test the unpacked version first**:
   ```bash
   npm run pack
   # Test from dist/win-unpacked/
   ```

4. **Check build size**:
   - Monitor `dist/` folder size
   - Large size? Check `node_modules` includes only production deps

5. **Test installed version**:
   - Install the NSIS installer
   - Test all features work
   - Check for console errors (F12)

## 📋 Release Checklist

Before releasing a new version:

- [ ] Update version in `package.json`
- [ ] Run `npm run verify:electron`
- [ ] Run `npm run electron:build:win`
- [ ] Test unpacked version in `dist/win-unpacked/`
- [ ] Install and test NSIS installer
- [ ] Test portable version
- [ ] Check for console errors
- [ ] Verify all features work (recording, screenshots, etc.)
- [ ] Test on fresh Windows install (if possible)
- [ ] Document known issues
- [ ] Create release notes

## 🔗 Related Files

- `electron.js` - Main Electron configuration
- `preload.cjs` - Secure API bridge
- `electron-builder.json` - Build configuration
- `vite.config.js` - Vite build configuration
- `package.json` - Package metadata and scripts
- `.electronbuilderignore` - Files to exclude from build
- `scripts/verify-electron-build.js` - Pre-build verification

## 🛠️ Troubleshooting

If build fails, check:
1. Run verification: `npm run verify:electron`
2. Check console output for specific errors
3. Verify all dependencies installed: `npm install`
4. Clear cache: `npm run clean:cache`
5. Clean build: `npm run clean && npm install`
6. Check electron-builder logs in terminal
7. Verify `dist/` folder permissions
