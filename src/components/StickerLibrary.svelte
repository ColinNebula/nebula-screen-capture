<script>
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  let searchQuery = '';
  let activeCategory = 'all';
  let selectedSticker = null;
  
  const stickers = [
    // Emojis - Reactions
    { id: 'emoji-thumbs-up', category: 'emojis', content: '👍', name: 'Thumbs Up', tags: ['reaction', 'positive', 'like'] },
    { id: 'emoji-thumbs-down', category: 'emojis', content: '👎', name: 'Thumbs Down', tags: ['reaction', 'negative', 'dislike'] },
    { id: 'emoji-fire', category: 'emojis', content: '🔥', name: 'Fire', tags: ['hot', 'trending', 'awesome'] },
    { id: 'emoji-heart', category: 'emojis', content: '❤️', name: 'Heart', tags: ['love', 'like', 'favorite'] },
    { id: 'emoji-star', category: 'emojis', content: '⭐', name: 'Star', tags: ['favorite', 'rating', 'quality'] },
    { id: 'emoji-clap', category: 'emojis', content: '👏', name: 'Clapping', tags: ['applause', 'good', 'bravo'] },
    { id: 'emoji-laugh', category: 'emojis', content: '😂', name: 'Laughing', tags: ['funny', 'lol', 'humor'] },
    { id: 'emoji-thinking', category: 'emojis', content: '🤔', name: 'Thinking', tags: ['question', 'hmm', 'wonder'] },
    { id: 'emoji-shocked', category: 'emojis', content: '😱', name: 'Shocked', tags: ['surprised', 'wow', 'omg'] },
    { id: 'emoji-cool', category: 'emojis', content: '😎', name: 'Cool', tags: ['awesome', 'sunglasses', 'chill'] },
    
    // Arrows
    { id: 'arrow-right', category: 'arrows', content: '→', name: 'Arrow Right', tags: ['direction', 'next', 'forward'], premium: false },
    { id: 'arrow-left', category: 'arrows', content: '←', name: 'Arrow Left', tags: ['direction', 'back', 'previous'], premium: false },
    { id: 'arrow-up', category: 'arrows', content: '↑', name: 'Arrow Up', tags: ['direction', 'increase', 'growth'], premium: false },
    { id: 'arrow-down', category: 'arrows', content: '↓', name: 'Arrow Down', tags: ['direction', 'decrease', 'drop'], premium: false },
    { id: 'arrow-curved', category: 'arrows', content: '↪', name: 'Curved Arrow', tags: ['turn', 'redirect'], premium: false },
    { id: 'arrow-double', category: 'arrows', content: '⇒', name: 'Double Arrow', tags: ['emphasis', 'strong'], premium: true },
    { id: 'arrow-circle', category: 'arrows', content: '➡️', name: 'Circle Arrow', tags: ['next', 'continue'], premium: false },
    
    // Shapes
    { id: 'shape-circle', category: 'shapes', content: '⚫', name: 'Circle', tags: ['dot', 'point', 'bullet'], premium: false },
    { id: 'shape-square', category: 'shapes', content: '⬛', name: 'Square', tags: ['box', 'block'], premium: false },
    { id: 'shape-star', category: 'shapes', content: '★', name: 'Star', tags: ['rating', 'favorite'], premium: false },
    { id: 'shape-heart', category: 'shapes', content: '♥', name: 'Heart', tags: ['love', 'like'], premium: false },
    { id: 'shape-triangle', category: 'shapes', content: '▲', name: 'Triangle', tags: ['point', 'indicator'], premium: false },
    { id: 'shape-diamond', category: 'shapes', content: '◆', name: 'Diamond', tags: ['gem', 'premium'], premium: true },
    { id: 'shape-hexagon', category: 'shapes', content: '⬢', name: 'Hexagon', tags: ['tech', 'modern'], premium: true },
    
    // Icons
    { id: 'icon-check', category: 'icons', content: '✓', name: 'Check', tags: ['correct', 'done', 'yes'], premium: false },
    { id: 'icon-x', category: 'icons', content: '✗', name: 'X', tags: ['wrong', 'close', 'no'], premium: false },
    { id: 'icon-bell', category: 'icons', content: '🔔', name: 'Bell', tags: ['notification', 'alert', 'subscribe'], premium: false },
    { id: 'icon-camera', category: 'icons', content: '📷', name: 'Camera', tags: ['photo', 'picture', 'snap'], premium: false },
    { id: 'icon-video', category: 'icons', content: '🎥', name: 'Video', tags: ['film', 'record', 'movie'], premium: false },
    { id: 'icon-music', category: 'icons', content: '🎵', name: 'Music', tags: ['audio', 'song', 'sound'], premium: false },
    { id: 'icon-lightning', category: 'icons', content: '⚡', name: 'Lightning', tags: ['fast', 'power', 'energy'], premium: false },
    { id: 'icon-trophy', category: 'icons', content: '🏆', name: 'Trophy', tags: ['winner', 'champion', 'award'], premium: false },
    { id: 'icon-rocket', category: 'icons', content: '🚀', name: 'Rocket', tags: ['launch', 'speed', 'startup'], premium: false },
    { id: 'icon-target', category: 'icons', content: '🎯', name: 'Target', tags: ['goal', 'aim', 'focus'], premium: false },
    { id: 'icon-light', category: 'icons', content: '💡', name: 'Light Bulb', tags: ['idea', 'tip', 'hint'], premium: false },
    { id: 'icon-gift', category: 'icons', content: '🎁', name: 'Gift', tags: ['present', 'reward', 'bonus'], premium: false },
    
    // Callouts
    { id: 'callout-info', category: 'callouts', content: 'ℹ️', name: 'Info', tags: ['information', 'help', 'details'], premium: false },
    { id: 'callout-warning', category: 'callouts', content: '⚠️', name: 'Warning', tags: ['alert', 'caution', 'important'], premium: false },
    { id: 'callout-error', category: 'callouts', content: '❌', name: 'Error', tags: ['wrong', 'mistake', 'fail'], premium: false },
    { id: 'callout-success', category: 'callouts', content: '✅', name: 'Success', tags: ['correct', 'done', 'complete'], premium: false },
    { id: 'callout-question', category: 'callouts', content: '❓', name: 'Question', tags: ['help', 'inquiry', 'ask'], premium: false },
    { id: 'callout-exclamation', category: 'callouts', content: '❗', name: 'Exclamation', tags: ['important', 'attention', 'notice'], premium: false },
    
    // Text Decorations
    { id: 'text-sparkles', category: 'text-decorations', content: '✨', name: 'Sparkles', tags: ['magic', 'special', 'new'], premium: false },
    { id: 'text-crown', category: 'text-decorations', content: '👑', name: 'Crown', tags: ['premium', 'king', 'best'], premium: true },
    { id: 'text-gem', category: 'text-decorations', content: '💎', name: 'Gem', tags: ['valuable', 'premium', 'quality'], premium: true },
    { id: 'text-boom', category: 'text-decorations', content: '💥', name: 'Boom', tags: ['explosion', 'impact', 'pow'], premium: false },
    { id: 'text-tada', category: 'text-decorations', content: '🎉', name: 'Party', tags: ['celebration', 'confetti', 'yay'], premium: false },
    { id: 'text-100', category: 'text-decorations', content: '💯', name: '100', tags: ['perfect', 'full', 'complete'], premium: false },
    
    // Social Media
    { id: 'social-like', category: 'social', content: '👍', name: 'Like', tags: ['thumbs', 'approve', 'good'], premium: false },
    { id: 'social-subscribe', category: 'social', content: '🔔', name: 'Subscribe', tags: ['bell', 'notification', 'follow'], premium: false },
    { id: 'social-share', category: 'social', content: '🔄', name: 'Share', tags: ['repost', 'spread', 'viral'], premium: false },
    { id: 'social-comment', category: 'social', content: '💬', name: 'Comment', tags: ['chat', 'message', 'talk'], premium: false },
    { id: 'social-link', category: 'social', content: '🔗', name: 'Link', tags: ['url', 'connection', 'share'], premium: false },
  ];
  
  const categories = [
    { id: 'all', name: 'All Stickers', icon: '🎨' },
    { id: 'emojis', name: 'Emojis', icon: '😊' },
    { id: 'arrows', name: 'Arrows', icon: '→' },
    { id: 'shapes', name: 'Shapes', icon: '⬛' },
    { id: 'icons', name: 'Icons', icon: '📌' },
    { id: 'callouts', name: 'Callouts', icon: 'ℹ️' },
    { id: 'text-decorations', name: 'Decorations', icon: '✨' },
    { id: 'social', name: 'Social', icon: '👍' }
  ];
  
  $: filteredStickers = stickers.filter(sticker => {
    const matchesSearch = searchQuery === '' || 
      sticker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sticker.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = activeCategory === 'all' || sticker.category === activeCategory;
    return matchesSearch && matchesCategory;
  });
  
  function selectSticker(sticker) {
    selectedSticker = sticker;
    dispatch('select', {
      ...sticker,
      type: 'sticker',
      position: { x: 50, y: 50 }, // Center by default
      scale: 1,
      rotation: 0,
      opacity: 100
    });
  }
  
  function handleDragStart(event, sticker) {
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData('application/json', JSON.stringify(sticker));
  }
</script>

<div class="sticker-library">
  <div class="library-header">
    <h3>
      <span class="icon">🎨</span>
      Sticker Library
    </h3>
    <div class="search-box">
      <span class="search-icon">🔍</span>
      <input
        type="text"
        placeholder="Search stickers..."
        bind:value={searchQuery}
      />
    </div>
  </div>

  <div class="category-tabs">
    {#each categories as category}
      <button
        class="category-tab"
        class:active={activeCategory === category.id}
        on:click={() => activeCategory = category.id}
      >
        <span class="tab-icon">{category.icon}</span>
        <span class="tab-name">{category.name}</span>
      </button>
    {/each}
  </div>

  <div class="stickers-grid">
    {#each filteredStickers as sticker (sticker.id)}
      <div
        class="sticker-item"
        class:selected={selectedSticker?.id === sticker.id}
        class:premium={sticker.premium}
        draggable="true"
        on:dragstart={(e) => handleDragStart(e, sticker)}
        on:click={() => selectSticker(sticker)}
        title="{sticker.name} - Click to add or drag to position"
      >
        {#if sticker.premium}
          <div class="premium-badge">
            <span>👑</span>
          </div>
        {/if}
        <div class="sticker-content">{sticker.content}</div>
        <div class="sticker-name">{sticker.name}</div>
      </div>
    {/each}
  </div>

  {#if filteredStickers.length === 0}
    <div class="empty-state">
      <div class="empty-icon">🔍</div>
      <p>No stickers found</p>
      <small>Try adjusting your search or category filter</small>
    </div>
  {/if}

  {#if selectedSticker}
    <div class="sticker-preview">
      <div class="preview-header">
        <h4>Selected Sticker</h4>
        <button class="close-preview" on:click={() => selectedSticker = null}>✕</button>
      </div>
      <div class="preview-content">
        <div class="preview-sticker">{selectedSticker.content}</div>
        <div class="preview-info">
          <h5>{selectedSticker.name}</h5>
          <div class="preview-tags">
            {#each selectedSticker.tags as tag}
              <span class="tag">#{tag}</span>
            {/each}
          </div>
        </div>
      </div>
      <div class="preview-hint">
        💡 <strong>Tip:</strong> Drag stickers directly onto your video or click to add
      </div>
    </div>
  {/if}
</div>

<style>
  .sticker-library {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--bg-secondary, #1a1a2e);
    border-radius: 12px;
    overflow: hidden;
  }

  .library-header {
    padding: 1.5rem;
    background: var(--bg-tertiary, #16213e);
    border-bottom: 2px solid var(--border-primary, rgba(255, 255, 255, 0.1));
  }

  .library-header h3 {
    margin: 0 0 1rem 0;
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--text-primary, #ffffff);
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .icon {
    font-size: 1.75rem;
  }

  .search-box {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-icon {
    position: absolute;
    left: 1rem;
    font-size: 1.25rem;
    pointer-events: none;
  }

  .search-box input {
    width: 100%;
    padding: 0.75rem 1rem 0.75rem 3rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: var(--text-primary, #ffffff);
    font-size: 0.95rem;
    transition: all 0.3s ease;
  }

  .search-box input:focus {
    outline: none;
    border-color: rgba(102, 126, 234, 0.5);
    background: rgba(255, 255, 255, 0.08);
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  .category-tabs {
    display: flex;
    gap: 0.5rem;
    padding: 1rem;
    background: var(--bg-secondary, #1a1a2e);
    overflow-x: auto;
    border-bottom: 1px solid var(--border-primary, rgba(255, 255, 255, 0.1));
  }

  .category-tab {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: var(--text-muted, #a0aec0);
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    white-space: nowrap;
  }

  .category-tab:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(102, 126, 234, 0.3);
    transform: translateY(-2px);
  }

  .category-tab.active {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-color: transparent;
    color: #ffffff;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  }

  .tab-icon {
    font-size: 1.25rem;
  }

  .stickers-grid {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 1.5rem;
    padding: 2rem;
    padding-bottom: 3rem;
    overflow-y: auto;
  }

  .sticker-item {
    position: relative;
    aspect-ratio: 1;
    background: var(--bg-tertiary, #16213e);
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    cursor: grab;
    transition: all 0.3s ease;
  }

  .sticker-item:active {
    cursor: grabbing;
  }

  .sticker-item:hover {
    transform: scale(1.1);
    border-color: rgba(102, 126, 234, 0.5);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
    z-index: 10;
  }

  .sticker-item.selected {
    border-color: #667eea;
    background: rgba(102, 126, 234, 0.1);
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
  }

  .sticker-item.premium {
    border-color: rgba(255, 215, 0, 0.3);
  }

  .premium-badge {
    position: absolute;
    top: 0.25rem;
    right: 0.25rem;
    background: linear-gradient(135deg, #ffd700 0%, #ff8c00 100%);
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    box-shadow: 0 2px 8px rgba(255, 215, 0, 0.4);
  }

  .sticker-content {
    font-size: 4rem;
    line-height: 1;
    user-select: none;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
  }

  .sticker-name {
    font-size: 0.9rem;
    color: var(--text-muted, #cbd5e0);
    text-align: center;
    font-weight: 500;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    color: var(--text-muted, #a0aec0);
    text-align: center;
  }

  .empty-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  .empty-state p {
    margin: 0.5rem 0;
    font-size: 1.1rem;
    font-weight: 600;
  }

  .empty-state small {
    font-size: 0.9rem;
    opacity: 0.7;
  }

  .sticker-preview {
    position: absolute;
    bottom: 1rem;
    right: 1rem;
    width: 250px;
    background: var(--bg-tertiary, #16213e);
    border: 2px solid rgba(102, 126, 234, 0.5);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    overflow: hidden;
    z-index: 100;
    animation: slideUp 0.3s ease;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: rgba(102, 126, 234, 0.1);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .preview-header h4 {
    margin: 0;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-primary, #ffffff);
  }

  .close-preview {
    background: transparent;
    border: none;
    color: var(--text-muted, #a0aec0);
    font-size: 1.25rem;
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: all 0.2s ease;
  }

  .close-preview:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--text-primary, #ffffff);
  }

  .preview-content {
    padding: 1rem;
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .preview-sticker {
    font-size: 4rem;
    line-height: 1;
  }

  .preview-info h5 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    color: var(--text-primary, #ffffff);
  }

  .preview-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
  }

  .tag {
    padding: 0.25rem 0.5rem;
    background: rgba(102, 126, 234, 0.2);
    border-radius: 4px;
    font-size: 0.7rem;
    color: var(--text-muted, #a0aec0);
  }

  .preview-hint {
    padding: 0.75rem 1rem;
    background: rgba(102, 126, 234, 0.1);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    font-size: 0.8rem;
    color: var(--text-muted, #a0aec0);
    line-height: 1.4;
  }

  .preview-hint strong {
    color: var(--text-primary, #ffffff);
  }

  /* Scrollbar styling */
  .stickers-grid::-webkit-scrollbar,
  .category-tabs::-webkit-scrollbar {
    height: 8px;
    width: 8px;
  }

  .stickers-grid::-webkit-scrollbar-track,
  .category-tabs::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
  }

  .stickers-grid::-webkit-scrollbar-thumb,
  .category-tabs::-webkit-scrollbar-thumb {
    background: rgba(102, 126, 234, 0.5);
    border-radius: 4px;
  }

  .stickers-grid::-webkit-scrollbar-thumb:hover,
  .category-tabs::-webkit-scrollbar-thumb:hover {
    background: rgba(102, 126, 234, 0.7);
  }

  /* Responsive */
  @media (max-width: 768px) {
    .stickers-grid {
      grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
      gap: 0.75rem;
      padding: 1rem;
    }

    .library-header {
      padding: 1rem;
    }

    .category-tabs {
      padding: 0.75rem;
    }

    .tab-name {
      display: none;
    }

    .tab-icon {
      font-size: 1.5rem;
    }

    .sticker-preview {
      width: calc(100% - 2rem);
      left: 1rem;
      right: 1rem;
    }

    .sticker-content {
      font-size: 2.5rem;
    }
  }
</style>
