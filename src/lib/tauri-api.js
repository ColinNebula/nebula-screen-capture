/**
 * Tauri API Wrapper
 * Replaces Electron API with Tauri equivalents
 */

// Check if running in Tauri environment
const isTauri = typeof window !== 'undefined' && window.__TAURI__ !== undefined;

// Lazy import Tauri APIs only when needed
let tauriWindow;
let tauriDialog;
let tauriFs;

async function getTauriAPIs() {
  if (!isTauri) return null;
  
  try {
    if (!tauriWindow) {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      tauriWindow = getCurrentWindow();
    }
    
    if (!tauriDialog) {
      const dialog = await import('@tauri-apps/plugin-dialog');
      tauriDialog = dialog;
    }
    
    if (!tauriFs) {
      const fs = await import('@tauri-apps/plugin-fs');
      tauriFs = fs;
    }
    
    return { tauriWindow, tauriDialog, tauriFs };
  } catch (error) {
    console.warn('Failed to load Tauri APIs:', error);
    return null;
  }
}

export const tauriAPI = {
  // Platform detection
  isTauri,
  isElectron: false, // For compatibility
  
  // Window controls
  async minimizeWindow() {
    if (!isTauri) return;
    const { tauriWindow } = await getTauriAPIs();
    await tauriWindow.minimize();
  },
  
  async restoreWindow() {
    if (!isTauri) return;
    const { tauriWindow } = await getTauriAPIs();
    await tauriWindow.unminimize();
  },
  
  async hideWindow() {
    if (!isTauri) return;
    const { tauriWindow } = await getTauriAPIs();
    await tauriWindow.hide();
  },
  
  async showWindow() {
    if (!isTauri) return;
    const { tauriWindow } = await getTauriAPIs();
    await tauriWindow.show();
  },
  
  // File operations
  async showSaveDialog(options = {}) {
    if (!isTauri) {
      return null;
    }
    
    try {
      const apis = await getTauriAPIs();
      if (!apis || !apis.tauriDialog) return null;
      
      const filePath = await apis.tauriDialog.save({
        defaultPath: options.defaultPath,
        filters: options.filters || []
      });
      
      return filePath;
    } catch (error) {
      console.error('Save dialog error:', error);
      return null;
    }
  },
  
  async openFileDialog(options = {}) {
    if (!isTauri) {
      return null;
    }
    
    try {
      const apis = await getTauriAPIs();
      if (!apis || !apis.tauriDialog) return null;
      
      const selected = await apis.tauriDialog.open({
        multiple: false,
        filters: options.filters || []
      });
      
      return selected;
    } catch (error) {
      console.error('Open file dialog error:', error);
      return null;
    }
  },
  
  async readFile(filePath) {
    if (!isTauri) {
      throw new Error('File reading not supported in browser');
    }
    
    try {
      const apis = await getTauriAPIs();
      if (!apis || !apis.tauriFs) {
        throw new Error('File system API not available');
      }
      
      const contents = await apis.tauriFs.readTextFile(filePath);
      return contents;
    } catch (error) {
      console.error('Read file error:', error);
      throw error;
    }
  },
  
  async writeFile(filePath, content) {
    if (!isTauri) {
      // Fallback to browser download
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filePath.split(/[\\/]/).pop() || 'download';
      a.click();
      URL.revokeObjectURL(url);
      return { success: true };
    }
    
    try {
      const apis = await getTauriAPIs();
      if (!apis || !apis.tauriFs) {
        throw new Error('File system API not available');
      }
      
      await apis.tauriFs.writeTextFile(filePath, content);
      return { success: true };
    } catch (error) {
      console.error('Write file error:', error);
      throw error;
    }
  },
  
  // Screen capture
  async getSources() {
    try {
      return [{
        id: 'screen:0:0',
        name: 'Entire Screen',
        thumbnail: null,
        useDisplayMedia: true
      }];
    } catch (error) {
      console.error('Screen capture error:', error);
      return [];
    }
  },
  
  // Menu actions (compatibility placeholder)
  onMenuAction(callback) {
    if (typeof callback !== 'function') return;
    console.log('Menu action listener registered');
  },
  
  removeMenuActionListener() {
    console.log('Menu action listener removed');
  },
  
  // Version info
  async getVersion() {
    if (!isTauri) return 'web';
    return '0.1.0';
  }
};

// Export as window API for compatibility with existing code
if (typeof window !== 'undefined') {
  window.tauriAPI = tauriAPI;
  
  // Also expose as electronAPI for compatibility
  if (!window.electronAPI) {
    window.electronAPI = tauriAPI;
  }
}

export default tauriAPI;
