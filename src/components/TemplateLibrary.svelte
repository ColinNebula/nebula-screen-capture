<script>
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  let searchQuery = '';
  let activeCategory = 'all';
  
  const templates = [
    // Intro Templates
    {
      id: 'intro-modern',
      name: 'Modern Intro',
      category: 'intros',
      thumbnail: '🎬',
      duration: 5,
      description: 'Sleek animated intro with logo reveal',
      premium: false,
      style: {
        animation: 'fadeInScale',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        textColor: '#ffffff'
      }
    },
    {
      id: 'intro-minimal',
      name: 'Minimal Intro',
      category: 'intros',
      thumbnail: '✨',
      duration: 3,
      description: 'Clean and minimal text animation',
      premium: false,
      style: {
        animation: 'slideIn',
        background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
        textColor: '#ffffff'
      }
    },
    {
      id: 'intro-tech',
      name: 'Tech Intro',
      category: 'intros',
      thumbnail: '💻',
      duration: 4,
      description: 'Futuristic tech-themed intro',
      premium: true,
      style: {
        animation: 'glitch',
        background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
        textColor: '#00ff88'
      }
    },
    
    // Outro Templates
    {
      id: 'outro-subscribe',
      name: 'Subscribe Outro',
      category: 'outros',
      thumbnail: '👍',
      duration: 5,
      description: 'Call-to-action subscribe screen',
      premium: false,
      style: {
        animation: 'bounceIn',
        background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
        textColor: '#ffffff'
      }
    },
    {
      id: 'outro-thanks',
      name: 'Thanks Outro',
      category: 'outros',
      thumbnail: '🙏',
      duration: 4,
      description: 'Thank you for watching screen',
      premium: false,
      style: {
        animation: 'fadeIn',
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        textColor: '#ffffff'
      }
    },
    {
      id: 'outro-social',
      name: 'Social Media Outro',
      category: 'outros',
      thumbnail: '📱',
      duration: 6,
      description: 'Multi-platform social media links',
      premium: true,
      style: {
        animation: 'slideUp',
        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        textColor: '#ffffff'
      }
    },
    
    // Lower Thirds
    {
      id: 'lower-third-basic',
      name: 'Basic Lower Third',
      category: 'lower-thirds',
      thumbnail: '📝',
      duration: 0,
      description: 'Simple name and title display',
      premium: false,
      style: {
        position: 'bottom-left',
        background: 'rgba(0, 0, 0, 0.8)',
        textColor: '#ffffff'
      }
    },
    {
      id: 'lower-third-modern',
      name: 'Modern Lower Third',
      category: 'lower-thirds',
      thumbnail: '🎨',
      duration: 0,
      description: 'Stylish animated lower third',
      premium: false,
      style: {
        position: 'bottom-left',
        background: 'linear-gradient(90deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%)',
        textColor: '#ffffff'
      }
    },
    {
      id: 'lower-third-premium',
      name: 'Premium Lower Third',
      category: 'lower-thirds',
      thumbnail: '💎',
      duration: 0,
      description: 'Elegant animated lower third with icons',
      premium: true,
      style: {
        position: 'bottom-left',
        background: 'linear-gradient(90deg, rgba(255, 107, 107, 0.9) 0%, rgba(238, 90, 111, 0.9) 100%)',
        textColor: '#ffffff'
      }
    },
    
    // Transitions
    {
      id: 'transition-fade',
      name: 'Fade Transition',
      category: 'transitions',
      thumbnail: '🌫️',
      duration: 1,
      description: 'Smooth fade in/out',
      premium: false,
      effect: 'fade'
    },
    {
      id: 'transition-wipe',
      name: 'Wipe Transition',
      category: 'transitions',
      thumbnail: '➡️',
      duration: 1,
      description: 'Directional wipe effect',
      premium: false,
      effect: 'wipe'
    },
    {
      id: 'transition-zoom',
      name: 'Zoom Transition',
      category: 'transitions',
      thumbnail: '🔍',
      duration: 0.8,
      description: 'Dynamic zoom effect',
      premium: true,
      effect: 'zoom'
    },
    
    // Text Templates
    {
      id: 'text-title-card',
      name: 'Title Card',
      category: 'text',
      thumbnail: '📄',
      duration: 3,
      description: 'Bold title card with subtitle',
      premium: false,
      style: {
        fontSize: '72px',
        fontWeight: 'bold',
        textAlign: 'center',
        textColor: '#ffffff'
      }
    },
    {
      id: 'text-quote',
      name: 'Quote Box',
      category: 'text',
      thumbnail: '💬',
      duration: 4,
      description: 'Stylized quote display',
      premium: false,
      style: {
        fontSize: '48px',
        fontStyle: 'italic',
        textAlign: 'center',
        textColor: '#ffffff'
      }
    },
    {
      id: 'text-animated',
      name: 'Animated Text',
      category: 'text',
      thumbnail: '✍️',
      duration: 3,
      description: 'Typewriter or reveal animation',
      premium: true,
      style: {
        animation: 'typewriter',
        fontSize: '56px',
        textColor: '#ffffff'
      }
    }
  ];
  
  const categories = [
    { id: 'all', name: 'All Templates', icon: '🎯' },
    { id: 'intros', name: 'Intros', icon: '🎬' },
    { id: 'outros', name: 'Outros', icon: '🎪' },
    { id: 'lower-thirds', name: 'Lower Thirds', icon: '📝' },
    { id: 'transitions', name: 'Transitions', icon: '🌀' },
    { id: 'text', name: 'Text', icon: '✍️' }
  ];
  
  $: filteredTemplates = templates.filter(template => {
    const matchesSearch = searchQuery === '' || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || template.category === activeCategory;
    return matchesSearch && matchesCategory;
  });
  
  $: console.log('TemplateLibrary - Showing', filteredTemplates.length, 'templates');
  
  function selectTemplate(template) {
    console.log('TemplateLibrary - Select clicked:', template.name);
    dispatch('select', template);
  }
  
  function previewTemplate(template) {
    console.log('TemplateLibrary - Preview clicked:', template.name);
    dispatch('preview', template);
  }
</script>

<div class="template-library">
  <div class="library-header">
    <h3>
      <span class="icon">📚</span>
      Template Library
    </h3>
    <div class="search-box">
      <span class="search-icon">🔍</span>
      <input
        type="text"
        placeholder="Search templates..."
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

  <div class="templates-grid">
    {#each filteredTemplates as template (template.id)}
      <div class="template-card" class:premium={template.premium}>
        {#if template.premium}
          <div class="premium-badge">
            <span>👑 PRO</span>
          </div>
        {/if}
        
        <div class="template-thumbnail">
          <div class="thumbnail-icon">{template.thumbnail}</div>
          {#if template.duration > 0}
            <div class="duration-badge">{template.duration}s</div>
          {/if}
        </div>
        
        <div class="template-info">
          <h4 class="template-name">{template.name}</h4>
          <p class="template-description">{template.description}</p>
        </div>
        
        <div class="template-actions">
          <button
            class="action-btn preview-btn"
            on:click={() => previewTemplate(template)}
            title="Preview"
          >
            <span>👁️</span>
            Preview
          </button>
          <button
            class="action-btn use-btn"
            on:click={() => selectTemplate(template)}
            title="Use Template"
          >
            <span>✨</span>
            Use
          </button>
        </div>
      </div>
    {/each}
  </div>

  {#if filteredTemplates.length === 0}
    <div class="empty-state">
      <div class="empty-icon">🔍</div>
      <p>No templates found</p>
      <small>Try adjusting your search or category filter</small>
    </div>
  {/if}
</div>

<style>
  .template-library {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--bg-secondary, #1a1a2e);
    border-radius: 12px;
    overflow: hidden;
  }

  .library-header {
    padding: 0.75rem 1.25rem;
    background: var(--bg-tertiary, #16213e);
    border-bottom: 2px solid var(--border-primary, rgba(255, 255, 255, 0.1));
  }

  .library-header h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text-primary, #ffffff);
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .icon {
    font-size: 1.5rem;
  }

  .search-box {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-icon {
    position: absolute;
    left: 0.65rem;
    font-size: 0.9rem;
    pointer-events: none;
  }

  .search-box input {
    width: 100%;
    padding: 0.4rem 0.65rem 0.4rem 2.25rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: var(--text-primary, #ffffff);
    font-size: 0.85rem;
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

  .templates-grid {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
    padding: 1.5rem;
    padding-bottom: 3rem;
    overflow-y: auto;
    overflow-x: hidden;
    min-height: 0;
    align-content: start;
    grid-auto-rows: max-content;
  }

  .template-card {
    position: relative;
    background: var(--bg-tertiary, #16213e);
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    min-height: 380px;
    height: auto;
  }

  .template-card:hover {
    transform: translateY(-4px);
    border-color: rgba(102, 126, 234, 0.5);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  }

  .template-card.premium {
    border-color: rgba(255, 215, 0, 0.3);
  }

  .premium-badge {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    background: linear-gradient(135deg, #ffd700 0%, #ff8c00 100%);
    color: #000;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 700;
    z-index: 2;
    box-shadow: 0 2px 8px rgba(255, 215, 0, 0.4);
  }

  .template-thumbnail {
    position: relative;
    height: 180px;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.25) 0%, rgba(118, 75, 162, 0.25) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid rgba(102, 126, 234, 0.2);
  }

  .thumbnail-icon {
    font-size: 5rem;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
  }

  .duration-badge {
    position: absolute;
    bottom: 0.5rem;
    right: 0.5rem;
    background: rgba(0, 0, 0, 0.8);
    color: #ffffff;
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .template-info {
    padding: 1rem;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .template-name {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text-primary, #ffffff);
  }

  .template-description {
    margin: 0;
    font-size: 0.9rem;
    color: var(--text-muted, #cbd5e0);
    line-height: 1.5;
    flex: 1;
  }

  .template-actions {
    display: flex;
    gap: 0.5rem;
    padding: 0 1rem 1rem 1rem;
    margin-top: auto;
  }

  .action-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem;
    border: none;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    pointer-events: auto;
  }

  .preview-btn {
    background: rgba(255, 255, 255, 0.05);
    color: var(--text-primary, #ffffff);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .preview-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.3);
  }

  .preview-btn:active {
    transform: scale(0.95);
  }

  .use-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #ffffff;
    border: none;
  }

  .use-btn:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  }

  .use-btn:active {
    transform: scale(0.98);
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

  /* Scrollbar styling */
  .templates-grid::-webkit-scrollbar,
  .category-tabs::-webkit-scrollbar {
    height: 8px;
    width: 8px;
  }

  .templates-grid::-webkit-scrollbar-track,
  .category-tabs::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
  }

  .templates-grid::-webkit-scrollbar-thumb,
  .category-tabs::-webkit-scrollbar-thumb {
    background: rgba(102, 126, 234, 0.5);
    border-radius: 4px;
  }

  .templates-grid::-webkit-scrollbar-thumb:hover,
  .category-tabs::-webkit-scrollbar-thumb:hover {
    background: rgba(102, 126, 234, 0.7);
  }

  /* Responsive */
  @media (max-width: 768px) {
    .templates-grid {
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 1rem;
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
  }
</style>
