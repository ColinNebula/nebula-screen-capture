<script>
  import './HelpSupportModal.css';

  export let onClose = () => {};

  let activeTab = 'faq';
  let searchQuery = '';

  const faqs = [
    {
      category: 'Getting Started',
      questions: [
        {
          q: 'How do I start recording?',
          a: 'Click the red "Start Recording" button, select the screen or window you want to capture, and click "Share". The recording will begin after a 3-second countdown.'
        },
        {
          q: 'Can I record my webcam along with my screen?',
          a: 'Yes! Enable the webcam option in the recording settings before starting your recording. You can position and resize the webcam overlay.'
        },
        {
          q: 'How do I take a screenshot?',
          a: 'Switch to the "Screenshot" tab and click the capture button. Select the area you want to capture and it will be saved to your library.'
        }
      ]
    },
    {
      category: 'Recording Settings',
      questions: [
        {
          q: 'What video quality should I use?',
          a: '1080p (Full HD) is recommended for most use cases. Use 720p for faster uploads or limited storage, and 4K for maximum quality.'
        },
        {
          q: 'How do I record system audio?',
          a: 'Enable "System Audio" in the recording options before starting. Make sure to grant audio permissions when prompted by your browser.'
        },
        {
          q: 'Can I pause and resume recordings?',
          a: 'Yes! Use the pause button during recording to temporarily stop capturing. Click resume to continue from where you left off.'
        }
      ]
    },
    {
      category: 'Editing & Exporting',
      questions: [
        {
          q: 'How do I trim my recordings?',
          a: 'After recording, click the "Edit" button on your video. Use the trim controls to set start and end points, then save your changes.'
        },
        {
          q: 'What formats can I export to?',
          a: 'Recordings are saved as WebM by default. Premium users can export to MP4, MOV, and GIF formats.'
        },
        {
          q: 'Can I add text or annotations?',
          a: 'Yes! Premium users have access to the advanced editor with text overlays, arrows, shapes, and annotations.'
        }
      ]
    },
    {
      category: 'Troubleshooting',
      questions: [
        {
          q: 'Why is my recording laggy?',
          a: 'Try lowering the video quality to 720p or reducing the frame rate to 30 FPS. Close unnecessary applications to free up system resources.'
        },
        {
          q: 'Audio is not recording',
          a: 'Check that you\'ve granted microphone/audio permissions in your browser settings. Make sure the correct audio source is selected.'
        },
        {
          q: 'My recordings are not saving',
          a: 'Check your available storage space. Enable auto-save in settings and ensure you\'re not in private/incognito mode.'
        }
      ]
    }
  ];

  const shortcuts = [
    { keys: ['Ctrl', 'R'], action: 'Start/Stop Recording' },
    { keys: ['Ctrl', 'P'], action: 'Pause/Resume' },
    { keys: ['Ctrl', 'S'], action: 'Take Screenshot' },
    { keys: ['Esc'], action: 'Cancel/Close' },
    { keys: ['Space'], action: 'Play/Pause Video' },
  ];

  $: filteredFaqs = searchQuery 
    ? faqs.map(cat => ({
        ...cat,
        questions: cat.questions.filter(q => 
          q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.a.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(cat => cat.questions.length > 0)
    : faqs;
</script>

<div class="modal-overlay" on:click={onClose}>
  <div class="modal-content help-modal" on:click|stopPropagation>
    <div class="modal-header">
      <h2>Help & Support</h2>
      <button class="modal-close" on:click={onClose} aria-label="Close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>

    <div class="help-tabs">
      <button 
        class="help-tab" 
        class:active={activeTab === 'faq'}
        on:click={() => activeTab = 'faq'}
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
        </svg>
        FAQs
      </button>
      <button 
        class="help-tab" 
        class:active={activeTab === 'shortcuts'}
        on:click={() => activeTab = 'shortcuts'}
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 7h-5V4c0-1.1-.9-2-2-2h-2c-1.1 0-2 .9-2 2v3H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zM9 4h6v3H9V4zm11 16H4V9h16v11z"/>
        </svg>
        Shortcuts
      </button>
      <button 
        class="help-tab" 
        class:active={activeTab === 'contact'}
        on:click={() => activeTab = 'contact'}
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
        </svg>
        Contact
      </button>
    </div>

    <div class="help-body">
      {#if activeTab === 'faq'}
        <div class="faq-section">
          <div class="search-box">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <input 
              type="text" 
              placeholder="Search for help..." 
              bind:value={searchQuery}
            />
          </div>

          <div class="faq-list">
            {#each filteredFaqs as category}
              <div class="faq-category">
                <h3 class="category-title">{category.category}</h3>
                {#each category.questions as faq}
                  <details class="faq-item">
                    <summary class="faq-question">{faq.q}</summary>
                    <p class="faq-answer">{faq.a}</p>
                  </details>
                {/each}
              </div>
            {/each}

            {#if filteredFaqs.length === 0}
              <div class="no-results">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                </svg>
                <p>No results found for "{searchQuery}"</p>
              </div>
            {/if}
          </div>
        </div>
      {/if}

      {#if activeTab === 'shortcuts'}
        <div class="shortcuts-section">
          <div class="shortcuts-list">
            {#each shortcuts as shortcut}
              <div class="shortcut-item">
                <div class="shortcut-keys">
                  {#each shortcut.keys as key}
                    <kbd class="key">{key}</kbd>
                  {/each}
                </div>
                <div class="shortcut-action">{shortcut.action}</div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      {#if activeTab === 'contact'}
        <div class="contact-section">
          <div class="contact-options">
            <div class="contact-card">
              <div class="contact-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
              </div>
              <h3>Email Support</h3>
              <p>Get help via email</p>
              <a href="mailto:support@nebula.com" class="contact-button">support@nebula.com</a>
            </div>

            <div class="contact-card">
              <div class="contact-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10h5v-2h-5c-4.34 0-8-3.66-8-8s3.66-8 8-8 8 3.66 8 8v1.43c0 .79-.71 1.57-1.5 1.57s-1.5-.78-1.5-1.57V12c0-2.76-2.24-5-5-5s-5 2.24-5 5 2.24 5 5 5c1.38 0 2.64-.56 3.54-1.47.65.89 1.77 1.47 2.96 1.47 1.97 0 3.5-1.6 3.5-3.57V12c0-5.52-4.48-10-10-10zm0 13c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/>
                </svg>
              </div>
              <h3>Documentation</h3>
              <p>Browse our guides</p>
              <a href="https://docs.nebula.com" target="_blank" class="contact-button">View Docs</a>
            </div>

            <div class="contact-card">
              <div class="contact-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <h3>Community Forum</h3>
              <p>Ask the community</p>
              <a href="https://community.nebula.com" target="_blank" class="contact-button">Visit Forum</a>
            </div>
          </div>

          <div class="feedback-box">
            <h3>Send Feedback</h3>
            <p>Have a suggestion or found a bug? Let us know!</p>
            <textarea 
              class="feedback-input" 
              placeholder="Type your feedback here..."
              rows="4"
            ></textarea>
            <button class="submit-feedback">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
              Send Feedback
            </button>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .category-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--text-primary, #1f2937);
    margin: 0 0 0.75rem 0;
  }

  .faq-item {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    margin-bottom: 0.5rem;
  }

  .faq-question {
    padding: 1rem;
    font-weight: 600;
    color: var(--text-primary, #374151);
    cursor: pointer;
    list-style: none;
    user-select: none;
  }

  .faq-question::-webkit-details-marker {
    display: none;
  }

  .faq-question::before {
    content: '+';
    display: inline-block;
    width: 24px;
    height: 24px;
    margin-right: 0.75rem;
    background: #f3f4f6;
    border-radius: 4px;
    text-align: center;
    line-height: 24px;
    color: #667eea;
    font-weight: 700;
  }

  details[open] .faq-question::before {
    content: '−';
  }

  .faq-answer {
    padding: 0 1rem 1rem 3rem;
    color: var(--text-secondary, #6b7280);
    line-height: 1.6;
    margin: 0;
  }

  .no-results {
    text-align: center;
    padding: 3rem 1rem;
    color: #9ca3af;
  }

  .no-results svg {
    width: 64px;
    height: 64px;
    margin-bottom: 1rem;
    opacity: 0.3;
  }

  .shortcuts-section {
    padding: 1.5rem;
  }

  .shortcuts-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .shortcut-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    background: var(--bg-secondary, #f9fafb);
    border-radius: 8px;
  }

  .shortcut-keys {
    display: flex;
    gap: 0.5rem;
  }

  .key {
    padding: 0.25rem 0.75rem;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.9rem;
    font-weight: 600;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .shortcut-action {
    color: var(--text-secondary, #6b7280);
    font-weight: 500;
  }

  .contact-section {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .contact-options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .contact-card {
    padding: 1.5rem;
    background: var(--bg-secondary, #f9fafb);
    border-radius: 12px;
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .contact-icon {
    width: 48px;
    height: 48px;
    margin: 0 auto;
    background: linear-gradient(135deg, #667eea, #764ba2);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }

  .contact-icon svg {
    width: 24px;
    height: 24px;
  }

  .contact-card h3 {
    margin: 0;
    font-size: 1rem;
    color: var(--text-primary, #1f2937);
  }

  .contact-card p {
    margin: 0;
    font-size: 0.85rem;
    color: var(--text-secondary, #6b7280);
  }

  .contact-button {
    display: inline-block;
    padding: 0.5rem 1rem;
    background: white;
    color: #667eea;
    border-radius: 6px;
    font-weight: 600;
    text-decoration: none;
    font-size: 0.9rem;
    transition: all 0.2s ease;
  }

  .contact-button:hover {
    background: #667eea;
    color: white;
  }

  .feedback-box {
    background: var(--bg-secondary, #f9fafb);
    padding: 1.5rem;
    border-radius: 12px;
  }

  .feedback-box h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.1rem;
    color: var(--text-primary, #1f2937);
  }

  .feedback-box p {
    margin: 0 0 1rem 0;
    color: var(--text-secondary, #6b7280);
    font-size: 0.9rem;
  }

  .feedback-input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    font-family: inherit;
    font-size: 0.95rem;
    resize: vertical;
    margin-bottom: 1rem;
  }

  .feedback-input:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  .submit-feedback {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .submit-feedback:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }

  .submit-feedback svg {
    width: 18px;
    height: 18px;
  }

  [data-theme="dark"] .category-title {
    color: var(--text-primary);
  }

  [data-theme="dark"] .faq-item {
    border-color: var(--border-primary);
  }

  [data-theme="dark"] .faq-question {
    color: var(--text-primary);
  }

  [data-theme="dark"] .faq-question::before {
    background: var(--bg-tertiary);
  }

  [data-theme="dark"] .key {
    background: var(--bg-tertiary);
    border-color: var(--border-primary);
  }

  [data-theme="dark"] .feedback-input {
    background: var(--bg-tertiary);
    border-color: var(--border-primary);
    color: var(--text-primary);
  }
</style>
