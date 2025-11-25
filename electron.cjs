const { app, BrowserWindow, ipcMain, desktopCapturer, dialog, Menu, shell } = require("electron");
const path = require("path");
const fs = require("fs").promises;

const isDev = !app.isPackaged;
let mainWindow;

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Recording',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-action', 'start-recording');
            }
          }
        },
        {
          label: 'Open File Manager',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-action', 'open-file-manager');
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Settings',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-action', 'open-settings');
            }
          }
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'delete' },
        { type: 'separator' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'close' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Welcome Guide',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-action', 'show-welcome');
            }
          }
        },
        {
          label: 'Keyboard Shortcuts',
          accelerator: 'F1',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-action', 'show-keyboard-shortcuts');
            }
          }
        },
        {
          label: 'Command Palette',
          accelerator: 'CmdOrCtrl+K',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-action', 'show-command-palette');
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Documentation',
          click: async () => {
            await shell.openExternal('https://github.com/ColinNebula/nebula-screen-capture#readme');
          }
        },
        {
          label: 'Report Issue',
          click: async () => {
            await shell.openExternal('https://github.com/ColinNebula/nebula-screen-capture/issues');
          }
        },
        {
          label: 'Release Notes',
          click: async () => {
            await shell.openExternal('https://github.com/ColinNebula/nebula-screen-capture/releases');
          }
        },
        { type: 'separator' },
        {
          label: 'Check for Updates',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-action', 'check-updates');
            }
          }
        },
        { type: 'separator' },
        {
          label: 'About Nebula Screen Capture',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About Nebula Screen Capture',
              message: 'Nebula Screen Capture',
              detail: `Version: ${app.getVersion()}\n\nProfessional screen recording made simple.\n\nCapture your screen with high-quality video and audio, customize recording settings, and manage your recordings with ease.\n\n© 2025 Nebula Team`,
              buttons: ['OK']
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createWindow() {
  // Set app icon based on platform
  // Using logo512.png for better quality across all platforms
  const iconPath = isDev 
    ? path.join(__dirname, 'public', 'logo512.png')
    : path.join(__dirname, 'build', 'logo512.png');

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: iconPath,
    title: 'Nebula Screen Capture',
    resizable: true,
    maximizable: true,
    webPreferences: {
      nodeIntegration: false, // CRITICAL: Never enable nodeIntegration
      contextIsolation: true, // CRITICAL: Isolate context between main and renderer
      enableRemoteModule: false, // CRITICAL: Disable remote module
      preload: path.join(__dirname, "preload.cjs"),
      webSecurity: true, // Enable web security
      allowRunningInsecureContent: false, // Block insecure content
      experimentalFeatures: false, // Disable experimental features
      enableBlinkFeatures: '', // Don't enable extra features
      disableBlinkFeatures: 'Auxclick', // Disable auxiliary click
      sandbox: true, // Enable sandbox for extra isolation
      safeDialogs: true, // Prevent dialog spam
      safeDialogsMessage: 'Prevent multiple dialogs',
      navigateOnDragDrop: false, // Prevent navigation on drag-drop
      autoplayPolicy: 'user-gesture-required', // Require user gesture for autoplay
      spellcheck: false // Disable spellcheck to prevent data leaks
    }
  });

  const startUrl = isDev
    ? "http://localhost:3001"
    : "file://" + path.join(__dirname, "build/index.html");

  mainWindow.loadURL(startUrl);

  // SECURITY: Block navigation to external URLs
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    const allowedOrigins = [
      'http://localhost:3001',
      'http://localhost:3002',
      'file://'
    ];
    
    const isAllowed = allowedOrigins.some(origin => 
      navigationUrl.startsWith(origin)
    );
    
    if (!isAllowed) {
      console.warn('Blocked navigation to:', navigationUrl);
      event.preventDefault();
    }
  });

  // SECURITY: Block new window creation (prevent popup attacks)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Allow only safe external URLs via shell
    const allowedDomains = [
      'github.com',
      'stripe.com',
      'firebase.google.com'
    ];
    
    try {
      const parsedUrl = new URL(url);
      if (allowedDomains.some(domain => parsedUrl.hostname.includes(domain))) {
        shell.openExternal(url);
      } else {
        console.warn('Blocked window open:', url);
      }
    } catch (err) {
      console.error('Invalid URL:', url);
    }
    
    return { action: 'deny' };
  });

  // SECURITY: Sanitize any web request
  mainWindow.webContents.session.webRequest.onBeforeRequest((details, callback) => {
    const url = details.url;
    
    // Block known malicious patterns
    const blockedPatterns = [
      /javascript:/i,
      /data:text\/html/i,
      /vbscript:/i,
      /about:blank#blocked/i
    ];
    
    const isBlocked = blockedPatterns.some(pattern => pattern.test(url));
    
    if (isBlocked) {
      console.warn('Blocked malicious request:', url);
      callback({ cancel: true });
    } else {
      callback({ cancel: false });
    }
  });

  // SECURITY: Set secure headers
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; " +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.gstatic.com; " +
          "style-src 'self' 'unsafe-inline'; " +
          "img-src 'self' data: blob: https:; " +
          "font-src 'self' data:; " +
          "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://*.stripe.com wss://*.firebaseio.com; " +
          "media-src 'self' blob: mediastream:; " +
          "worker-src 'self' blob:; " +
          "frame-src 'self' https://js.stripe.com https://*.firebaseapp.com; " +
          "object-src 'none'; " +
          "base-uri 'self';"
        ],
        'X-Content-Type-Options': ['nosniff'],
        'X-Frame-Options': ['DENY'],
        'X-XSS-Protection': ['1; mode=block'],
        'Referrer-Policy': ['strict-origin-when-cross-origin'],
        'Permissions-Policy': [
          'camera=(), microphone=(), geolocation=(), payment=()'
        ]
      }
    });
  });

  // Enable permissions for media capture
  mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowedPermissions = ['media', 'mediaKeySystem', 'displayCapture'];
    if (allowedPermissions.includes(permission)) {
      callback(true);
    } else {
      console.warn('Blocked permission request:', permission);
      callback(false);
    }
  });

  mainWindow.webContents.session.setPermissionCheckHandler((webContents, permission) => {
    return permission === 'media' || permission === 'displayCapture';
  });

  // Log loading events
  mainWindow.webContents.on("did-fail-load", (event, errorCode, errorDescription) => {
    console.error("Failed to load:", errorCode, errorDescription);
  });

  mainWindow.webContents.on("did-finish-load", () => {
    console.log("Page loaded successfully");
  });

  // Don't auto-open DevTools to avoid interference with screen recording
  // Users can open DevTools manually with Ctrl+Shift+I or F12

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Create the application menu
  createMenu();
}

ipcMain.handle("get-sources", async () => {
  try {
    const sources = await desktopCapturer.getSources({ 
      types: ["window", "screen"],
      thumbnailSize: { width: 150, height: 150 }
    });
    console.log('Available sources:', sources.map(s => s.name));
    return sources;
  } catch (error) {
    console.error('Error getting sources:', error);
    return [];
  }
});

// Window control handlers
ipcMain.handle('minimize-window', () => {
  if (mainWindow) {
    mainWindow.minimize();
    console.log('Window minimized');
  }
});

ipcMain.handle('restore-window', () => {
  if (mainWindow) {
    mainWindow.restore();
    mainWindow.focus();
    console.log('Window restored');
  }
});

ipcMain.handle('hide-window', () => {
  if (mainWindow) {
    mainWindow.hide();
    console.log('Window hidden');
  }
});

ipcMain.handle('show-window', () => {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
    console.log('Window shown');
  }
});

// File save dialog handler with validation
ipcMain.handle('show-save-dialog', async (event, options) => {
  try {
    // Validate options
    const safeOptions = {
      title: typeof options?.title === 'string' ? options.title : 'Save File',
      defaultPath: typeof options?.defaultPath === 'string' ? options.defaultPath : '',
      filters: Array.isArray(options?.filters) ? options.filters : [],
      properties: ['createDirectory', 'showOverwriteConfirmation']
    };
    
    const result = await dialog.showSaveDialog(mainWindow, safeOptions);
    console.log('Save dialog result:', result.canceled ? 'canceled' : result.filePath);
    return result;
  } catch (error) {
    console.error('Error showing save dialog:', error);
    return { canceled: true };
  }
});

// File write handler with security checks
ipcMain.handle('write-file', async (event, filePath, buffer) => {
  try {
    // SECURITY: Validate file path
    if (typeof filePath !== 'string' || !filePath) {
      throw new Error('Invalid file path');
    }
    
    // SECURITY: Prevent path traversal
    if (filePath.includes('..') || filePath.includes('~')) {
      throw new Error('Path traversal attempt detected');
    }
    
    // SECURITY: Validate buffer
    if (!buffer || !(buffer instanceof Uint8Array || Buffer.isBuffer(buffer))) {
      throw new Error('Invalid buffer data');
    }
    
    // SECURITY: Check file size limit (500MB)
    const maxSize = 500 * 1024 * 1024;
    if (buffer.length > maxSize) {
      throw new Error('File size exceeds maximum limit');
    }
    
    // Write file
    await fs.writeFile(filePath, Buffer.from(buffer));
    console.log('File written successfully:', path.basename(filePath));
    return { success: true, filePath };
  } catch (error) {
    console.error('Error writing file:', error.message);
    return { success: false, error: error.message };
  }
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
