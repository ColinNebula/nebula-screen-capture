const { contextBridge, ipcRenderer } = require('electron');

// SECURITY: Validate all inputs before sending to main process
function validateString(value) {
  if (typeof value !== 'string') return '';
  // Remove any potential script injection
  return value.replace(/<script[^>]*>.*?<\/script>/gi, '').trim();
}

function validateFilePath(filePath) {
  if (typeof filePath !== 'string') return null;
  // Basic path traversal prevention
  if (filePath.includes('..') || filePath.includes('~')) {
    console.warn('Potential path traversal detected:', filePath);
    return null;
  }
  return filePath;
}

// SECURITY: Only expose safe, controlled APIs to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Screen capture
  getSources: () => ipcRenderer.invoke('get-sources'),
  
  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  restoreWindow: () => ipcRenderer.invoke('restore-window'),
  hideWindow: () => ipcRenderer.invoke('hide-window'),
  showWindow: () => ipcRenderer.invoke('show-window'),
  
  // File operations (with validation)
  showSaveDialog: (options) => {
    // Sanitize options
    const safeOptions = {
      title: validateString(options?.title || ''),
      defaultPath: validateFilePath(options?.defaultPath || ''),
      filters: Array.isArray(options?.filters) ? options.filters : []
    };
    return ipcRenderer.invoke('show-save-dialog', safeOptions);
  },
  
  writeFile: (filePath, buffer) => {
    const safePath = validateFilePath(filePath);
    if (!safePath) {
      return Promise.reject(new Error('Invalid file path'));
    }
    if (!(buffer instanceof Uint8Array || Buffer.isBuffer(buffer))) {
      return Promise.reject(new Error('Invalid buffer'));
    }
    return ipcRenderer.invoke('write-file', safePath, buffer);
  },
  
  // Menu actions (one-way communication)
  onMenuAction: (callback) => {
    if (typeof callback !== 'function') return;
    ipcRenderer.on('menu-action', (event, action) => {
      // Validate action is a string
      if (typeof action === 'string') {
        callback(action);
      }
    });
  },
  
  // Remove menu action listener
  removeMenuActionListener: () => {
    ipcRenderer.removeAllListeners('menu-action');
  },
  
  // Platform info (read-only)
  isElectron: true,
  platform: process.platform,
  
  // Version info (read-only, prevents tampering)
  getVersion: () => process.versions.electron
});

// SECURITY: Prevent any global pollution
delete window.require;
delete window.exports;
delete window.module;

console.log('Electron preload loaded with security hardening');

