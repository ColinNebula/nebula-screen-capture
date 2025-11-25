<script>
  import { onMount } from 'svelte';
  import { user } from '../stores/user.js';
  
  export let onClose = () => {};
  export let onApplyWatermark = () => {};
  
  let activeTab = 'text';
  let textWatermark = {
    text: '',
    position: 'bottom-right',
    fontSize: 24,
    color: '#FFFFFF',
    opacity: 70,
    fontFamily: 'Arial',
    fontWeight: 'bold',
    shadow: true,
    rotation: 0
  };
  
  let imageWatermark = {
    file: null,
    url: null,
    position: 'bottom-right',
    size: 100,
    opacity: 70,
    rotation: 0
  };
  
  let logoPresets = [
    { name: 'Company Logo', url: '/assets/logo-preset-1.png' },
    { name: 'Brand Mark', url: '/assets/logo-preset-2.png' },
    { name: 'Signature', url: '/assets/logo-preset-3.png' }
  ];
  
  let templates = [
    { id: 'copyright', name: 'Copyright', text: '© 2025 Your Name' },
    { id: 'confidential', name: 'Confidential', text: 'CONFIDENTIAL - DO NOT DISTRIBUTE' },
    { id: 'draft', name: 'Draft', text: 'DRAFT - FOR REVIEW ONLY' },
    { id: 'branded', name: 'Branded', text: 'YourBrand.com' }
  ];
  
  let previewMode = true;
  let savedWatermarks = [];
  
  const positions = [
    { value: 'top-left', label: 'Top Left', icon: '↖' },
    { value: 'top-center', label: 'Top Center', icon: '↑' },
    { value: 'top-right', label: 'Top Right', icon: '↗' },
    { value: 'middle-left', label: 'Middle Left', icon: '←' },
    { value: 'center', label: 'Center', icon: '•' },
    { value: 'middle-right', label: 'Middle Right', icon: '→' },
    { value: 'bottom-left', label: 'Bottom Left', icon: '↙' },
    { value: 'bottom-center', label: 'Bottom Center', icon: '↓' },
    { value: 'bottom-right', label: 'Bottom Right', icon: '↘' }
  ];
  
  const fontFamilies = ['Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana', 'Impact'];
  
  function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      imageWatermark.file = file;
      imageWatermark.url = URL.createObjectURL(file);
    }
  }
  
  function selectPreset(preset) {
    imageWatermark.url = preset.url;
    imageWatermark.file = null;
  }
  
  function applyTemplate(template) {
    textWatermark.text = template.text;
  }
  
  function saveWatermark() {
    const watermark = activeTab === 'text' 
      ? { type: 'text', ...textWatermark, id: Date.now() }
      : { type: 'image', ...imageWatermark, id: Date.now() };
    
    savedWatermarks = [...savedWatermarks, watermark];
    localStorage.setItem('watermarks', JSON.stringify(savedWatermarks));
    
    // Show success notification
    alert('Watermark saved successfully!');
  }
  
  function loadWatermark(watermark) {
    if (watermark.type === 'text') {
      activeTab = 'text';
      textWatermark = { ...watermark };
    } else {
      activeTab = 'image';
      imageWatermark = { ...watermark };
    }
  }
  
  function deleteWatermark(id) {
    savedWatermarks = savedWatermarks.filter(w => w.id !== id);
    localStorage.setItem('watermarks', JSON.stringify(savedWatermarks));
  }
  
  function applyWatermark() {
    const watermark = activeTab === 'text' ? textWatermark : imageWatermark;
    onApplyWatermark({ type: activeTab, settings: watermark });
    onClose();
  }
  
  onMount(() => {
    const saved = localStorage.getItem('watermarks');
    if (saved) {
      savedWatermarks = JSON.parse(saved);
    }
    
    // Set default text if user is logged in
    if ($user) {
      textWatermark.text = `© 2025 ${$user.displayName || $user.email}`;
    }
  });
</script>

<div class="watermark-overlay" on:click={onClose}>
  <div class="watermark-modal" on:click|stopPropagation>
    <div class="modal-header">
      <div class="header-title">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V9h7V3.66L19 7.5v4.5h-7v.99z"/>
        </svg>
        <h2>Watermark Manager</h2>
      </div>
      <button class="close-btn" on:click={onClose}>
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
    </div>

    <div class="modal-content">
      <div class="watermark-container">
        <!-- Left Panel: Settings -->
        <div class="settings-panel">
          <!-- Tabs -->
          <div class="watermark-tabs">
            <button 
              class="tab-btn"
              class:active={activeTab === 'text'}
              on:click={() => activeTab = 'text'}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M5 4v3h5.5v12h3V7H19V4z"/>
              </svg>
              Text Watermark
            </button>
            <button 
              class="tab-btn"
              class:active={activeTab === 'image'}
              on:click={() => activeTab = 'image'}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
              </svg>
              Image/Logo
            </button>
            <button 
              class="tab-btn"
              class:active={activeTab === 'saved'}
              on:click={() => activeTab = 'saved'}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
              </svg>
              Saved ({savedWatermarks.length})
            </button>
          </div>

          <!-- Text Watermark Settings -->
          {#if activeTab === 'text'}
            <div class="tab-content">
              <div class="setting-group">
                <label>Quick Templates</label>
                <div class="template-grid">
                  {#each templates as template}
                    <button class="template-btn" on:click={() => applyTemplate(template)}>
                      {template.name}
                    </button>
                  {/each}
                </div>
              </div>

              <div class="setting-group">
                <label for="watermark-text">Watermark Text</label>
                <textarea
                  id="watermark-text"
                  bind:value={textWatermark.text}
                  placeholder="Enter your watermark text..."
                  rows="3"
                />
              </div>

              <div class="setting-group">
                <label>Position</label>
                <div class="position-grid">
                  {#each positions as pos}
                    <button
                      class="position-btn"
                      class:active={textWatermark.position === pos.value}
                      on:click={() => textWatermark.position = pos.value}
                      title={pos.label}
                    >
                      {pos.icon}
                    </button>
                  {/each}
                </div>
              </div>

              <div class="setting-row">
                <div class="setting-group">
                  <label for="font-family">Font</label>
                  <select id="font-family" bind:value={textWatermark.fontFamily}>
                    {#each fontFamilies as font}
                      <option value={font}>{font}</option>
                    {/each}
                  </select>
                </div>

                <div class="setting-group">
                  <label for="font-size">Size: {textWatermark.fontSize}px</label>
                  <input
                    id="font-size"
                    type="range"
                    min="12"
                    max="72"
                    bind:value={textWatermark.fontSize}
                  />
                </div>
              </div>

              <div class="setting-row">
                <div class="setting-group">
                  <label for="text-color">Color</label>
                  <div class="color-picker">
                    <input
                      id="text-color"
                      type="color"
                      bind:value={textWatermark.color}
                    />
                    <span class="color-value">{textWatermark.color}</span>
                  </div>
                </div>

                <div class="setting-group">
                  <label for="text-opacity">Opacity: {textWatermark.opacity}%</label>
                  <input
                    id="text-opacity"
                    type="range"
                    min="10"
                    max="100"
                    bind:value={textWatermark.opacity}
                  />
                </div>
              </div>

              <div class="setting-group">
                <label for="rotation">Rotation: {textWatermark.rotation}°</label>
                <input
                  id="rotation"
                  type="range"
                  min="-45"
                  max="45"
                  bind:value={textWatermark.rotation}
                />
              </div>

              <div class="setting-group">
                <label class="checkbox-label">
                  <input type="checkbox" bind:checked={textWatermark.shadow} />
                  <span>Add text shadow</span>
                </label>
              </div>
            </div>
          {/if}

          <!-- Image Watermark Settings -->
          {#if activeTab === 'image'}
            <div class="tab-content">
              <div class="setting-group">
                <label>Logo Presets</label>
                <div class="preset-grid">
                  {#each logoPresets as preset}
                    <button class="preset-btn" on:click={() => selectPreset(preset)}>
                      <img src={preset.url} alt={preset.name} />
                      <span>{preset.name}</span>
                    </button>
                  {/each}
                </div>
              </div>

              <div class="setting-group">
                <label>Upload Custom Logo</label>
                <div class="upload-area">
                  <input
                    type="file"
                    accept="image/*"
                    on:change={handleImageUpload}
                    id="logo-upload"
                    style="display: none;"
                  />
                  <label for="logo-upload" class="upload-btn">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/>
                    </svg>
                    Choose Image
                  </label>
                  {#if imageWatermark.url}
                    <div class="uploaded-preview">
                      <img src={imageWatermark.url} alt="Uploaded logo" />
                    </div>
                  {/if}
                </div>
              </div>

              <div class="setting-group">
                <label>Position</label>
                <div class="position-grid">
                  {#each positions as pos}
                    <button
                      class="position-btn"
                      class:active={imageWatermark.position === pos.value}
                      on:click={() => imageWatermark.position = pos.value}
                      title={pos.label}
                    >
                      {pos.icon}
                    </button>
                  {/each}
                </div>
              </div>

              <div class="setting-group">
                <label for="logo-size">Size: {imageWatermark.size}px</label>
                <input
                  id="logo-size"
                  type="range"
                  min="50"
                  max="300"
                  bind:value={imageWatermark.size}
                />
              </div>

              <div class="setting-group">
                <label for="logo-opacity">Opacity: {imageWatermark.opacity}%</label>
                <input
                  id="logo-opacity"
                  type="range"
                  min="10"
                  max="100"
                  bind:value={imageWatermark.opacity}
                />
              </div>

              <div class="setting-group">
                <label for="logo-rotation">Rotation: {imageWatermark.rotation}°</label>
                <input
                  id="logo-rotation"
                  type="range"
                  min="-45"
                  max="45"
                  bind:value={imageWatermark.rotation}
                />
              </div>
            </div>
          {/if}

          <!-- Saved Watermarks -->
          {#if activeTab === 'saved'}
            <div class="tab-content">
              {#if savedWatermarks.length === 0}
                <div class="empty-state">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                  </svg>
                  <p>No saved watermarks yet</p>
                  <small>Create a watermark and save it for quick access</small>
                </div>
              {:else}
                <div class="saved-list">
                  {#each savedWatermarks as watermark}
                    <div class="saved-item">
                      <div class="saved-preview">
                        {#if watermark.type === 'text'}
                          <div class="text-preview" style="font-family: {watermark.fontFamily};">
                            {watermark.text.substring(0, 20)}{watermark.text.length > 20 ? '...' : ''}
                          </div>
                        {:else}
                          <img src={watermark.url} alt="Logo" />
                        {/if}
                      </div>
                      <div class="saved-actions">
                        <button class="action-btn" on:click={() => loadWatermark(watermark)}>
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                          </svg>
                        </button>
                        <button class="action-btn delete" on:click={() => deleteWatermark(watermark.id)}>
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          {/if}
        </div>

        <!-- Right Panel: Preview -->
        <div class="preview-panel">
          <div class="preview-header">
            <h3>Preview</h3>
            <label class="toggle-preview">
              <input type="checkbox" bind:checked={previewMode} />
              <span>Show Preview</span>
            </label>
          </div>
          
          {#if previewMode}
            <div class="preview-area">
              <div class="preview-video">
                <div class="sample-content">
                  <h4>Sample Video Content</h4>
                  <p>Your watermark will appear here</p>
                </div>
                
                <!-- Watermark Preview -->
                {#if activeTab === 'text' && textWatermark.text}
                  <div 
                    class="watermark-preview text-watermark"
                    class:top-left={textWatermark.position === 'top-left'}
                    class:top-center={textWatermark.position === 'top-center'}
                    class:top-right={textWatermark.position === 'top-right'}
                    class:middle-left={textWatermark.position === 'middle-left'}
                    class:center={textWatermark.position === 'center'}
                    class:middle-right={textWatermark.position === 'middle-right'}
                    class:bottom-left={textWatermark.position === 'bottom-left'}
                    class:bottom-center={textWatermark.position === 'bottom-center'}
                    class:bottom-right={textWatermark.position === 'bottom-right'}
                    style="
                      font-size: {textWatermark.fontSize}px;
                      color: {textWatermark.color};
                      opacity: {textWatermark.opacity / 100};
                      font-family: {textWatermark.fontFamily};
                      font-weight: {textWatermark.fontWeight};
                      text-shadow: {textWatermark.shadow ? '2px 2px 4px rgba(0,0,0,0.5)' : 'none'};
                      transform: rotate({textWatermark.rotation}deg);
                    "
                  >
                    {textWatermark.text}
                  </div>
                {/if}
                
                {#if activeTab === 'image' && imageWatermark.url}
                  <div 
                    class="watermark-preview image-watermark"
                    class:top-left={imageWatermark.position === 'top-left'}
                    class:top-center={imageWatermark.position === 'top-center'}
                    class:top-right={imageWatermark.position === 'top-right'}
                    class:middle-left={imageWatermark.position === 'middle-left'}
                    class:center={imageWatermark.position === 'center'}
                    class:middle-right={imageWatermark.position === 'middle-right'}
                    class:bottom-left={imageWatermark.position === 'bottom-left'}
                    class:bottom-center={imageWatermark.position === 'bottom-center'}
                    class:bottom-right={imageWatermark.position === 'bottom-right'}
                    style="
                      opacity: {imageWatermark.opacity / 100};
                      transform: rotate({imageWatermark.rotation}deg);
                    "
                  >
                    <img 
                      src={imageWatermark.url} 
                      alt="Logo" 
                      style="width: {imageWatermark.size}px; height: auto;"
                    />
                  </div>
                {/if}
              </div>
            </div>
          {/if}
          
          <div class="preview-info">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
            <p>Watermark will be applied to all exported videos</p>
          </div>
        </div>
      </div>
    </div>

    <div class="modal-footer">
      <button class="btn secondary" on:click={saveWatermark}>
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
        </svg>
        Save Watermark
      </button>
      <button class="btn secondary" on:click={onClose}>Cancel</button>
      <button class="btn primary" on:click={applyWatermark}>
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>
        Apply Watermark
      </button>
    </div>
  </div>
</div>

<style>
  .watermark-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: 2rem;
  }

  .watermark-modal {
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    border-radius: 24px;
    border: 1px solid rgba(102, 126, 234, 0.3);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    width: 100%;
    max-width: 1200px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24px 32px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .header-title {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .header-title svg {
    width: 28px;
    height: 28px;
    color: #667eea;
  }

  .header-title h2 {
    margin: 0;
    font-size: 24px;
    font-weight: 700;
    color: #fff;
  }

  .close-btn {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 8px;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    cursor: pointer;
    transition: all 0.2s;
  }

  .close-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: rotate(90deg);
  }

  .close-btn svg {
    width: 20px;
    height: 20px;
  }

  .modal-content {
    flex: 1;
    overflow: hidden;
  }

  .watermark-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    height: 100%;
    padding: 24px 32px;
  }

  .settings-panel {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    overflow-y: auto;
  }

  .watermark-tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 1rem;
  }

  .tab-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    color: rgba(255, 255, 255, 0.6);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .tab-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.9);
  }

  .tab-btn.active {
    background: linear-gradient(135deg, #667eea, #764ba2);
    border-color: rgba(102, 126, 234, 0.5);
    color: #fff;
  }

  .tab-btn svg {
    width: 18px;
    height: 18px;
  }

  .tab-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .setting-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .setting-group label {
    font-size: 14px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
  }

  .setting-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  textarea,
  select,
  input[type="text"] {
    padding: 12px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: #fff;
    font-size: 14px;
    font-family: inherit;
  }

  textarea {
    resize: vertical;
    min-height: 80px;
  }

  input[type="range"] {
    width: 100%;
  }

  .template-grid,
  .preset-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .template-btn,
  .preset-btn {
    padding: 12px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .template-btn:hover,
  .preset-btn:hover {
    background: rgba(102, 126, 234, 0.2);
    border-color: rgba(102, 126, 234, 0.4);
  }

  .position-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .position-btn {
    aspect-ratio: 1;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: #fff;
    font-size: 20px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .position-btn:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .position-btn.active {
    background: linear-gradient(135deg, #667eea, #764ba2);
    border-color: rgba(102, 126, 234, 0.5);
  }

  .color-picker {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .color-picker input[type="color"] {
    width: 60px;
    height: 40px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    cursor: pointer;
  }

  .color-value {
    font-family: 'Courier New', monospace;
    color: rgba(255, 255, 255, 0.7);
    font-size: 13px;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 8px;
    color: rgba(255, 255, 255, 0.9);
    cursor: pointer;
  }

  .upload-area {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .upload-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 16px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    border: none;
    border-radius: 12px;
    color: #fff;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .upload-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
  }

  .uploaded-preview {
    max-width: 200px;
    border-radius: 8px;
    overflow: hidden;
  }

  .uploaded-preview img {
    width: 100%;
    height: auto;
  }

  .preview-panel {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 16px;
    padding: 20px;
  }

  .preview-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .preview-header h3 {
    margin: 0;
    font-size: 18px;
    color: #fff;
  }

  .preview-area {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .preview-video {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    background: linear-gradient(135deg, #2d3748, #1a202c);
    border-radius: 12px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .sample-content {
    text-align: center;
    color: rgba(255, 255, 255, 0.5);
  }

  .watermark-preview {
    position: absolute;
    pointer-events: none;
    z-index: 10;
  }

  .watermark-preview.top-left { top: 20px; left: 20px; }
  .watermark-preview.top-center { top: 20px; left: 50%; transform: translateX(-50%); }
  .watermark-preview.top-right { top: 20px; right: 20px; }
  .watermark-preview.middle-left { top: 50%; left: 20px; transform: translateY(-50%); }
  .watermark-preview.center { top: 50%; left: 50%; transform: translate(-50%, -50%); }
  .watermark-preview.middle-right { top: 50%; right: 20px; transform: translateY(-50%); }
  .watermark-preview.bottom-left { bottom: 20px; left: 20px; }
  .watermark-preview.bottom-center { bottom: 20px; left: 50%; transform: translateX(-50%); }
  .watermark-preview.bottom-right { bottom: 20px; right: 20px; }

  .preview-info {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.2);
    border-radius: 8px;
  }

  .preview-info svg {
    width: 20px;
    height: 20px;
    color: #3b82f6;
    flex-shrink: 0;
  }

  .preview-info p {
    margin: 0;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.8);
  }

  .saved-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .saved-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
  }

  .saved-preview {
    flex: 1;
  }

  .text-preview {
    color: #fff;
    font-size: 14px;
  }

  .saved-preview img {
    max-width: 100px;
    max-height: 60px;
  }

  .saved-actions {
    display: flex;
    gap: 8px;
  }

  .action-btn {
    padding: 8px;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 6px;
    color: #fff;
    cursor: pointer;
    transition: all 0.2s;
  }

  .action-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .action-btn.delete:hover {
    background: rgba(239, 68, 68, 0.3);
  }

  .action-btn svg {
    width: 18px;
    height: 18px;
  }

  .empty-state {
    text-align: center;
    padding: 3rem 1rem;
    color: rgba(255, 255, 255, 0.5);
  }

  .empty-state svg {
    width: 48px;
    height: 48px;
    margin-bottom: 1rem;
    opacity: 0.3;
  }

  .modal-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 12px;
    padding: 20px 32px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    border: none;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn svg {
    width: 18px;
    height: 18px;
  }

  .btn.secondary {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }

  .btn.secondary:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .btn.primary {
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: #fff;
  }

  .btn.primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
  }

  /* Scrollbar */
  .settings-panel::-webkit-scrollbar {
    width: 8px;
  }

  .settings-panel::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
  }

  .settings-panel::-webkit-scrollbar-thumb {
    background: rgba(102, 126, 234, 0.5);
    border-radius: 4px;
  }

  @media (max-width: 968px) {
    .watermark-container {
      grid-template-columns: 1fr;
    }
    
    .preview-panel {
      order: -1;
    }
  }
</style>
