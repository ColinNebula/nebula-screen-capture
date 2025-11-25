<script>
  import { onMount, onDestroy } from 'svelte';
  import { recordedVideos, screenshots } from '../stores/recording.js';
  import { get } from 'svelte/store';

  export let onClose = () => {};
  export let onExecuteCommand = () => {};
  
  let searchQuery = '';
  let selectedIndex = 0;
  let activeCategory = 'all';
  let showBatchOperations = false;
  let selectedFiles = new Set();
  let inputElement;

  // Command categories
  const categories = [
    { id: 'all', label: 'All Commands', icon: '⚡' },
    { id: 'recording', label: 'Recording', icon: '🎬' },
    { id: 'files', label: 'Files', icon: '📁' },
    { id: 'editor', label: 'Editor', icon: '✂️' },
    { id: 'batch', label: 'Batch Ops', icon: '📦' },
    { id: 'navigation', label: 'Navigation', icon: '🧭' },
  ];

  // Define all available commands
  const commands = [
    // Recording Commands
    { id: 'start-recording', label: 'Start Recording', category: 'recording', icon: '🔴', shortcut: 'Ctrl+R', action: 'start-recording' },
    { id: 'pause-recording', label: 'Pause Recording', category: 'recording', icon: '⏸️', shortcut: 'Space', action: 'pause-recording' },
    { id: 'stop-recording', label: 'Stop Recording', category: 'recording', icon: '⏹️', shortcut: 'Ctrl+S', action: 'stop-recording' },
    { id: 'take-screenshot', label: 'Take Screenshot', category: 'recording', icon: '📸', shortcut: 'Ctrl+Shift+S', action: 'take-screenshot' },
    { id: 'toggle-webcam', label: 'Toggle Webcam', category: 'recording', icon: '📷', shortcut: 'Ctrl+W', action: 'toggle-webcam' },
    { id: 'toggle-microphone', label: 'Toggle Microphone', category: 'recording', icon: '🎤', shortcut: 'Ctrl+M', action: 'toggle-microphone' },
    
    // File Management
    { id: 'open-file-manager', label: 'Open File Manager', category: 'files', icon: '📂', shortcut: 'Ctrl+O', action: 'open-file-manager' },
    { id: 'search-files', label: 'Search Files', category: 'files', icon: '🔍', shortcut: 'Ctrl+F', action: 'search-files' },
    { id: 'sort-by-date', label: 'Sort by Date', category: 'files', icon: '📅', action: 'sort-by-date' },
    { id: 'sort-by-size', label: 'Sort by Size', category: 'files', icon: '📊', action: 'sort-by-size' },
    { id: 'sort-by-name', label: 'Sort by Name', category: 'files', icon: '🔤', action: 'sort-by-name' },
    { id: 'refresh-files', label: 'Refresh File List', category: 'files', icon: '🔄', shortcut: 'F5', action: 'refresh-files' },
    
    // Editor Commands
    { id: 'open-editor', label: 'Open Video Editor', category: 'editor', icon: '✂️', shortcut: 'Ctrl+E', action: 'open-editor' },
    { id: 'trim-video', label: 'Trim Video', category: 'editor', icon: '✂️', shortcut: 'Ctrl+T', action: 'trim-video' },
    { id: 'apply-filter', label: 'Apply Filter', category: 'editor', icon: '🎨', shortcut: 'Ctrl+Shift+F', action: 'apply-filter' },
    { id: 'add-text', label: 'Add Text Overlay', category: 'editor', icon: '📝', shortcut: 'Ctrl+Shift+T', action: 'add-text' },
    { id: 'export-video', label: 'Export Video', category: 'editor', icon: '💾', shortcut: 'Ctrl+Shift+E', action: 'export-video' },
    
    // Batch Operations
    { id: 'batch-mode', label: 'Toggle Batch Mode', category: 'batch', icon: '☑️', shortcut: 'Ctrl+B', action: 'batch-mode' },
    { id: 'select-all', label: 'Select All Files', category: 'batch', icon: '✅', shortcut: 'Ctrl+A', action: 'select-all' },
    { id: 'deselect-all', label: 'Deselect All', category: 'batch', icon: '❌', action: 'deselect-all' },
    { id: 'batch-download', label: 'Batch Download', category: 'batch', icon: '⬇️', shortcut: 'Ctrl+Shift+D', action: 'batch-download' },
    { id: 'batch-delete', label: 'Batch Delete', category: 'batch', icon: '🗑️', shortcut: 'Ctrl+Shift+Delete', action: 'batch-delete' },
    { id: 'batch-rename', label: 'Batch Rename', category: 'batch', icon: '✏️', action: 'batch-rename' },
    { id: 'batch-export', label: 'Batch Export', category: 'batch', icon: '📤', action: 'batch-export' },
    
    // Navigation
    { id: 'go-to-recordings', label: 'Go to Recordings', category: 'navigation', icon: '🎥', action: 'go-to-recordings' },
    { id: 'go-to-screenshots', label: 'Go to Screenshots', category: 'navigation', icon: '📸', action: 'go-to-screenshots' },
    { id: 'open-settings', label: 'Open Settings', category: 'navigation', icon: '⚙️', shortcut: 'Ctrl+,', action: 'open-settings' },
    { id: 'open-help', label: 'Open Help', category: 'navigation', icon: '❓', shortcut: 'F1', action: 'open-help' },
    { id: 'toggle-theme', label: 'Toggle Dark/Light Theme', category: 'navigation', icon: '🌓', shortcut: 'Ctrl+Shift+L', action: 'toggle-theme' },
  ];

  // Filter commands based on search and category
  $: filteredCommands = commands.filter(cmd => {
    const matchesSearch = cmd.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (cmd.shortcut && cmd.shortcut.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = activeCategory === 'all' || cmd.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // Get project files (recordings + screenshots)
  $: projectFiles = [
    ...get(recordedVideos).map(v => ({ ...v, type: 'video', icon: '🎥' })),
    ...get(screenshots).map(s => ({ ...s, type: 'screenshot', icon: '📸' }))
  ];

  $: filteredFiles = projectFiles.filter(file => 
    file.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.id?.toString().includes(searchQuery)
  );

  // Show files if search is active and there are matching files
  $: showFiles = searchQuery.length > 0 && filteredFiles.length > 0;
  $: combinedResults = showFiles ? [...filteredCommands, ...filteredFiles] : filteredCommands;

  // Update selected index when filtered commands change
  $: if (selectedIndex >= combinedResults.length) {
    selectedIndex = Math.max(0, combinedResults.length - 1);
  }

  function executeCommand(command) {
    console.log('Executing command:', command);
    
    if (command.type === 'video' || command.type === 'screenshot') {
      // Handle file selection
      onExecuteCommand({ type: 'open-file', file: command });
    } else {
      onExecuteCommand({ type: 'command', action: command.action, command });
    }
    
    onClose();
  }

  function handleKeydown(e) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        selectedIndex = (selectedIndex + 1) % combinedResults.length;
        scrollToSelected();
        break;
      case 'ArrowUp':
        e.preventDefault();
        selectedIndex = selectedIndex === 0 ? combinedResults.length - 1 : selectedIndex - 1;
        scrollToSelected();
        break;
      case 'Enter':
        e.preventDefault();
        if (combinedResults[selectedIndex]) {
          executeCommand(combinedResults[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
      case 'Tab':
        e.preventDefault();
        // Cycle through categories
        const currentCategoryIndex = categories.findIndex(c => c.id === activeCategory);
        const nextCategoryIndex = (currentCategoryIndex + 1) % categories.length;
        activeCategory = categories[nextCategoryIndex].id;
        selectedIndex = 0;
        break;
    }
  }

  function scrollToSelected() {
    setTimeout(() => {
      const selectedElement = document.querySelector('.command-item.selected');
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }, 0);
  }

  function handleBatchSelect(file) {
    if (selectedFiles.has(file.id)) {
      selectedFiles.delete(file.id);
    } else {
      selectedFiles.add(file.id);
    }
    selectedFiles = selectedFiles; // Trigger reactivity
  }

  function selectAllFiles() {
    selectedFiles = new Set(projectFiles.map(f => f.id));
  }

  function deselectAllFiles() {
    selectedFiles = new Set();
  }

  function executeBatchOperation(operation) {
    const files = projectFiles.filter(f => selectedFiles.has(f.id));
    onExecuteCommand({ 
      type: 'batch-operation', 
      operation, 
      files 
    });
    onClose();
  }

  onMount(() => {
    inputElement?.focus();
  });
</script>

<div class="command-palette-overlay" on:click={onClose}>
  <div class="command-palette" on:click|stopPropagation on:keydown={handleKeydown}>
    <!-- Search Input -->
    <div class="search-section">
      <div class="search-icon">⚡</div>
      <input
        bind:this={inputElement}
        bind:value={searchQuery}
        type="text"
        placeholder="Type a command or search files... (Tab to switch categories)"
        class="search-input"
        autocomplete="off"
        spellcheck="false"
      />
      {#if searchQuery}
        <button class="clear-btn" on:click={() => searchQuery = ''}>✕</button>
      {/if}
    </div>

    <!-- Category Tabs -->
    <div class="category-tabs">
      {#each categories as category}
        <button
          class="category-tab"
          class:active={activeCategory === category.id}
          on:click={() => { activeCategory = category.id; selectedIndex = 0; }}
        >
          <span class="category-icon">{category.icon}</span>
          <span class="category-label">{category.label}</span>
        </button>
      {/each}
    </div>

    <!-- Results Section -->
    <div class="results-section">
      {#if combinedResults.length === 0}
        <div class="no-results">
          <div class="no-results-icon">🔍</div>
          <p>No commands or files found</p>
          <small>Try a different search term or category</small>
        </div>
      {:else}
        <div class="results-list">
          {#each combinedResults as item, index}
            <button
              class="command-item"
              class:selected={index === selectedIndex}
              class:file-item={item.type === 'video' || item.type === 'screenshot'}
              on:click={() => executeCommand(item)}
              on:mouseenter={() => selectedIndex = index}
            >
              <div class="command-icon">{item.icon}</div>
              <div class="command-details">
                <div class="command-label">{item.label || item.name}</div>
                {#if item.category && !item.type}
                  <div class="command-category">{item.category}</div>
                {/if}
                {#if item.type === 'video'}
                  <div class="file-meta">
                    Video • {item.duration ? Math.round(item.duration) + 's' : 'N/A'}
                  </div>
                {/if}
                {#if item.type === 'screenshot'}
                  <div class="file-meta">Screenshot • {item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'N/A'}</div>
                {/if}
              </div>
              {#if item.shortcut}
                <div class="command-shortcut">
                  <kbd>{item.shortcut}</kbd>
                </div>
              {/if}
              {#if showBatchOperations && (item.type === 'video' || item.type === 'screenshot')}
                <div class="batch-checkbox" on:click|stopPropagation={() => handleBatchSelect(item)}>
                  <input type="checkbox" checked={selectedFiles.has(item.id)} />
                </div>
              {/if}
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Batch Operations Bar -->
    {#if selectedFiles.size > 0}
      <div class="batch-operations-bar">
        <div class="batch-info">
          <span class="batch-count">{selectedFiles.size} selected</span>
          <button class="batch-action-btn small" on:click={deselectAllFiles}>Clear</button>
        </div>
        <div class="batch-actions">
          <button class="batch-action-btn" on:click={() => executeBatchOperation('download')}>
            <span>⬇️</span> Download
          </button>
          <button class="batch-action-btn" on:click={() => executeBatchOperation('delete')}>
            <span>🗑️</span> Delete
          </button>
          <button class="batch-action-btn" on:click={() => executeBatchOperation('export')}>
            <span>📤</span> Export
          </button>
        </div>
      </div>
    {/if}

    <!-- Footer Hints -->
    <div class="palette-footer">
      <div class="footer-hints">
        <span class="hint"><kbd>↑↓</kbd> Navigate</span>
        <span class="hint"><kbd>Enter</kbd> Execute</span>
        <span class="hint"><kbd>Tab</kbd> Switch Category</span>
        <span class="hint"><kbd>Esc</kbd> Close</span>
      </div>
      <div class="footer-stats">
        {filteredCommands.length} commands • {projectFiles.length} files
      </div>
    </div>
  </div>
</div>

<style>
  .command-palette-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 15vh;
    z-index: 10000;
    animation: fadeIn 0.15s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .command-palette {
    background: linear-gradient(135deg, rgba(30, 30, 50, 0.98), rgba(20, 20, 40, 0.98));
    border: 1px solid rgba(102, 126, 234, 0.3);
    border-radius: 20px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 100px rgba(102, 126, 234, 0.2);
    width: 90%;
    max-width: 750px;
    max-height: 70vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: slideDown 0.2s ease-out;
  }

  @keyframes slideDown {
    from {
      transform: translateY(-20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .search-section {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .search-icon {
    font-size: 24px;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.8;
      transform: scale(1.1);
    }
  }

  .search-input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    color: #fff;
    font-size: 18px;
    font-weight: 500;
  }

  .search-input::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }

  .clear-btn {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.6);
    cursor: pointer;
    transition: all 0.2s;
  }

  .clear-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
  }

  .category-tabs {
    display: flex;
    gap: 8px;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    overflow-x: auto;
    overflow-y: visible;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: thin;
    scrollbar-color: rgba(102, 126, 234, 0.5) transparent;
    align-items: center;
  }

  .category-tabs::-webkit-scrollbar {
    height: 4px;
  }

  .category-tabs::-webkit-scrollbar-track {
    background: transparent;
  }

  .category-tabs::-webkit-scrollbar-thumb {
    background: rgba(102, 126, 234, 0.5);
    border-radius: 2px;
  }

  .category-tab {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 16px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid transparent;
    border-radius: 20px;
    color: rgba(255, 255, 255, 0.6);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
    flex-shrink: 0;
    min-width: fit-content;
    line-height: 1.4;
    height: auto;
  }

  .category-tab .category-label {
    display: inline-block;
    line-height: 1.4;
    padding: 1px 0;
  }

  .category-tab:hover {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.9);
  }

  .category-tab.active {
    background: linear-gradient(135deg, #667eea, #764ba2);
    border-color: rgba(102, 126, 234, 0.5);
    color: #fff;
  }

  .category-icon {
    font-size: 16px;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .results-section {
    flex: 1;
    overflow-y: auto;
    min-height: 200px;
  }

  .results-list {
    padding: 8px;
  }

  .command-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 10px;
    color: #fff;
    cursor: pointer;
    transition: all 0.15s;
    width: 100%;
    text-align: left;
    margin-bottom: 4px;
    min-height: 56px;
  }

  .command-item:hover {
    background: rgba(102, 126, 234, 0.1);
    border-color: rgba(102, 126, 234, 0.3);
  }

  .command-item.selected {
    background: rgba(102, 126, 234, 0.2);
    border-color: rgba(102, 126, 234, 0.5);
    box-shadow: 0 0 20px rgba(102, 126, 234, 0.3);
  }

  .command-item.file-item {
    background: rgba(16, 185, 129, 0.05);
  }

  .command-item.file-item:hover {
    background: rgba(16, 185, 129, 0.15);
  }

  .command-icon {
    font-size: 24px;
    width: 32px;
    text-align: center;
    flex-shrink: 0;
  }

  .command-details {
    flex: 1;
    min-width: 0;
  }

  .command-label {
    font-size: 15px;
    font-weight: 600;
    color: #fff;
    margin-bottom: 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .command-category {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .file-meta {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);
  }

  .command-shortcut {
    margin-left: auto;
    flex-shrink: 0;
  }

  .command-shortcut kbd {
    display: inline-block;
    padding: 4px 8px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.8);
    font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
    white-space: nowrap;
  }

  .batch-checkbox {
    margin-left: auto;
  }

  .batch-checkbox input {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }

  .no-results {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    color: rgba(255, 255, 255, 0.5);
  }

  .no-results-icon {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.3;
  }

  .no-results p {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 8px;
  }

  .no-results small {
    font-size: 13px;
    opacity: 0.7;
  }

  .batch-operations-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px;
    background: rgba(102, 126, 234, 0.15);
    border-top: 1px solid rgba(102, 126, 234, 0.3);
    flex-wrap: wrap;
    gap: 12px;
  }

  .batch-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .batch-count {
    font-weight: 600;
    color: #fff;
  }

  .batch-actions {
    display: flex;
    gap: 8px;
  }

  .batch-action-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .batch-action-btn span {
    font-size: 16px;
    line-height: 1;
  }

  .batch-action-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
  }

  .batch-action-btn.small {
    padding: 6px 12px;
    font-size: 12px;
  }

  .palette-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(0, 0, 0, 0.2);
    flex-wrap: wrap;
    gap: 12px;
  }

  .footer-hints {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    align-items: center;
    min-width: 0;
  }

  .hint {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .hint kbd {
    display: inline-block;
    padding: 2px 6px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 3px;
    font-size: 10px;
    font-weight: 600;
    margin-right: 4px;
    font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
  }

  .footer-stats {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
    white-space: nowrap;
    flex-shrink: 0;
  }

  /* Scrollbar Styling */
  .results-section::-webkit-scrollbar {
    width: 8px;
  }

  .results-section::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
  }

  .results-section::-webkit-scrollbar-thumb {
    background: rgba(102, 126, 234, 0.5);
    border-radius: 4px;
  }

  .results-section::-webkit-scrollbar-thumb:hover {
    background: rgba(102, 126, 234, 0.7);
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .command-palette {
      width: 95%;
      max-width: 100%;
      max-height: 85vh;
      border-radius: 16px;
    }

    .search-section {
      padding: 16px;
    }

    .search-input {
      font-size: 16px;
    }

    .category-tabs {
      padding: 14px 16px;
      gap: 6px;
    }

    .category-tab {
      padding: 8px 12px;
      font-size: 12px;
      line-height: 1.4;
    }

    .category-label {
      display: inline-block !important;
    }

    .category-icon {
      font-size: 14px;
    }

    .footer-hints {
      width: 100%;
      justify-content: center;
    }

    .footer-stats {
      width: 100%;
      text-align: center;
    }

    .batch-action-btn {
      padding: 6px 12px;
      font-size: 12px;
      gap: 4px;
    }

    .batch-action-btn span {
      font-size: 14px;
    }

    .batch-operations-bar {
      padding: 10px 16px;
    }

    .batch-actions {
      flex-wrap: wrap;
    }

    .command-item {
      padding: 10px 12px;
      gap: 8px;
      min-height: 52px;
    }

    .command-icon {
      font-size: 20px;
      width: 28px;
    }

    .command-label {
      font-size: 14px;
    }

    .command-shortcut {
      display: none;
    }

    .command-category,
    .file-meta {
      font-size: 11px;
    }
  }

  @media (max-width: 480px) {
    .category-label {
      display: none !important;
    }

    .category-tab {
      padding: 6px 10px;
    }

    .batch-action-btn:not(.small) span:first-child {
      margin-right: 0;
    }

    .batch-action-btn:not(.small) {
      min-width: 36px;
      padding: 6px 8px;
    }
  }
</style>
