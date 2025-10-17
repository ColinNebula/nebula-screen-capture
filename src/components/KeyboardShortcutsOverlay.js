import React, { useState, useEffect } from 'react';
import advancedKeyboardShortcuts from '../utils/advancedKeyboardShortcuts';
import './KeyboardShortcutsOverlay.css';

const KeyboardShortcutsOverlay = ({ isOpen, onClose }) => {
  const [shortcuts, setShortcuts] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    if (isOpen) {
      const cheatSheet = advancedKeyboardShortcuts.generateCheatSheet();
      setShortcuts(cheatSheet);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const categories = ['All', ...Object.keys(shortcuts)];

  const filteredShortcuts = () => {
    let result = shortcuts;

    if (selectedCategory !== 'All') {
      result = { [selectedCategory]: shortcuts[selectedCategory] };
    }

    if (searchTerm) {
      const filtered = {};
      for (const [category, items] of Object.entries(result)) {
        const matchingItems = items.filter(item =>
          item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.keys.some(k => k.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        if (matchingItems.length > 0) {
          filtered[category] = matchingItems;
        }
      }
      result = filtered;
    }

    return result;
  };

  const formatKey = (key) => {
    return key.replace(/\+/g, ' + ');
  };

  const handleExport = () => {
    const data = advancedKeyboardShortcuts.exportShortcuts();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nebula-shortcuts.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const success = advancedKeyboardShortcuts.importShortcuts(e.target.result);
      if (success) {
        const cheatSheet = advancedKeyboardShortcuts.generateCheatSheet();
        setShortcuts(cheatSheet);
        alert('Shortcuts imported successfully!');
      } else {
        alert('Failed to import shortcuts. Invalid format.');
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (window.confirm('Reset all shortcuts to defaults?')) {
      advancedKeyboardShortcuts.resetToDefaults();
      const cheatSheet = advancedKeyboardShortcuts.generateCheatSheet();
      setShortcuts(cheatSheet);
    }
  };

  return (
    <div className="keyboard-shortcuts-overlay" onClick={onClose}>
      <div className="shortcuts-panel" onClick={(e) => e.stopPropagation()}>
        <div className="shortcuts-header">
          <h2>
            <span className="shortcuts-icon">⌨️</span>
            Keyboard Shortcuts
          </h2>
          <button className="close-btn" onClick={onClose} title="Close (Esc)">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        <div className="shortcuts-toolbar">
          <input
            type="text"
            placeholder="Search shortcuts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="shortcuts-search"
          />

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-filter"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="shortcuts-content">
          {Object.entries(filteredShortcuts()).map(([category, items]) => (
            <div key={category} className="shortcuts-category">
              <h3 className="category-title">{category}</h3>
              <div className="shortcuts-list">
                {items.map((item, idx) => (
                  <div key={idx} className="shortcut-item">
                    <div className="shortcut-keys">
                      {item.keys.map((key, keyIdx) => (
                        <React.Fragment key={keyIdx}>
                          {keyIdx > 0 && <span className="or-separator">or</span>}
                          <kbd className="key-combo">{formatKey(key)}</kbd>
                        </React.Fragment>
                      ))}
                    </div>
                    <div className="shortcut-description">{item.description}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="shortcuts-footer">
          <div className="footer-actions">
            <button className="footer-btn" onClick={handleExport} title="Export shortcuts">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2z"/>
              </svg>
              Export
            </button>
            <label className="footer-btn" title="Import shortcuts">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/>
              </svg>
              Import
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                style={{ display: 'none' }}
              />
            </label>
            <button className="footer-btn" onClick={handleReset} title="Reset to defaults">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
              </svg>
              Reset
            </button>
          </div>
          <div className="footer-hint">
            Press <kbd>Ctrl + Shift + /</kbd> to toggle this panel
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsOverlay;
