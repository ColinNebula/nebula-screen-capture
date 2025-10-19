<script>
  export let onConfirm = () => {};
  export let onCancel = () => {};
  export let defaultName = '';
  export let categories = ['Tutorial', 'Demo', 'Meeting', 'Gaming', 'Presentation', 'Other'];
  
  let recordingName = defaultName || `Recording ${new Date().toLocaleDateString()}`;
  let selectedCategory = 'Other';
  let tags = '';
  let nameInput;
  
  function handleSubmit() {
    if (recordingName.trim()) {
      const tagArray = tags.split(',').map(t => t.trim()).filter(t => t);
      onConfirm({
        name: recordingName.trim(),
        category: selectedCategory,
        tags: tagArray
      });
    }
  }
  
  function handleKeydown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  }
  
  // Auto-focus input
  $: if (nameInput) {
    nameInput.focus();
    nameInput.select();
  }
</script>

<div class="prompt-overlay" on:click={onCancel} role="dialog" aria-labelledby="prompt-title" aria-modal="true">
  <div class="prompt-card" on:click|stopPropagation on:keydown={handleKeydown}>
    <div class="prompt-header">
      <h2 id="prompt-title">📹 Name Your Recording</h2>
      <button 
        class="close-btn" 
        on:click={onCancel}
        aria-label="Close dialog"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>
    
    <div class="prompt-body">
      <div class="form-group">
        <label for="recording-name">
          Recording Name <span class="required" aria-label="required">*</span>
        </label>
        <input
          id="recording-name"
          type="text"
          bind:this={nameInput}
          bind:value={recordingName}
          placeholder="Enter recording name..."
          required
          aria-required="true"
        />
      </div>
      
      <div class="form-group">
        <label for="recording-category">Category</label>
        <select id="recording-category" bind:value={selectedCategory}>
          {#each categories as category}
            <option value={category}>{category}</option>
          {/each}
        </select>
      </div>
      
      <div class="form-group">
        <label for="recording-tags">
          Tags
          <span class="hint">(comma-separated)</span>
        </label>
        <input
          id="recording-tags"
          type="text"
          bind:value={tags}
          placeholder="work, tutorial, important..."
          aria-describedby="tags-hint"
        />
        <small id="tags-hint" class="form-hint">
          Add tags to organize and find your recordings easily
        </small>
      </div>
    </div>
    
    <div class="prompt-footer">
      <button 
        class="btn-cancel" 
        on:click={onCancel}
        type="button"
      >
        Cancel
      </button>
      <button 
        class="btn-confirm" 
        on:click={handleSubmit}
        type="submit"
        disabled={!recordingName.trim()}
        aria-label="Start recording with entered name"
      >
        Start Recording
      </button>
    </div>
  </div>
</div>

<style>
  .prompt-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100000;
    animation: fadeIn 0.2s ease;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  .prompt-card {
    background: var(--bg-primary, white);
    border-radius: 16px;
    max-width: 500px;
    width: 90%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    animation: slideUp 0.3s ease;
    overflow: hidden;
  }
  
  @keyframes slideUp {
    from {
      transform: translateY(30px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  .prompt-header {
    padding: 1.5rem 2rem;
    border-bottom: 1px solid var(--border-color, #e0e0e0);
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }
  
  .prompt-header h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
  }
  
  .close-btn {
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    padding: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    transition: background 0.2s;
  }
  
  .close-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  
  .close-btn:focus-visible {
    outline: 2px solid white;
    outline-offset: 2px;
  }
  
  .close-btn svg {
    width: 20px;
    height: 20px;
  }
  
  .prompt-body {
    padding: 2rem;
  }
  
  .form-group {
    margin-bottom: 1.5rem;
  }
  
  .form-group:last-child {
    margin-bottom: 0;
  }
  
  label {
    display: block;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: var(--text-primary, #1a1a1a);
    font-size: 0.95rem;
  }
  
  .required {
    color: #ef4444;
  }
  
  .hint {
    font-weight: 400;
    color: var(--text-secondary, #666);
    font-size: 0.85rem;
  }
  
  input[type="text"],
  select {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 2px solid var(--border-color, #e0e0e0);
    border-radius: 8px;
    font-size: 1rem;
    background: var(--bg-secondary, #f9f9f9);
    color: var(--text-primary, #1a1a1a);
    transition: all 0.2s;
  }
  
  input[type="text"]:focus,
  select:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
  
  input[type="text"]:focus-visible,
  select:focus-visible {
    outline: 2px solid #667eea;
    outline-offset: 2px;
  }
  
  .form-hint {
    display: block;
    margin-top: 0.5rem;
    color: var(--text-secondary, #666);
    font-size: 0.85rem;
  }
  
  .prompt-footer {
    padding: 1.5rem 2rem;
    border-top: 1px solid var(--border-color, #e0e0e0);
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    background: var(--bg-secondary, #f9f9f9);
  }
  
  .btn-cancel,
  .btn-confirm {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .btn-cancel {
    background: transparent;
    color: var(--text-secondary, #666);
  }
  
  .btn-cancel:hover {
    background: rgba(0, 0, 0, 0.05);
  }
  
  .btn-confirm {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  }
  
  .btn-confirm:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
  }
  
  .btn-confirm:active:not(:disabled) {
    transform: translateY(0);
  }
  
  .btn-confirm:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .btn-cancel:focus-visible,
  .btn-confirm:focus-visible {
    outline: 2px solid #667eea;
    outline-offset: 2px;
  }
  
  /* Dark theme support */
  :global([data-theme="dark"]) .prompt-card {
    background: #1a1a1a;
    color: white;
  }
  
  :global([data-theme="dark"]) .prompt-header {
    border-bottom-color: #333;
  }
  
  :global([data-theme="dark"]) .prompt-footer {
    background: #222;
    border-top-color: #333;
  }
  
  :global([data-theme="dark"]) label {
    color: #fff;
  }
  
  :global([data-theme="dark"]) input[type="text"],
  :global([data-theme="dark"]) select {
    background: #2a2a2a;
    border-color: #444;
    color: white;
  }
  
  :global([data-theme="dark"]) .form-hint {
    color: #aaa;
  }
  
  :global([data-theme="dark"]) .btn-cancel:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  @media (max-width: 600px) {
    .prompt-card {
      width: 95%;
      margin: 1rem;
    }
    
    .prompt-header,
    .prompt-body,
    .prompt-footer {
      padding: 1rem 1.5rem;
    }
    
    .prompt-header h2 {
      font-size: 1.25rem;
    }
    
    .prompt-footer {
      flex-direction: column;
    }
    
    .btn-cancel,
    .btn-confirm {
      width: 100%;
    }
  }
</style>
