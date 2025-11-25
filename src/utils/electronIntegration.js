// Electron Integration Utilities
// Provides helpers to detect Electron environment and use Electron APIs

/**
 * Check if running in Electron
 * @returns {boolean}
 */
export function isElectron() {
  return typeof window !== 'undefined' && window.electron?.isElectron === true;
}

/**
 * Get available screen sources for capture (Electron only)
 * @param {Object} options - desktopCapturer options
 * @returns {Promise<Array>} Array of sources
 */
export async function getElectronSources(options = {}) {
  if (!isElectron()) {
    console.warn('Not running in Electron. Using browser API instead.');
    return [];
  }

  try {
    const sources = await window.electron.getSources({
      types: options.types || ['window', 'screen'],
      thumbnailSize: options.thumbnailSize || { width: 300, height: 200 },
      fetchWindowIcons: options.fetchWindowIcons !== false
    });
    
    return sources.map(source => ({
      id: source.id,
      name: source.name,
      thumbnail: source.thumbnail?.toDataURL?.() || null,
      display_id: source.display_id,
      appIcon: source.appIcon?.toDataURL?.() || null
    }));
  } catch (error) {
    console.error('Error getting Electron sources:', error);
    return [];
  }
}

/**
 * Get screen capture stream using Electron or browser API
 * @param {string|null} sourceId - Electron source ID (optional)
 * @param {Object} constraints - MediaStream constraints
 * @returns {Promise<MediaStream>}
 */
export async function getCaptureStream(sourceId = null, constraints = {}) {
  if (isElectron() && sourceId) {
    // Use Electron's desktopCapturer
    const videoConstraints = {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: sourceId,
        minWidth: constraints.video?.width?.min || 1280,
        maxWidth: constraints.video?.width?.max || 1920,
        minHeight: constraints.video?.height?.min || 720,
        maxHeight: constraints.video?.height?.max || 1080,
        minFrameRate: constraints.video?.frameRate?.min || 30,
        maxFrameRate: constraints.video?.frameRate?.max || 60
      }
    };

    return await navigator.mediaDevices.getUserMedia({
      audio: constraints.audio !== false ? {
        mandatory: {
          chromeMediaSource: 'desktop'
        }
      } : false,
      video: videoConstraints
    });
  } else {
    // Use browser's getDisplayMedia
    return await navigator.mediaDevices.getDisplayMedia({
      video: {
        width: { ideal: 1920, max: 3840 },
        height: { ideal: 1080, max: 2160 },
        frameRate: { ideal: 30, max: 60 },
        ...constraints.video
      },
      audio: constraints.audio !== false,
      ...constraints
    });
  }
}

/**
 * Window management utilities
 */
export const windowManager = {
  minimize: async () => {
    if (isElectron()) {
      await window.electron.minimizeWindow();
    } else {
      console.warn('Window minimize only available in Electron');
    }
  },

  restore: async () => {
    if (isElectron()) {
      await window.electron.restoreWindow();
    } else {
      console.warn('Window restore only available in Electron');
    }
  },

  hide: async () => {
    if (isElectron()) {
      await window.electron.hideWindow();
    } else {
      console.warn('Window hide only available in Electron');
    }
  },

  show: async () => {
    if (isElectron()) {
      await window.electron.showWindow();
    } else {
      console.warn('Window show only available in Electron');
    }
  }
};

/**
 * Get app information
 */
export const appInfo = {
  getVersion: async () => {
    if (isElectron()) {
      return await window.electron.getAppVersion();
    }
    return '0.1.0'; // Web version
  },

  getPath: async (name = 'userData') => {
    if (isElectron()) {
      return await window.electron.getAppPath(name);
    }
    return null;
  },

  getPlatform: () => {
    if (isElectron()) {
      return window.electron.platform;
    }
    return navigator.platform;
  },

  quit: async () => {
    if (isElectron()) {
      await window.electron.quitApp();
    } else {
      window.close();
    }
  }
};

/**
 * Enhanced screen recording for Electron
 * Shows a source selector before recording
 */
export async function selectAndCaptureScreen() {
  if (!isElectron()) {
    // Fallback to browser API
    return await getCaptureStream();
  }

  try {
    // Get available sources
    const sources = await getElectronSources({
      types: ['window', 'screen']
    });

    if (sources.length === 0) {
      throw new Error('No capture sources available');
    }

    // For now, auto-select the first screen
    // You can enhance this with a UI selector
    const screenSource = sources.find(s => s.name.includes('Screen') || s.name.includes('screen')) || sources[0];
    
    // Get the stream
    return await getCaptureStream(screenSource.id);
  } catch (error) {
    console.error('Error selecting screen:', error);
    throw error;
  }
}

export default {
  isElectron,
  getElectronSources,
  getCaptureStream,
  windowManager,
  appInfo,
  selectAndCaptureScreen
};
