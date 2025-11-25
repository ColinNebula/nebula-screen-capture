<script>
  export let show = false;
  export let onClose = () => {};

  let activeHelpTab = 'quickstart';
  let searchQuery = '';
  let expandedSections = new Set(['basics']);

  const tutorials = {
    quickstart: {
      title: '🚀 Quick Start Guide',
      icon: '🎬',
      sections: [
        {
          id: 'basics',
          title: 'Getting Started',
          items: [
            {
              title: '1. Import Your Video',
              description: 'Click "Add Media" or drag and drop video files into the Media Bin',
              tips: ['Supports MP4, WebM, MOV, AVI, MKV, OGG formats', 'Audio: MP3, WAV, AAC, FLAC, OGG, M4A, Opus', 'Images: PNG, JPG, GIF, WebP, BMP, TIFF', 'Maximum file size: 2GB']
            },
            {
              title: '2. Add to Timeline',
              description: 'Drag media from the Media Bin to the timeline tracks',
              tips: ['Video goes on video tracks', 'Audio goes on audio tracks', 'Images can be used as overlays']
            },
            {
              title: '3. Edit Your Video',
              description: 'Use the tools to trim, add effects, and enhance your video',
              tips: ['Drag clip edges to trim', 'Click clips to select and edit', 'Use properties panel for detailed adjustments']
            },
            {
              title: '4. Export',
              description: 'Click Export when done to save your edited video',
              tips: ['Choose quality preset', 'Select format (MP4 recommended)', 'Wait for processing to complete']
            }
          ]
        }
      ]
    },
    timeline: {
      title: '⏱️ Timeline Editing',
      icon: '🎞️',
      sections: [
        {
          id: 'timeline-basics',
          title: 'Timeline Basics',
          items: [
            {
              title: 'Adding Clips',
              description: 'Drag media from Media Bin to timeline tracks',
              tips: ['Multiple tracks for layering', 'Video tracks stack on top', 'Audio tracks mix together']
            },
            {
              title: 'Moving Clips',
              description: 'Click and drag clips to reposition them',
              tips: ['Hold Shift to snap to other clips', 'Drag between tracks to change layers']
            },
            {
              title: 'Trimming Clips',
              description: 'Drag the edges of clips to trim start/end points',
              tips: ['Left edge: trim start', 'Right edge: trim end', 'Middle: move entire clip']
            },
            {
              title: 'Splitting Clips',
              description: 'Click the scissors icon or use keyboard shortcut',
              tips: ['Position playhead where you want to split', 'Press S key for quick split', 'Creates two independent clips']
            }
          ]
        },
        {
          id: 'timeline-advanced',
          title: 'Advanced Timeline',
          items: [
            {
              title: 'Multiple Tracks',
              description: 'Use unlimited video and audio tracks for complex editing',
              tips: ['Supports up to 100 tracks total', 'Video: 🎬 Main, ✨ Overlays', 'Audio: 🎤 Dialog, 🎵 Music, 🔊 SFX', 'Effects: ⚡ FX layer', 'Color-coded track groups', 'Top video tracks appear in front', 'All audio tracks mix together']
            },
            {
              title: 'Zoom & Pan',
              description: 'Navigate large timelines efficiently',
              tips: ['Scroll wheel to zoom', 'Drag timeline to pan', 'Fit All button to see everything']
            },
            {
              title: 'Playhead Control',
              description: 'Precise navigation through your video',
              tips: ['Click timeline to jump', 'Arrow keys to step frame-by-frame', 'Space bar to play/pause']
            }
          ]
        }
      ]
    },
    effects: {
      title: '✨ Filters & Effects',
      icon: '🎨',
      sections: [
        {
          id: 'color',
          title: 'Color Correction',
          items: [
            {
              title: 'Basic Adjustments',
              description: 'Brightness, Contrast, Saturation controls',
              tips: ['Start with brightness and contrast', 'Adjust saturation last', 'Use presets as starting points']
            },
            {
              title: 'Temperature & Tint',
              description: 'Adjust color temperature for cinematic looks',
              tips: ['Warm (+): orange/yellow tones', 'Cool (-): blue tones', 'Tint adjusts green/magenta balance']
            },
            {
              title: 'Exposure & Vibrance',
              description: 'Professional color grading tools',
              tips: ['Exposure: overall brightness', 'Vibrance: selective saturation boost', 'Clarity: sharpness and detail']
            },
            {
              title: 'Channel Mixer',
              description: 'Fine-tune individual RGB channels',
              tips: ['Red channel: skin tones', 'Green channel: foliage', 'Blue channel: sky and water']
            }
          ]
        },
        {
          id: 'creative',
          title: 'Creative Effects',
          items: [
            {
              title: 'Film Effects',
              description: 'Add cinematic grain and bleach bypass',
              tips: ['Film grain: vintage film look', 'Bleach bypass: desaturated, contrasty', 'Combine for unique styles']
            },
            {
              title: 'Artistic Filters',
              description: 'Sepia, grayscale, invert, posterize',
              tips: ['Sepia: vintage photo look', 'Grayscale: black and white', 'Posterize: reduce colors for artistic effect']
            },
            {
              title: 'LUT (Color Grading)',
              description: 'Professional color lookup tables',
              tips: ['Enable LUT in properties', 'Choose from presets', 'Creates film-like color grades']
            }
          ]
        }
      ]
    },
    transitions: {
      title: '🎬 Transitions',
      icon: '↔️',
      sections: [
        {
          id: 'transition-basics',
          title: 'Adding Transitions',
          items: [
            {
              title: 'Apply Transition',
              description: 'Add smooth transitions between clips',
              tips: ['Select clip in timeline', 'Choose transition type', 'Adjust duration in properties']
            },
            {
              title: 'Transition Types',
              description: 'Fade, dissolve, wipe, zoom, and more',
              tips: ['Fade: smooth opacity change', 'Dissolve: gradual blend', 'Wipe: directional reveal']
            },
            {
              title: 'Custom Duration',
              description: 'Control how long transitions last',
              tips: ['0.5s: quick cuts', '1-2s: standard', '3s+: dramatic effect']
            }
          ]
        }
      ]
    },
    audio: {
      title: '🎵 Audio Editing',
      icon: '🔊',
      sections: [
        {
          id: 'audio-basics',
          title: 'Audio Controls',
          items: [
            {
              title: 'Volume Control',
              description: 'Adjust audio levels for each clip',
              tips: ['0-100%: normal range', 'Use fade in/out for smooth transitions', 'Balance multiple audio tracks']
            },
            {
              title: 'Audio Ducking',
              description: 'Automatically lower background music during speech',
              tips: ['Enable in audio properties', 'Adjust ducking amount', 'Perfect for voiceovers']
            },
            {
              title: 'Audio Effects',
              description: 'Apply reverb, echo, and audio filters',
              tips: ['Normalize: balance volume', 'Bass boost: enhance low frequencies', 'Reverb: add space and depth']
            }
          ]
        }
      ]
    },
    export: {
      title: '📤 Exporting',
      icon: '💾',
      sections: [
        {
          id: 'export-settings',
          title: 'Export Settings',
          items: [
            {
              title: 'Quality Presets',
              description: 'Choose the right quality for your needs',
              tips: ['High: 1080p, best quality', 'Medium: 720p, balanced', 'Low: 480p, smaller files']
            },
            {
              title: 'Format Selection',
              description: 'Choose output format',
              tips: ['MP4: best compatibility', 'WebM: web optimized', 'MOV: high quality, large files']
            },
            {
              title: 'Custom Settings',
              description: 'Advanced export options',
              tips: ['Bitrate: quality vs file size', 'Frame rate: match source', 'Resolution: output dimensions']
            }
          ]
        }
      ]
    },
    keyboard: {
      title: '⌨️ Keyboard Shortcuts',
      icon: '🎹',
      sections: [
        {
          id: 'playback',
          title: 'Playback Controls',
          items: [
            {
              title: 'Space',
              description: 'Play/Pause',
              tips: []
            },
            {
              title: 'J / L',
              description: 'Rewind / Fast Forward',
              tips: []
            },
            {
              title: 'Arrow Left/Right',
              description: 'Previous/Next Frame',
              tips: []
            },
            {
              title: 'Home / End',
              description: 'Jump to Start/End',
              tips: []
            }
          ]
        },
        {
          id: 'editing',
          title: 'Editing Shortcuts',
          items: [
            {
              title: 'S',
              description: 'Split clip at playhead',
              tips: []
            },
            {
              title: 'Delete',
              description: 'Remove selected clip',
              tips: []
            },
            {
              title: 'Ctrl+Z / Ctrl+Y',
              description: 'Undo / Redo',
              tips: []
            },
            {
              title: 'Ctrl+D',
              description: 'Duplicate clip',
              tips: []
            }
          ]
        }
      ]
    },
    tips: {
      title: '💡 Pro Tips',
      icon: '🌟',
      sections: [
        {
          id: 'workflow',
          title: 'Workflow Tips',
          items: [
            {
              title: 'Organize Your Media',
              description: 'Keep media bin organized before editing',
              tips: ['Name files descriptively', 'Group similar clips', 'Delete unused media']
            },
            {
              title: 'Work Non-Destructively',
              description: 'Original files are never modified',
              tips: ['All edits are virtual', 'Original videos remain intact', 'Can undo any change']
            },
            {
              title: 'Save Often',
              description: 'Save your project regularly',
              tips: ['Auto-save every 5 minutes', 'Manual save: Ctrl+S', 'Project files are small']
            },
            {
              title: 'Preview Before Export',
              description: 'Watch your entire edit before exporting',
              tips: ['Check for mistakes', 'Verify transitions', 'Listen to audio levels']
            }
          ]
        },
        {
          id: 'performance',
          title: 'Performance Tips',
          items: [
            {
              title: 'Close Unused Tabs',
              description: 'Better performance with fewer properties open',
              tips: ['Close panels you\'re not using', 'Reduces memory usage', 'Smoother playback']
            },
            {
              title: 'Limit Track Count',
              description: 'Use only the tracks you need',
              tips: ['More tracks = more processing', 'Merge clips when possible', 'Delete empty tracks']
            },
            {
              title: 'Optimize Media',
              description: 'Convert large files before importing',
              tips: ['MP4 H.264 works best', 'Lower resolution for editing', 'Transcode 4K to 1080p']
            }
          ]
        }
      ]
    }
  };

  function toggleSection(sectionId) {
    if (expandedSections.has(sectionId)) {
      expandedSections.delete(sectionId);
    } else {
      expandedSections.add(sectionId);
    }
    expandedSections = expandedSections;
  }

  function handleClose() {
    show = false;
    onClose();
  }

  $: filteredTutorials = searchQuery ? filterTutorials(searchQuery) : tutorials;

  function filterTutorials(query) {
    const lowerQuery = query.toLowerCase();
    const filtered = {};
    
    Object.entries(tutorials).forEach(([key, tutorial]) => {
      const matchingSections = tutorial.sections.filter(section => {
        const sectionMatches = section.title.toLowerCase().includes(lowerQuery);
        const itemMatches = section.items.some(item => 
          item.title.toLowerCase().includes(lowerQuery) ||
          item.description.toLowerCase().includes(lowerQuery)
        );
        return sectionMatches || itemMatches;
      });

      if (matchingSections.length > 0) {
        filtered[key] = {
          ...tutorial,
          sections: matchingSections
        };
      }
    });

    return filtered;
  }
</script>

{#if show}
  <div class="help-modal-overlay" on:click={handleClose}>
    <div class="help-modal" on:click|stopPropagation>
      <div class="help-header">
        <div class="help-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <h2>Help & Support</h2>
        </div>
        <button class="close-btn" on:click={handleClose}>×</button>
      </div>

      <div class="help-content">
        <!-- Search Bar -->
        <div class="search-bar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input 
            type="text" 
            placeholder="Search tutorials..." 
            bind:value={searchQuery}
          />
        </div>

        <div class="help-body">
          <!-- Tabs Sidebar -->
          <div class="help-tabs">
            {#each Object.entries(tutorials) as [key, tutorial]}
              <button 
                class="help-tab"
                class:active={activeHelpTab === key}
                on:click={() => activeHelpTab = key}
              >
                <span class="tab-icon">{tutorial.icon}</span>
                <span class="tab-label">{tutorial.title}</span>
              </button>
            {/each}
          </div>

          <!-- Tutorial Content -->
          <div class="tutorial-content">
            {#if filteredTutorials[activeHelpTab]}
              <div class="tutorial-header">
                <h3>{filteredTutorials[activeHelpTab].title}</h3>
              </div>

              {#each filteredTutorials[activeHelpTab].sections as section}
                <div class="tutorial-section">
                  <button 
                    class="section-header"
                    class:expanded={expandedSections.has(section.id)}
                    on:click={() => toggleSection(section.id)}
                  >
                    <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                    <h4>{section.title}</h4>
                  </button>

                  {#if expandedSections.has(section.id)}
                    <div class="section-content">
                      {#each section.items as item}
                        <div class="tutorial-item">
                          <h5>{item.title}</h5>
                          <p>{item.description}</p>
                          {#if item.tips && item.tips.length > 0}
                            <ul class="tips-list">
                              {#each item.tips as tip}
                                <li>💡 {tip}</li>
                              {/each}
                            </ul>
                          {/if}
                        </div>
                      {/each}
                    </div>
                  {/if}
                </div>
              {/each}
            {:else}
              <div class="no-results">
                <p>No tutorials found matching "{searchQuery}"</p>
                <p class="hint">Try different keywords or browse categories</p>
              </div>
            {/if}
          </div>
        </div>
      </div>

      <div class="help-footer">
        <div class="footer-links">
          <a href="https://nebula3d.dev/docs" target="_blank" rel="noopener">📚 Full Documentation</a>
          <a href="https://nebula3d.dev/support" target="_blank" rel="noopener">💬 Contact Support</a>
          <a href="https://nebula3d.dev/community" target="_blank" rel="noopener">👥 Community</a>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .help-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.9);
    backdrop-filter: blur(5px);
    z-index: 2147483647;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    animation: fadeIn 0.2s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .help-modal {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    border-radius: 16px;
    width: 90vw;
    max-width: 1000px;
    height: 85vh;
    max-height: 800px;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    animation: slideUp 0.3s ease-out;
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

  .help-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(0, 0, 0, 0.2);
  }

  .help-title {
    display: flex;
    align-items: center;
    gap: 12px;
    color: white;
  }

  .help-title svg {
    width: 28px;
    height: 28px;
    color: #667eea;
  }

  .help-title h2 {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
  }

  .close-btn {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: white;
    font-size: 32px;
    width: 40px;
    height: 40px;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    line-height: 1;
    padding: 0;
  }

  .close-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: rotate(90deg);
  }

  .help-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .search-bar {
    padding: 16px 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(0, 0, 0, 0.2);
  }

  .search-bar svg {
    width: 20px;
    height: 20px;
    color: #888;
    flex-shrink: 0;
  }

  .search-bar input {
    flex: 1;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 10px 14px;
    color: white;
    font-size: 14px;
  }

  .search-bar input::placeholder {
    color: #888;
  }

  .search-bar input:focus {
    outline: none;
    border-color: #667eea;
    background: rgba(255, 255, 255, 0.08);
  }

  .help-body {
    flex: 1;
    display: flex;
    overflow: hidden;
  }

  .help-tabs {
    width: 220px;
    border-right: 1px solid rgba(255, 255, 255, 0.1);
    overflow-y: auto;
    background: rgba(0, 0, 0, 0.2);
  }

  .help-tab {
    width: 100%;
    background: transparent;
    border: none;
    padding: 14px 20px;
    text-align: left;
    color: #b8b8d1;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 12px;
    transition: all 0.2s;
    border-left: 3px solid transparent;
  }

  .help-tab:hover {
    background: rgba(102, 126, 234, 0.1);
    color: white;
  }

  .help-tab.active {
    background: rgba(102, 126, 234, 0.2);
    color: white;
    border-left-color: #667eea;
  }

  .tab-icon {
    font-size: 20px;
  }

  .tab-label {
    font-size: 13px;
    font-weight: 500;
  }

  .tutorial-content {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
  }

  .tutorial-header h3 {
    margin: 0 0 20px 0;
    font-size: 20px;
    color: white;
  }

  .tutorial-section {
    margin-bottom: 16px;
  }

  .section-header {
    width: 100%;
    background: rgba(102, 126, 234, 0.1);
    border: 1px solid rgba(102, 126, 234, 0.2);
    border-radius: 8px;
    padding: 12px 16px;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 10px;
    transition: all 0.2s;
  }

  .section-header:hover {
    background: rgba(102, 126, 234, 0.15);
    border-color: rgba(102, 126, 234, 0.3);
  }

  .section-header .chevron {
    width: 16px;
    height: 16px;
    transition: transform 0.2s;
  }

  .section-header.expanded .chevron {
    transform: rotate(90deg);
  }

  .section-header h4 {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
  }

  .section-content {
    padding: 16px;
    animation: expandSection 0.2s ease-out;
  }

  @keyframes expandSection {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .tutorial-item {
    margin-bottom: 20px;
    padding-bottom: 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  .tutorial-item:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }

  .tutorial-item h5 {
    margin: 0 0 8px 0;
    font-size: 14px;
    color: #667eea;
    font-weight: 600;
  }

  .tutorial-item p {
    margin: 0 0 12px 0;
    color: #b8b8d1;
    font-size: 13px;
    line-height: 1.6;
  }

  .tips-list {
    margin: 12px 0 0 0;
    padding-left: 0;
    list-style: none;
  }

  .tips-list li {
    color: #888;
    font-size: 12px;
    margin: 6px 0;
    padding-left: 24px;
    position: relative;
  }

  .no-results {
    text-align: center;
    padding: 60px 20px;
  }

  .no-results p {
    color: #888;
    font-size: 16px;
    margin: 10px 0;
  }

  .no-results .hint {
    font-size: 14px;
    color: #666;
  }

  .help-footer {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding: 16px 24px;
    background: rgba(0, 0, 0, 0.3);
  }

  .footer-links {
    display: flex;
    justify-content: center;
    gap: 24px;
    flex-wrap: wrap;
  }

  .footer-links a {
    color: #667eea;
    text-decoration: none;
    font-size: 14px;
    transition: color 0.2s;
  }

  .footer-links a:hover {
    color: #764ba2;
  }

  /* Scrollbar styling */
  .help-tabs::-webkit-scrollbar,
  .tutorial-content::-webkit-scrollbar {
    width: 8px;
  }

  .help-tabs::-webkit-scrollbar-track,
  .tutorial-content::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
  }

  .help-tabs::-webkit-scrollbar-thumb,
  .tutorial-content::-webkit-scrollbar-thumb {
    background: rgba(102, 126, 234, 0.3);
    border-radius: 4px;
  }

  .help-tabs::-webkit-scrollbar-thumb:hover,
  .tutorial-content::-webkit-scrollbar-thumb:hover {
    background: rgba(102, 126, 234, 0.5);
  }

  /* Mobile responsive */
  @media (max-width: 768px) {
    .help-modal {
      width: 100vw;
      height: 100vh;
      max-width: none;
      max-height: none;
      border-radius: 0;
    }

    .help-body {
      flex-direction: column;
    }

    .help-tabs {
      width: 100%;
      border-right: none;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      overflow-x: auto;
      overflow-y: hidden;
      display: flex;
      flex-wrap: nowrap;
    }

    .help-tab {
      flex-shrink: 0;
      border-left: none;
      border-bottom: 3px solid transparent;
    }

    .help-tab.active {
      border-left-color: transparent;
      border-bottom-color: #667eea;
    }

    .footer-links {
      flex-direction: column;
      gap: 12px;
    }
  }
</style>
