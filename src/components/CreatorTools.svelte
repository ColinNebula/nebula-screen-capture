<script>
  import { createEventDispatcher } from 'svelte';
  import TemplateLibrary from './TemplateLibrary.svelte';
  import StickerLibrary from './StickerLibrary.svelte';
  import AudioLibrary from './AudioLibrary.svelte';
  
  export let visible = false;
  export let currentTool = 'templates'; // 'templates', 'stickers', 'audio'
  
  const dispatch = createEventDispatcher();
  
  const tools = [
    {
      id: 'templates',
      name: 'Templates',
      icon: '📚',
      description: 'Pre-made video templates',
      component: TemplateLibrary
    },
    {
      id: 'stickers',
      name: 'Stickers',
      icon: '🎨',
      description: 'Emojis, icons & graphics',
      component: StickerLibrary
    },
    {
      id: 'audio',
      name: 'Audio',
      icon: '🎵',
      description: 'Music & sound effects',
      component: AudioLibrary
    }
  ];
  
  let activeTool = currentTool;
  let showFooter = true;
  let hideTimeout;
  
  function switchTool(toolId) {
    activeTool = toolId;
    dispatch('toolchange', toolId);
  }
  
  function handleMouseMove() {
    showFooter = true;
    clearTimeout(hideTimeout);
    hideTimeout = setTimeout(() => {
      showFooter = false;
    }, 2000);
  }
  
  function handleTemplateSelect(event) {
    console.log('CreatorTools - Template selected:', event.detail);
    dispatch('template-select', event.detail);
  }
  
  function handleTemplatePreview(event) {
    console.log('CreatorTools - Template preview:', event.detail);
    dispatch('template-preview', event.detail);
  }
  
  function handleStickerSelect(event) {
    dispatch('sticker-select', event.detail);
  }
  
  function handleAudioSelect(event) {
    dispatch('audio-select', event.detail);
  }
  
  function close() {
    dispatch('close');
  }
  
  $: activeComponent = tools.find(t => t.id === activeTool)?.component;
  
  $: console.log('CreatorTools - visible prop changed:', visible);
  $: if (visible) console.log('CreatorTools SHOULD BE VISIBLE NOW!');
</script>

{#if visible}
  <div class="creator-tools-overlay" on:click={close}>
    <div class="creator-tools-panel" on:click|stopPropagation>
      <div class="panel-header">
        <div class="header-content">
          <h2>
            <span class="header-icon">🎬</span>
            Creator Tools
          </h2>
          <p class="header-subtitle">Enhance your videos with professional templates, stickers, and audio</p>
        </div>
        <button class="close-btn" on:click={close} title="Close">
          <span>✕</span>
        </button>
      </div>

      <div class="tool-selector">
        {#each tools as tool}
          <button
            class="tool-button"
            class:active={activeTool === tool.id}
            on:click={() => switchTool(tool.id)}
          >
            <span class="tool-icon">{tool.icon}</span>
            <div class="tool-info">
              <span class="tool-name">{tool.name}</span>
              <span class="tool-description">{tool.description}</span>
            </div>
          </button>
        {/each}
      </div>

      <div class="tool-content" on:mousemove={handleMouseMove}>
        {#if activeTool === 'templates'}
          <TemplateLibrary on:select={handleTemplateSelect} on:preview={handleTemplatePreview} />
        {:else if activeTool === 'stickers'}
          <StickerLibrary on:select={handleStickerSelect} />
        {:else if activeTool === 'audio'}
          <AudioLibrary on:select={handleAudioSelect} />
        {/if}
      </div>

      <div class="panel-footer" class:hidden={!showFooter}>
        <div class="footer-stats">
          <div class="stat-item">
            <span class="stat-icon">📚</span>
            <span class="stat-text">50+ Templates</span>
          </div>
          <div class="stat-item">
            <span class="stat-icon">🎨</span>
            <span class="stat-text">200+ Stickers</span>
          </div>
          <div class="stat-item">
            <span class="stat-icon">🎵</span>
            <span class="stat-text">100+ Audio Tracks</span>
          </div>
        </div>
        <button class="footer-btn" on:click={close}>
          <span>✓</span>
          Done
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .creator-tools-overlay {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    background: rgba(0, 0, 0, 0.95) !important;
    backdrop-filter: blur(12px) !important;
    z-index: 2147483647 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    padding: 2rem !important;
    isolation: isolate !important;
  }

  .creator-tools-panel {
    width: 90%;
    max-width: 1400px;
    height: 85vh;
    background: #0f1419;
    border-radius: 20px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 3px solid #667eea;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 2rem;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
    border-bottom: 2px solid rgba(255, 255, 255, 0.1);
  }

  .header-content {
    flex: 1;
  }

  .panel-header h2 {
    margin: 0 0 0.5rem 0;
    font-size: 2rem;
    font-weight: 700;
    color: #ffffff;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .header-icon {
    font-size: 2.5rem;
  }

  .header-subtitle {
    margin: 0;
    font-size: 1rem;
    color: #a0aec0;
    font-weight: 400;
  }

  .close-btn {
    width: 48px;
    height: 48px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    color: #a0aec0;
    font-size: 1.5rem;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .close-btn:hover {
    background: rgba(255, 107, 107, 0.2);
    border-color: rgba(255, 107, 107, 0.5);
    color: #ff6b6b;
    transform: rotate(90deg);
  }

  .tool-selector {
    display: flex;
    gap: 1rem;
    padding: 1.5rem 2rem;
    background: #1a1a2e;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .tool-button {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.25rem;
    background: #16213e;
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    color: #ffffff;
  }

  .tool-button:hover {
    background: rgba(102, 126, 234, 0.1);
    border-color: rgba(102, 126, 234, 0.3);
    transform: translateY(-2px);
  }

  .tool-button.active {
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
    border-color: #667eea;
    box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
  }

  .tool-icon {
    font-size: 2.5rem;
  }

  .tool-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    text-align: left;
  }

  .tool-name {
    font-size: 1.1rem;
    font-weight: 600;
  }

  .tool-description {
    font-size: 0.85rem;
    color: #a0aec0;
  }

  .tool-content {
    flex: 1;
    overflow: auto;
    background: #1a1a2e;
  }

  .panel-footer {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1.5rem;
    background: #16213e;
    border-top: 2px solid rgba(255, 255, 255, 0.1);
    transform: translateY(0);
    transition: transform 0.3s ease;
    z-index: 10;
  }
  
  .panel-footer.hidden {
    transform: translateY(100%);
  }

  .footer-stats {
    display: flex;
    gap: 1rem;
  }

  .stat-item {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.4rem 0.75rem;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 6px;
  }

  .stat-icon {
    font-size: 1rem;
  }

  .stat-text {
    font-size: 0.8rem;
    color: #a0aec0;
    font-weight: 500;
  }

  .footer-btn {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.6rem 1.25rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    border-radius: 10px;
    color: #ffffff;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .footer-btn:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  }
</style>
