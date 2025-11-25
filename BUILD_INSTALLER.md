# 🎉 Installer Creation - Quick Start

## 🚀 Build Your Installer (3 Easy Steps)

### Step 1: Prepare
```bash
npm install
```

### Step 2: Build
```bash
# Option A: Double-click this file (easiest)
build-installer.bat

# Option B: PowerShell
.\build-installer.ps1

# Option C: npm command
npm run build:installer
```

### Step 3: Find Your Installer
Look in the `dist/` folder for:
- ✅ `Nebula Screen Capture-Setup-{version}.exe` - **Main installer**
- ✅ `Nebula Screen Capture-{version}.exe` - Portable version  
- ✅ `Nebula Screen Capture-{version}-win.zip` - Archive

---

## 📦 What Gets Created

### 1. **Setup Installer** (Recommended for distribution)
- Professional Windows installer
- Creates shortcuts (Desktop + Start Menu)
- File associations for .webm and .mp4
- Easy uninstallation
- ~180 MB

### 2. **Portable Version** (No installation)
- Single .exe file
- Run from anywhere (USB, folder, etc.)
- No installation needed
- Perfect for testing
- ~200 MB

### 3. **Archive** (Manual installation)
- .zip file to extract
- Run from extracted folder
- ~140 MB compressed

---

## 🛠️ Build Commands

```bash
# Basic build
npm run build:installer

# Clean build (removes old files first)
npm run build:installer:clean

# Quick build (if already built web app)
npm run build:quick

# Build for all platforms (Windows, Mac, Linux)
npm run build:all

# Test the installer
npm run test:installer
```

---

## 📊 Build Process

The build process:
1. ✅ Checks prerequisites (Node.js, npm)
2. ✅ Installs dependencies (if needed)
3. ✅ Builds the web application
4. ✅ Verifies Electron build
5. ✅ Creates Windows installers
6. ✅ Shows output file sizes

**Time:** ~5-10 minutes (first build may take longer)

---

## 🎯 Distribution Checklist

Before distributing your installer:

- [ ] Test on clean Windows PC
- [ ] Verify installation process
- [ ] Test all features work
- [ ] Test uninstallation
- [ ] Check file associations
- [ ] Test portable version
- [ ] Document version number
- [ ] Create release notes

---

## 📋 System Requirements (For End Users)

- Windows 10/11 (64-bit)
- 4 GB RAM minimum
- 500 MB free disk space
- Modern web browser

---

## 🐛 Common Issues

### Build fails?
```bash
# Clean and rebuild
.\build-installer.ps1 -Clean
```

### "Windows protected your PC" warning?
- Normal for unsigned apps
- Click "More info" → "Run anyway"
- To avoid: Get code signing certificate ($300-500/year)

### Need help?
- Check `docs/INSTALLER_BUILD_GUIDE.md` for detailed guide
- Check `INSTALLATION_GUIDE.md` for user instructions

---

## 📚 Documentation

- **Building:** `docs/INSTALLER_BUILD_GUIDE.md`
- **Installing:** `INSTALLATION_GUIDE.md`
- **Electron Builder:** `electron-builder.json`
- **Custom Installer:** `build/installer.nsh`

---

## ✨ Advanced Options

### Update Version
```powershell
.\build-installer.ps1 -Version "1.2.0"
```

### Build Specific Platform
```bash
npm run electron:build:win   # Windows only
npm run electron:build:mac   # macOS only
npm run electron:build:linux # Linux only
```

### Skip Web Build
```powershell
.\build-installer.ps1 -SkipBuild
```

---

## 🎉 You're Ready!

Your installer is production-ready and can be distributed to other PCs!

**Share it via:**
- GitHub Releases
- Your website
- Cloud storage
- Microsoft Store (requires setup)

---

**Need Help?** Open an issue on GitHub or check the detailed guides!

**Happy Recording! 🎬**
