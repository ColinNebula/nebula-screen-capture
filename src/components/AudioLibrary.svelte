<script>
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  let searchQuery = '';
  let activeCategory = 'all';
  let selectedAudio = null;
  let currentlyPlaying = null;
  let audioElement = null;
  let playbackProgress = 0;
  let volume = 70;
  
  const audioTracks = [
    // Background Music
    {
      id: 'music-upbeat-1',
      name: 'Upbeat Energy',
      category: 'music',
      subcategory: 'upbeat',
      duration: 120,
      bpm: 128,
      mood: 'energetic',
      premium: false,
      url: '/audio/upbeat-energy.mp3', // Placeholder
      tags: ['background', 'happy', 'commercial']
    },
    {
      id: 'music-chill-1',
      name: 'Chill Vibes',
      category: 'music',
      subcategory: 'chill',
      duration: 150,
      bpm: 90,
      mood: 'relaxed',
      premium: false,
      url: '/audio/chill-vibes.mp3',
      tags: ['background', 'calm', 'lofi']
    },
    {
      id: 'music-cinematic-1',
      name: 'Epic Journey',
      category: 'music',
      subcategory: 'cinematic',
      duration: 180,
      bpm: 110,
      mood: 'dramatic',
      premium: true,
      url: '/audio/epic-journey.mp3',
      tags: ['cinematic', 'trailer', 'orchestral']
    },
    {
      id: 'music-corporate-1',
      name: 'Corporate Success',
      category: 'music',
      subcategory: 'corporate',
      duration: 135,
      bpm: 120,
      mood: 'professional',
      premium: false,
      url: '/audio/corporate-success.mp3',
      tags: ['business', 'presentation', 'motivational']
    },
    {
      id: 'music-tech-1',
      name: 'Digital Future',
      category: 'music',
      subcategory: 'tech',
      duration: 140,
      bpm: 125,
      mood: 'futuristic',
      premium: true,
      url: '/audio/digital-future.mp3',
      tags: ['technology', 'electronic', 'modern']
    },
    {
      id: 'music-ambient-1',
      name: 'Peaceful Moments',
      category: 'music',
      subcategory: 'ambient',
      duration: 200,
      bpm: 70,
      mood: 'peaceful',
      premium: false,
      url: '/audio/peaceful-moments.mp3',
      tags: ['ambient', 'meditation', 'soft']
    },
    
    // Sound Effects
    {
      id: 'sfx-whoosh-1',
      name: 'Whoosh',
      category: 'sfx',
      subcategory: 'transition',
      duration: 1.5,
      premium: false,
      url: '/audio/whoosh.mp3',
      tags: ['transition', 'swipe', 'movement']
    },
    {
      id: 'sfx-click-1',
      name: 'UI Click',
      category: 'sfx',
      subcategory: 'ui',
      duration: 0.3,
      premium: false,
      url: '/audio/ui-click.mp3',
      tags: ['button', 'interface', 'click']
    },
    {
      id: 'sfx-notification-1',
      name: 'Notification',
      category: 'sfx',
      subcategory: 'ui',
      duration: 0.8,
      premium: false,
      url: '/audio/notification.mp3',
      tags: ['alert', 'ping', 'message']
    },
    {
      id: 'sfx-success-1',
      name: 'Success Chime',
      category: 'sfx',
      subcategory: 'feedback',
      duration: 1.2,
      premium: false,
      url: '/audio/success-chime.mp3',
      tags: ['win', 'complete', 'achievement']
    },
    {
      id: 'sfx-error-1',
      name: 'Error Beep',
      category: 'sfx',
      subcategory: 'feedback',
      duration: 0.5,
      premium: false,
      url: '/audio/error-beep.mp3',
      tags: ['fail', 'wrong', 'mistake']
    },
    {
      id: 'sfx-applause-1',
      name: 'Applause',
      category: 'sfx',
      subcategory: 'reaction',
      duration: 3,
      premium: false,
      url: '/audio/applause.mp3',
      tags: ['clap', 'crowd', 'celebration']
    },
    {
      id: 'sfx-drumroll-1',
      name: 'Drum Roll',
      category: 'sfx',
      subcategory: 'reaction',
      duration: 2.5,
      premium: true,
      url: '/audio/drumroll.mp3',
      tags: ['suspense', 'reveal', 'anticipation']
    },
    {
      id: 'sfx-pop-1',
      name: 'Pop',
      category: 'sfx',
      subcategory: 'ui',
      duration: 0.4,
      premium: false,
      url: '/audio/pop.mp3',
      tags: ['bubble', 'appear', 'show']
    },
    {
      id: 'sfx-glitch-1',
      name: 'Glitch',
      category: 'sfx',
      subcategory: 'tech',
      duration: 1,
      premium: true,
      url: '/audio/glitch.mp3',
      tags: ['digital', 'error', 'distortion']
    },
    {
      id: 'sfx-swoosh-1',
      name: 'Swoosh',
      category: 'sfx',
      subcategory: 'transition',
      duration: 1,
      premium: false,
      url: '/audio/swoosh.mp3',
      tags: ['fast', 'speed', 'fly']
    },
    
    // Voiceover Templates
    {
      id: 'vo-intro-1',
      name: 'Welcome Intro',
      category: 'voiceover',
      subcategory: 'intro',
      duration: 5,
      premium: true,
      url: '/audio/vo-welcome.mp3',
      tags: ['greeting', 'opening', 'professional']
    },
    {
      id: 'vo-cta-1',
      name: 'Call to Action',
      category: 'voiceover',
      subcategory: 'cta',
      duration: 3,
      premium: true,
      url: '/audio/vo-cta.mp3',
      tags: ['subscribe', 'like', 'follow']
    },
    {
      id: 'vo-outro-1',
      name: 'Thank You Outro',
      category: 'voiceover',
      subcategory: 'outro',
      duration: 4,
      premium: true,
      url: '/audio/vo-thanks.mp3',
      tags: ['closing', 'goodbye', 'thanks']
    }
  ];
  
  const categories = [
    { id: 'all', name: 'All Audio', icon: '🎵' },
    { id: 'music', name: 'Music', icon: '🎼' },
    { id: 'sfx', name: 'Sound Effects', icon: '🔊' },
    { id: 'voiceover', name: 'Voiceover', icon: '🎤' }
  ];
  
  $: filteredAudio = audioTracks.filter(track => {
    const matchesSearch = searchQuery === '' || 
      track.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = activeCategory === 'all' || track.category === activeCategory;
    return matchesSearch && matchesCategory;
  });
  
  function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  function playAudio(track) {
    if (currentlyPlaying?.id === track.id) {
      if (audioElement) {
        audioElement.pause();
        currentlyPlaying = null;
      }
    } else {
      if (audioElement) {
        audioElement.pause();
      }
      
      // In production, load actual audio file
      // For now, simulate playback
      currentlyPlaying = track;
      simulatePlayback();
    }
  }
  
  function simulatePlayback() {
    // Simulate audio playback for demonstration
    let elapsed = 0;
    const interval = setInterval(() => {
      if (!currentlyPlaying) {
        clearInterval(interval);
        return;
      }
      
      elapsed += 0.1;
      playbackProgress = (elapsed / currentlyPlaying.duration) * 100;
      
      if (elapsed >= currentlyPlaying.duration) {
        clearInterval(interval);
        currentlyPlaying = null;
        playbackProgress = 0;
      }
    }, 100);
  }
  
  function stopPlayback() {
    if (audioElement) {
      audioElement.pause();
    }
    currentlyPlaying = null;
    playbackProgress = 0;
  }
  
  function selectAudio(track) {
    selectedAudio = track;
    dispatch('select', {
      ...track,
      type: 'audio',
      volume: volume,
      startTime: 0,
      fadeIn: 1,
      fadeOut: 1
    });
  }
  
  function adjustVolume(value) {
    volume = value;
    if (audioElement) {
      audioElement.volume = volume / 100;
    }
  }
  
  onDestroy(() => {
    stopPlayback();
  });
</script>

<div class="audio-library">
  <div class="library-header">
    <h3>
      <span class="icon">🎵</span>
      Audio Library
    </h3>
    <div class="search-box">
      <span class="search-icon">🔍</span>
      <input
        type="text"
        placeholder="Search audio..."
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

  {#if currentlyPlaying}
    <div class="now-playing">
      <div class="now-playing-header">
        <span class="playing-icon">▶️</span>
        <div class="playing-info">
          <h4>{currentlyPlaying.name}</h4>
          <span class="playing-category">{currentlyPlaying.category}</span>
        </div>
        <button class="stop-btn" on:click={stopPlayback}>⏹</button>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: {playbackProgress}%"></div>
      </div>
    </div>
  {/if}

  <div class="audio-list">
    {#each filteredAudio as track (track.id)}
      <div class="audio-item" class:selected={selectedAudio?.id === track.id} class:premium={track.premium}>
        <div class="audio-main">
          <button
            class="play-btn"
            class:playing={currentlyPlaying?.id === track.id}
            on:click={() => playAudio(track)}
          >
            {currentlyPlaying?.id === track.id ? '⏸' : '▶️'}
          </button>
          
          <div class="audio-info">
            <div class="audio-title">
              <h4>{track.name}</h4>
              {#if track.premium}
                <span class="premium-badge">👑 PRO</span>
              {/if}
            </div>
            <div class="audio-meta">
              <span class="duration">⏱ {formatDuration(track.duration)}</span>
              {#if track.bpm}
                <span class="bpm">♪ {track.bpm} BPM</span>
              {/if}
              {#if track.mood}
                <span class="mood">😊 {track.mood}</span>
              {/if}
            </div>
            <div class="audio-tags">
              {#each track.tags.slice(0, 3) as tag}
                <span class="tag">#{tag}</span>
              {/each}
            </div>
          </div>
        </div>
        
        <div class="audio-actions">
          <button
            class="action-btn use-btn"
            on:click={() => selectAudio(track)}
            title="Add to timeline"
          >
            <span>➕</span>
            Add
          </button>
        </div>
      </div>
    {/each}
  </div>

  {#if filteredAudio.length === 0}
    <div class="empty-state">
      <div class="empty-icon">🔍</div>
      <p>No audio found</p>
      <small>Try adjusting your search or category filter</small>
    </div>
  {/if}

  {#if selectedAudio}
    <div class="audio-settings">
      <div class="settings-header">
        <h4>Audio Settings</h4>
        <button class="close-settings" on:click={() => selectedAudio = null}>✕</button>
      </div>
      
      <div class="settings-content">
        <div class="setting-group">
          <label>
            <span class="label-icon">🔊</span>
            <span class="label-text">Volume: {volume}%</span>
          </label>
          <input
            type="range"
            min="0"
            max="100"
            bind:value={volume}
            on:input={(e) => adjustVolume(e.target.value)}
            class="volume-slider"
          />
        </div>

        <div class="setting-info">
          <div class="info-row">
            <span class="info-label">Selected:</span>
            <span class="info-value">{selectedAudio.name}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Duration:</span>
            <span class="info-value">{formatDuration(selectedAudio.duration)}</span>
          </div>
          {#if selectedAudio.mood}
            <div class="info-row">
              <span class="info-label">Mood:</span>
              <span class="info-value">{selectedAudio.mood}</span>
            </div>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .audio-library {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--bg-secondary, #1a1a2e);
    border-radius: 12px;
    overflow: hidden;
    position: relative;
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

  .now-playing {
    padding: 1rem 1.5rem;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .now-playing-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 0.75rem;
  }

  .playing-icon {
    font-size: 1.5rem;
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .playing-info {
    flex: 1;
  }

  .playing-info h4 {
    margin: 0;
    font-size: 1rem;
    color: var(--text-primary, #ffffff);
    font-weight: 600;
  }

  .playing-category {
    font-size: 0.8rem;
    color: var(--text-muted, #a0aec0);
    text-transform: uppercase;
  }

  .stop-btn {
    background: rgba(255, 107, 107, 0.2);
    border: 1px solid rgba(255, 107, 107, 0.5);
    color: #ff6b6b;
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1rem;
    transition: all 0.3s ease;
  }

  .stop-btn:hover {
    background: rgba(255, 107, 107, 0.3);
    transform: scale(1.05);
  }

  .progress-bar {
    height: 4px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
    transition: width 0.1s linear;
  }

  .audio-list {
    flex: 1;
    overflow-y: auto;
    padding: 2rem;
    padding-bottom: 3rem;
  }

  .audio-item {
    background: var(--bg-tertiary, #16213e);
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 1.25rem;
    margin-bottom: 1rem;
    transition: all 0.3s ease;
  }

  .audio-item:hover {
    border-color: rgba(102, 126, 234, 0.5);
    transform: translateX(4px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  }

  .audio-item.selected {
    border-color: #667eea;
    background: rgba(102, 126, 234, 0.1);
  }

  .audio-item.premium {
    border-color: rgba(255, 215, 0, 0.3);
  }

  .audio-main {
    display: flex;
    gap: 1rem;
    margin-bottom: 0.75rem;
  }

  .play-btn {
    flex-shrink: 0;
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    border-radius: 50%;
    color: #ffffff;
    font-size: 1.25rem;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .play-btn:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.5);
  }

  .play-btn.playing {
    animation: pulse 1.5s ease-in-out infinite;
  }

  .audio-info {
    flex: 1;
    min-width: 0;
  }

  .audio-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .audio-title h4 {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--text-primary, #ffffff);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .premium-badge {
    flex-shrink: 0;
    background: linear-gradient(135deg, #ffd700 0%, #ff8c00 100%);
    color: #000;
    padding: 0.2rem 0.5rem;
    border-radius: 12px;
    font-size: 0.7rem;
    font-weight: 700;
  }

  .audio-meta {
    display: flex;
    gap: 1rem;
    margin-bottom: 0.5rem;
    font-size: 0.95rem;
    color: var(--text-muted, #cbd5e0);
  }

  .audio-meta span {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .audio-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
  }

  .tag {
    padding: 0.2rem 0.5rem;
    background: rgba(102, 126, 234, 0.2);
    border-radius: 4px;
    font-size: 0.7rem;
    color: var(--text-muted, #a0aec0);
  }

  .audio-actions {
    display: flex;
    gap: 0.5rem;
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
  }

  .use-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #ffffff;
  }

  .use-btn:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
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

  .audio-settings {
    position: absolute;
    bottom: 1rem;
    right: 1rem;
    width: 300px;
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

  .settings-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: rgba(102, 126, 234, 0.1);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .settings-header h4 {
    margin: 0;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-primary, #ffffff);
  }

  .close-settings {
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

  .close-settings:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--text-primary, #ffffff);
  }

  .settings-content {
    padding: 1rem;
  }

  .setting-group {
    margin-bottom: 1.5rem;
  }

  .setting-group label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.75rem;
    font-size: 0.9rem;
    color: var(--text-primary, #ffffff);
    font-weight: 500;
  }

  .label-icon {
    font-size: 1.2rem;
    margin-right: 0.5rem;
  }

  .volume-slider {
    width: 100%;
    height: 6px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
    outline: none;
    -webkit-appearance: none;
    appearance: none;
  }

  .volume-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    border-radius: 50%;
    cursor: pointer;
  }

  .volume-slider::-moz-range-thumb {
    width: 16px;
    height: 16px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    border-radius: 50%;
    cursor: pointer;
    border: none;
  }

  .setting-info {
    background: rgba(255, 255, 255, 0.03);
    border-radius: 8px;
    padding: 0.75rem;
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  .info-row:last-child {
    border-bottom: none;
  }

  .info-label {
    font-size: 0.8rem;
    color: var(--text-muted, #a0aec0);
  }

  .info-value {
    font-size: 0.8rem;
    color: var(--text-primary, #ffffff);
    font-weight: 600;
  }

  /* Scrollbar styling */
  .audio-list::-webkit-scrollbar,
  .category-tabs::-webkit-scrollbar {
    height: 8px;
    width: 8px;
  }

  .audio-list::-webkit-scrollbar-track,
  .category-tabs::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
  }

  .audio-list::-webkit-scrollbar-thumb,
  .category-tabs::-webkit-scrollbar-thumb {
    background: rgba(102, 126, 234, 0.5);
    border-radius: 4px;
  }

  .audio-list::-webkit-scrollbar-thumb:hover,
  .category-tabs::-webkit-scrollbar-thumb:hover {
    background: rgba(102, 126, 234, 0.7);
  }

  /* Responsive */
  @media (max-width: 768px) {
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

    .audio-settings {
      width: calc(100% - 2rem);
      left: 1rem;
      right: 1rem;
    }

    .audio-meta {
      flex-direction: column;
      gap: 0.25rem;
    }
  }
</style>
