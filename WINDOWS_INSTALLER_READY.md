# Windows Installer Build - Quick Start

## Summary

I've set up everything you need to build standalone Windows installers for Nebula Screen Capture. Here's what was configured:

### ✅ What's Ready

1. **Tauri Configuration** (`src-tauri/tauri.conf.json`)
   - Configured for MSI and NSIS installers
   - WebView2 embedBootstrapper mode (smaller size, downloads during install)
   - All icons properly referenced

2. **Build Scripts**
   - `build-tauri-installer.ps1` - Main build script
   - `test-tauri-installer.ps1` - Installer testing script
   - npm scripts added to package.json

3. **Documentation**
   - `TAURI_INSTALLER_GUIDE.md` - Complete guide

### 🚀 How to Build

#### Option 1: Simple Command
```powershell
npx tauri build
```

#### Option 2: Use Build Script
```powershell
.\build-tauri-installer.ps1
```

#### Option 3: npm scripts
```powershell
# Build both MSI and NSIS
npm run tauri:build:installer

# Build only MSI
npm run tauri:build:installer:msi

# Build only NSIS  
npm run tauri:build:installer:nsis
```

### 📦 What You Get

After building, installers will be in:
```
src-tauri/target/release/bundle/
├── msi/
│   └── Nebula Screen Capture_0.1.0_x64_en-US.msi
└── nsis/
    └── Nebula Screen Capture_0.1.0_x64-setup.exe
```

### 🔧 Standalone Features

Your app is configured to work **completely standalone**:

✅ **Offline Mode**
- No internet required after installation
- All features work locally
- LocalStorage for data persistence

✅ **Firebase Integration** (Optional)
- Works if `.env` file has Firebase credentials
- Falls back to offline mode if not configured
- Users won't see errors

✅ **WebView2 Runtime**
- Embedded bootstrapper downloads it during install
- Falls back to system WebView2 if present
- Only needs internet once during installation

### 🛠️ Build Requirements

Make sure you have installed:
- [x] Node.js (v16+)
- [x] Rust & Cargo (from https://rustup.rs/)
- [ ] Visual Studio Build Tools (for Windows)

### ⚡ Quick Build

If you just want to build right now:

```powershell
# Make sure frontend is built
npm run build

# Build installers (this takes 5-10 minutes first time)
npx tauri build
```

### 🧪 Testing

After building:

```powershell
# Analyze the installer
.\test-tauri-installer.ps1 -AutoDetect

# Or manually test
.\src-tauri\target\release\bundle\nsis\Nebula Screen Capture_0.1.0_x64-setup.exe
```

### 📝 Next Steps

1. **Build the installer** using one of the methods above
2. **Test on a clean Windows machine** to ensure standalone operation
3. **Verify all features work** without internet
4. **Distribute** to users

### 🔐 Code Signing (Optional for Production)

For production release, consider code signing to avoid Windows security warnings:
- Get a code signing certificate
- Configure in `tauri.conf.json`
- Sign with `signtool`

See `TAURI_INSTALLER_GUIDE.md` for detailed code signing instructions.

### 💡 Tips

- First build takes 5-10 minutes (Rust compilation)
- Subsequent builds are much faster (~2 minutes)
- Use `-SkipBuild` if frontend hasn't changed
- MSI is better for enterprise, NSIS for general users

### 🐛 Troubleshooting

**Build fails with Rust error?**
```powershell
rustup update
cd src-tauri
cargo clean
cd ..
```

**WebView2 issues?**
- Install WebView2 Runtime manually first
- Or change config to `offlineInstaller` mode (larger file)

**Want smaller installer?**
- Use `embedBootstrapper` (current setting)
- Requires internet during installation only

**Want fully offline installer?**
- Change to `offlineInstaller` in tauri.conf.json
- Adds ~100MB to installer size

### 📚 Documentation

- `TAURI_INSTALLER_GUIDE.md` - Complete detailed guide
- `TAURI_LOGIN_FIX.md` - Tauri-specific fixes applied
- Tauri Docs: https://tauri.app/

---

## Current Configuration Status

- ✅ Frontend built and ready (`build/` directory exists)
- ✅ Tauri configured for Windows installers
- ✅ Build scripts created
- ✅ Test scripts created
- ✅ Documentation complete
- ⏳ Ready to build installer

**Run this command to build:**
```powershell
npx tauri build
```

This will create both MSI and NSIS installers in approximately 5-10 minutes (first build).

