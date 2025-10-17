/**
 * Advanced Keyboard Shortcuts Manager
 * Phase 2: Power Features
 * 
 * Features:
 * - Customizable global hotkeys
 * - Conflict detection
 * - Cheat sheet overlay
 * - Import/Export shortcuts
 * - Multi-key combinations (Ctrl+Shift+Key)
 */

class AdvancedKeyboardShortcuts {
  constructor() {
    this.shortcuts = new Map();
    this.defaultShortcuts = this.getDefaultShortcuts();
    this.loadShortcuts();
    this.enabled = true;
    this.cheatSheetVisible = false;
  }

  getDefaultShortcuts() {
    return {
      // Recording controls
      'toggle-recording': { keys: ['Ctrl+R', 'Meta+R'], description: 'Start/Stop Recording', category: 'Recording' },
      'pause-resume': { keys: ['Space'], description: 'Pause/Resume Recording', category: 'Recording' },
      'cancel': { keys: ['Escape'], description: 'Cancel/Close', category: 'General' },
      
      // Quick actions
      'screenshot': { keys: ['Ctrl+Shift+S', 'Meta+Shift+S'], description: 'Take Screenshot', category: 'Capture' },
      'area-select': { keys: ['Ctrl+Shift+A', 'Meta+Shift+A'], description: 'Select Area', category: 'Capture' },
      'webcam-toggle': { keys: ['Ctrl+Shift+W', 'Meta+Shift+W'], description: 'Toggle Webcam', category: 'Recording' },
      'mic-toggle': { keys: ['Ctrl+Shift+M', 'Meta+Shift+M'], description: 'Toggle Microphone', category: 'Recording' },
      
      // File management
      'download': { keys: ['Ctrl+D', 'Meta+D'], description: 'Download Recording', category: 'Files' },
      'delete': { keys: ['Delete'], description: 'Delete Recording', category: 'Files' },
      'rename': { keys: ['F2'], description: 'Rename Recording', category: 'Files' },
      'select-all': { keys: ['Ctrl+A', 'Meta+A'], description: 'Select All', category: 'Files' },
      
      // Navigation
      'next-recording': { keys: ['ArrowDown', 'J'], description: 'Next Recording', category: 'Navigation' },
      'prev-recording': { keys: ['ArrowUp', 'K'], description: 'Previous Recording', category: 'Navigation' },
      'play-pause': { keys: ['Space'], description: 'Play/Pause Video', category: 'Playback' },
      
      // View controls
      'fullscreen': { keys: ['F11'], description: 'Toggle Fullscreen', category: 'View' },
      'settings': { keys: ['Ctrl+,', 'Meta+,'], description: 'Open Settings', category: 'General' },
      'help': { keys: ['F1', 'Ctrl+/', 'Meta+/'], description: 'Show Help', category: 'General' },
      'shortcuts-cheat-sheet': { keys: ['Ctrl+Shift+/', 'Meta+Shift+/'], description: 'Show Shortcuts', category: 'General' },
      
      // Editor features (Phase 2)
      'trim-video': { keys: ['Ctrl+T', 'Meta+T'], description: 'Trim Video', category: 'Editor' },
      'add-watermark': { keys: ['Ctrl+Shift+K', 'Meta+Shift+K'], description: 'Add Watermark', category: 'Editor' },
      'apply-filter': { keys: ['Ctrl+F', 'Meta+F'], description: 'Apply Filter', category: 'Editor' },
      'undo': { keys: ['Ctrl+Z', 'Meta+Z'], description: 'Undo', category: 'Editor' },
      'redo': { keys: ['Ctrl+Y', 'Meta+Y', 'Ctrl+Shift+Z', 'Meta+Shift+Z'], description: 'Redo', category: 'Editor' },
      
      // Batch operations
      'batch-mode': { keys: ['Ctrl+B', 'Meta+B'], description: 'Toggle Batch Mode', category: 'Batch' },
      'batch-download': { keys: ['Ctrl+Shift+D', 'Meta+Shift+D'], description: 'Batch Download', category: 'Batch' },
      'batch-delete': { keys: ['Ctrl+Shift+Delete', 'Meta+Shift+Delete'], description: 'Batch Delete', category: 'Batch' },
    };
  }

  loadShortcuts() {
    try {
      const saved = localStorage.getItem('nebula-shortcuts');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.shortcuts = new Map(Object.entries(parsed));
      } else {
        this.resetToDefaults();
      }
    } catch (error) {
      console.error('Failed to load shortcuts:', error);
      this.resetToDefaults();
    }
  }

  saveShortcuts() {
    try {
      const obj = Object.fromEntries(this.shortcuts);
      localStorage.setItem('nebula-shortcuts', JSON.stringify(obj));
    } catch (error) {
      console.error('Failed to save shortcuts:', error);
    }
  }

  resetToDefaults() {
    this.shortcuts = new Map(Object.entries(this.defaultShortcuts));
    this.saveShortcuts();
  }

  register(action, keys, description, category = 'Custom') {
    if (!Array.isArray(keys)) keys = [keys];
    
    // Check for conflicts
    const conflicts = this.checkConflicts(keys, action);
    if (conflicts.length > 0) {
      console.warn(`Shortcut conflict detected for ${action}:`, conflicts);
    }
    
    this.shortcuts.set(action, { keys, description, category });
    this.saveShortcuts();
  }

  unregister(action) {
    this.shortcuts.delete(action);
    this.saveShortcuts();
  }

  checkConflicts(keys, excludeAction = null) {
    const conflicts = [];
    
    for (const [action, shortcut] of this.shortcuts.entries()) {
      if (action === excludeAction) continue;
      
      for (const key of keys) {
        if (shortcut.keys.includes(key)) {
          conflicts.push({ action, key });
        }
      }
    }
    
    return conflicts;
  }

  handleKeyEvent(event, callbacks = {}) {
    if (!this.enabled) return false;
    
    // Don't intercept shortcuts when typing in inputs
    if (event.target.matches('input, textarea, select, [contenteditable]')) {
      // Except Escape
      if (event.key !== 'Escape') return false;
    }
    
    const keyCombo = this.getKeyCombo(event);
    
    for (const [action, shortcut] of this.shortcuts.entries()) {
      if (shortcut.keys.includes(keyCombo)) {
        // Check if callback exists for this action
        const callback = callbacks[action];
        if (callback && typeof callback === 'function') {
          event.preventDefault();
          callback(event);
          return true;
        }
      }
    }
    
    return false;
  }

  getKeyCombo(event) {
    const parts = [];
    
    if (event.ctrlKey) parts.push('Ctrl');
    if (event.altKey) parts.push('Alt');
    if (event.shiftKey) parts.push('Shift');
    if (event.metaKey) parts.push('Meta');
    
    // Add the actual key
    let key = event.key;
    
    // Normalize special keys
    const keyMap = {
      ' ': 'Space',
      'Backspace': 'Backspace',
      'Delete': 'Delete',
      'Enter': 'Enter',
      'Tab': 'Tab',
      'Escape': 'Escape',
      'ArrowUp': 'ArrowUp',
      'ArrowDown': 'ArrowDown',
      'ArrowLeft': 'ArrowLeft',
      'ArrowRight': 'ArrowRight',
      'Home': 'Home',
      'End': 'End',
      'PageUp': 'PageUp',
      'PageDown': 'PageDown',
    };
    
    if (keyMap[key]) {
      key = keyMap[key];
    } else if (key.length === 1) {
      key = key.toUpperCase();
    }
    
    // Don't add modifiers to the key part
    if (!['Control', 'Alt', 'Shift', 'Meta'].includes(key)) {
      parts.push(key);
    }
    
    return parts.join('+');
  }

  getShortcutByAction(action) {
    return this.shortcuts.get(action);
  }

  getAllShortcuts() {
    return Array.from(this.shortcuts.entries()).map(([action, data]) => ({
      action,
      ...data
    }));
  }

  getShortcutsByCategory(category) {
    return this.getAllShortcuts().filter(s => s.category === category);
  }

  getCategories() {
    const categories = new Set();
    for (const shortcut of this.shortcuts.values()) {
      categories.add(shortcut.category);
    }
    return Array.from(categories).sort();
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  exportShortcuts() {
    const data = {
      version: '1.0',
      shortcuts: Object.fromEntries(this.shortcuts),
      exportedAt: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  }

  importShortcuts(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (!data.shortcuts) throw new Error('Invalid format');
      
      this.shortcuts = new Map(Object.entries(data.shortcuts));
      this.saveShortcuts();
      return true;
    } catch (error) {
      console.error('Failed to import shortcuts:', error);
      return false;
    }
  }

  generateCheatSheet() {
    const categories = this.getCategories();
    const cheatSheet = {};
    
    for (const category of categories) {
      cheatSheet[category] = this.getShortcutsByCategory(category);
    }
    
    return cheatSheet;
  }
}

// Singleton instance
const advancedKeyboardShortcuts = new AdvancedKeyboardShortcuts();

export default advancedKeyboardShortcuts;
export { AdvancedKeyboardShortcuts };
