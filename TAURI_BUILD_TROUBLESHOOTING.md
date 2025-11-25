# Tauri Build Issues - Troubleshooting Guide

## Problem
Tauri build fails with "Access is denied" or "file not found" errors when linking build scripts on Windows.

## Root Cause
This is a known issue with Cargo on Windows related to:
1. **Antivirus interference** - Windows Defender or other antivirus software blocking .exe file creation
2. **File path length** - Windows MAX_PATH limit (260 characters)
3. **File system race conditions** - Cargo trying to copy files while antivirus is scanning them

## Solutions Attempted

### ✅ Solution 1: Shorter Build Path (Partially Successful)
Created `.cargo/config.toml` to use shorter target directory:
```toml
[build]
target-dir = "Z:/tmp-tauri-build"
```

### ❌ Solution 2: Admin Privileges
Running PowerShell as administrator doesn't fully resolve the issue due to antivirus.

### 🔄 Solution 3: Disable Incremental Compilation
Set environment variable:
```powershell
$env:CARGO_INCREMENTAL = "0"
```

## Recommended Workaround

### Option A: Add Antivirus Exclusion (RECOMMENDED)
1. Open Windows Security
2. Go to "Virus & threat protection"
3. Click "Manage settings"
4. Scroll to "Exclusions" and click "Add or remove exclusions"
5. Add these folders:
   - `Z:\Directory\projects\nebula-screen-capture\src-tauri\target`
   - `Z:\tmp-tauri-build`
   - `C:\Users\[YourUsername]\.cargo`

### Option B: Use Browser-Only Version
The app works perfectly in browser mode at `http://localhost:3002/`

File save/open features work with browser download/upload as fallback:
- **Save Project**: Downloads `.nsp` file to your Downloads folder
- **Open Project**: File picker opens to select `.nsp` file
- Full functionality available without Tauri desktop build

### Option C: Build on Different Machine
Try building on:
- Windows Subsystem for Linux (WSL2)
- Different Windows machine without strict antivirus
- Linux/Mac machine

## To Test Browser Version Now

```powershell
npm run dev
```

Then open `http://localhost:3002/` - all features including file save/open work!

## To Retry Tauri Build After Antivirus Exclusion

```powershell
# Clean everything
Remove-Item -Path "Z:\tmp-tauri-build" -Recurse -Force -ErrorAction SilentlyContinue
cd src-tauri
cargo clean

# Try build
cd ..
npm run tauri:dev
```

## Current Status
- ✅ Web app running perfectly on port 3002
- ✅ File save/open implemented with browser fallback
- ✅ Splash screen working
- ✅ All features functional in browser
- ❌ Tauri desktop build blocked by antivirus (needs exclusion)

## Next Steps
1. Add antivirus exclusions (see Option A above)
2. Or continue using browser version (fully functional)
3. Desktop build gives native file dialogs, but browser download/upload works fine
