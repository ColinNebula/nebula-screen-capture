import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import './HelpSupportModal.css';

const HelpSupportModal = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('faq');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTutorial, setActiveTutorial] = useState(null);
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
    priority: 'normal',
  });

  const faqs = [
    {
      category: 'Getting Started',
      questions: [
        {
          q: 'How do I start recording?',
          a: 'Click the "Start Recording" button in the header, select your screen or window, and click "Share". The recording will begin immediately.',
        },
        {
          q: 'What browsers are supported?',
          a: 'Nebula Screen Capture works best on Chrome, Edge, Firefox, and Safari (desktop). Mobile browsers have limited screen recording support due to browser restrictions.',
        },
        {
          q: 'Can I record my webcam?',
          a: 'Yes! Toggle the webcam option before starting your recording. You can position and resize the webcam overlay during recording.',
        },
      ],
    },
    {
      category: 'Recording Features',
      questions: [
        {
          q: 'How do I take screenshots during recording?',
          a: 'Click the camera icon while recording to capture a screenshot. Screenshots are saved alongside your recording.',
        },
        {
          q: 'What video quality can I record in?',
          a: 'Quality depends on your plan: Free (720p), Pro (1080p), Premium (4K). You can change quality in settings.',
        },
        {
          q: 'Is there a recording time limit?',
          a: 'Free plan: 10 minutes per recording. Pro: 1 hour. Premium: Unlimited recording time.',
        },
      ],
    },
    {
      category: 'Storage & Files',
      questions: [
        {
          q: 'Where are my recordings stored?',
          a: 'Recordings are stored locally in your browser using IndexedDB. No files are uploaded to external servers, ensuring your privacy.',
        },
        {
          q: 'How do I download my recordings?',
          a: 'Go to "My Recordings", find your video, and click the download icon. The file will be saved to your Downloads folder.',
        },
        {
          q: 'Can I delete old recordings?',
          a: 'Yes! Click the trash icon on any recording in the "My Recordings" section to free up storage space.',
        },
      ],
    },
    {
      category: 'Troubleshooting',
      questions: [
        {
          q: 'Why isn\'t screen recording working on my iPhone?',
          a: 'Safari on iOS doesn\'t support the Screen Capture API. Use the native iOS screen recorder or access Nebula from a desktop/Android device.',
        },
        {
          q: 'My recording has no audio. What happened?',
          a: 'Make sure you enabled "Share audio" when selecting your screen. Also check that your browser has microphone permissions.',
        },
        {
          q: 'The app says I\'m out of storage. What can I do?',
          a: 'Delete old recordings to free up space, or upgrade your plan for more storage. You can also download and delete recordings you want to keep offline.',
        },
      ],
    },
  ];

  const tutorialContent = {
    quickstart: {
      title: 'Quick Start Guide',
      icon: '🚀',
      steps: [
        { title: 'Log In', desc: 'Sign in with your credentials or use the demo account (demo@nebula.com / demo123)' },
        { title: 'Start Recording', desc: 'Click the "Start Recording" button in the header' },
        { title: 'Select Source', desc: 'Choose to share your entire screen, a specific window, or a browser tab' },
        { title: 'Configure Options', desc: 'Toggle webcam, microphone, and system audio as needed' },
        { title: 'Begin Recording', desc: 'Click "Share" to start. Use the floating controls to pause or stop' },
        { title: 'Save & View', desc: 'Your recording is automatically saved. Access it from "My Recordings"' },
      ]
    },
    shortcuts: {
      title: 'Keyboard Shortcuts',
      icon: '⌨️',
      shortcuts: [
        { keys: 'Ctrl/Cmd + R', action: 'Start/Stop Recording' },
        { keys: 'Ctrl/Cmd + P', action: 'Pause/Resume Recording' },
        { keys: 'Ctrl/Cmd + S', action: 'Take Screenshot' },
        { keys: 'Ctrl/Cmd + W', action: 'Toggle Webcam' },
        { keys: 'Ctrl/Cmd + M', action: 'Toggle Microphone' },
        { keys: 'Ctrl/Cmd + K', action: 'Open Settings' },
        { keys: 'Ctrl/Cmd + H', action: 'Open Help' },
        { keys: 'Esc', action: 'Close Modal/Cancel' },
      ]
    },
    advanced: {
      title: 'Advanced Features',
      icon: '⚡',
      features: [
        {
          name: 'Custom Video Quality',
          desc: 'Adjust resolution (720p, 1080p, 4K) and frame rate (24, 30, 60 fps) in Settings',
          tip: 'Higher quality = larger file sizes. Use 720p for quick sharing, 4K for professional content'
        },
        {
          name: 'Webcam Overlay',
          desc: 'Drag to reposition, resize with corner handles, customize border and shadow',
          tip: 'Position webcam in bottom-right for minimal content obstruction'
        },
        {
          name: 'Screenshot Capture',
          desc: 'Take timestamped screenshots during recording without interruption',
          tip: 'Perfect for creating presentation slides or documentation from your recording'
        },
        {
          name: 'Audio Mixing',
          desc: 'Record system audio, microphone, or both simultaneously',
          tip: 'Test audio levels before important recordings using the preview'
        },
        {
          name: 'Storage Management',
          desc: 'Monitor storage usage, auto-compress old recordings, bulk delete',
          tip: 'Download important recordings before deleting to free up space'
        },
      ]
    },
    practices: {
      title: 'Best Practices',
      icon: '💡',
      tips: [
        {
          category: 'Preparation',
          items: [
            'Close unnecessary applications to improve performance',
            'Disable notifications to avoid interruptions',
            'Test your audio setup before recording',
            'Plan your content with a script or outline',
          ]
        },
        {
          category: 'Recording',
          items: [
            'Use a quiet environment for clear audio',
            'Speak clearly and at a moderate pace',
            'Pause briefly between topics for easier editing',
            'Use keyboard shortcuts to stay efficient',
          ]
        },
        {
          category: 'Quality',
          items: [
            'Record in 1080p for most professional use cases',
            'Use 60fps for gaming or fast-motion content',
            'Ensure good lighting if using webcam',
            'Keep recordings under 30 minutes for easier sharing',
          ]
        },
        {
          category: 'After Recording',
          items: [
            'Review recordings before sharing',
            'Download important recordings as backup',
            'Organize recordings with descriptive names',
            'Delete old recordings to free up storage',
          ]
        },
      ]
    }
  };

  const tutorials = [
    {
      id: 'quickstart',
      title: 'Quick Start Guide',
      description: 'Learn the basics in 2 minutes',
      icon: '🚀',
    },
    {
      id: 'advanced',
      title: 'Advanced Features',
      description: 'Master all recording options',
      icon: '⚡',
    },
    {
      id: 'shortcuts',
      title: 'Keyboard Shortcuts',
      description: 'Speed up your workflow',
      icon: '⌨️',
    },
    {
      id: 'practices',
      title: 'Best Practices',
      description: 'Tips for professional recordings',
      icon: '💡',
    },
  ];

  const handleContactSubmit = (e) => {
    e.preventDefault();
    console.log('Contact form submitted:', contactForm);
    alert('Thank you! We\'ll get back to you within 24 hours.');
    setContactForm({ subject: '', message: '', priority: 'normal' });
  };

  const filteredFaqs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(
      item =>
        item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.a.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(category => category.questions.length > 0);

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content help-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Help & Support</h2>
            <p className="modal-subtitle">We're here to help you get the most out of Nebula</p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        <div className="help-tabs">
          <button 
            className={`help-tab ${activeTab === 'faq' ? 'active' : ''}`}
            onClick={() => setActiveTab('faq')}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
            </svg>
            FAQ
          </button>
          <button 
            className={`help-tab ${activeTab === 'tutorials' ? 'active' : ''}`}
            onClick={() => setActiveTab('tutorials')}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
            </svg>
            Tutorials
          </button>
          <button 
            className={`help-tab ${activeTab === 'contact' ? 'active' : ''}`}
            onClick={() => setActiveTab('contact')}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
            Contact
          </button>
        </div>

        <div className="modal-body help-body">
          {activeTab === 'faq' && (
            <div className="faq-section">
              <div className="search-box">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                </svg>
                <input
                  type="text"
                  placeholder="Search frequently asked questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="faq-list">
                {filteredFaqs.length > 0 ? (
                  filteredFaqs.map((category, idx) => (
                    <div key={idx} className="faq-category">
                      <h3 className="category-title">{category.category}</h3>
                      {category.questions.map((item, qIdx) => (
                        <details key={qIdx} className="faq-item">
                          <summary className="faq-question">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                            </svg>
                            {item.q}
                          </summary>
                          <div className="faq-answer">{item.a}</div>
                        </details>
                      ))}
                    </div>
                  ))
                ) : (
                  <div className="no-results">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                    </svg>
                    <p>No results found for "{searchQuery}"</p>
                    <small>Try different keywords or browse all categories</small>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'tutorials' && (
            <div className="tutorials-section">
              {!activeTutorial ? (
                <>
                  <div className="tutorials-grid">
                    {tutorials.map((tutorial) => (
                      <button 
                        key={tutorial.id} 
                        className="tutorial-card" 
                        onClick={() => setActiveTutorial(tutorial.id)}
                      >
                        <div className="tutorial-icon">{tutorial.icon}</div>
                        <h3 className="tutorial-title">{tutorial.title}</h3>
                        <p className="tutorial-description">{tutorial.description}</p>
                        <div className="tutorial-link">
                          View tutorial
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                          </svg>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="resources-box">
                    <h3>Additional Resources</h3>
                    <div className="resource-links">
                      <a href="https://github.com/ColinNebula/nebula-screen-capture/blob/main/README.md" className="resource-link" target="_blank" rel="noopener noreferrer">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                        </svg>
                        Full Documentation
                      </a>
                      <a href="https://github.com/ColinNebula/nebula-screen-capture" className="resource-link" target="_blank" rel="noopener noreferrer">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                        </svg>
                        GitHub Repository
                      </a>
                      <a href="https://github.com/ColinNebula/nebula-screen-capture/discussions" className="resource-link" target="_blank" rel="noopener noreferrer">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
                        </svg>
                        Community Forum
                      </a>
                    </div>
                  </div>
                </>
              ) : (
                <div className="tutorial-detail">
                  <button className="back-button" onClick={() => setActiveTutorial(null)}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                    </svg>
                    Back to Tutorials
                  </button>

                  <div className="tutorial-header">
                    <div className="tutorial-icon-large">{tutorialContent[activeTutorial].icon}</div>
                    <h2>{tutorialContent[activeTutorial].title}</h2>
                  </div>

                  {activeTutorial === 'quickstart' && (
                    <div className="tutorial-steps">
                      {tutorialContent.quickstart.steps.map((step, idx) => (
                        <div key={idx} className="step-item">
                          <div className="step-number">{idx + 1}</div>
                          <div className="step-content">
                            <h4>{step.title}</h4>
                            <p>{step.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTutorial === 'shortcuts' && (
                    <div className="shortcuts-list">
                      {tutorialContent.shortcuts.shortcuts.map((shortcut, idx) => (
                        <div key={idx} className="shortcut-item">
                          <kbd className="shortcut-key">{shortcut.keys}</kbd>
                          <span className="shortcut-action">{shortcut.action}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTutorial === 'advanced' && (
                    <div className="features-list">
                      {tutorialContent.advanced.features.map((feature, idx) => (
                        <div key={idx} className="feature-item">
                          <h4>{feature.name}</h4>
                          <p>{feature.desc}</p>
                          <div className="feature-tip">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                              <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6C7.8 12.16 7 10.63 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z"/>
                            </svg>
                            <strong>Tip:</strong> {feature.tip}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTutorial === 'practices' && (
                    <div className="practices-list">
                      {tutorialContent.practices.tips.map((category, idx) => (
                        <div key={idx} className="practice-category">
                          <h3>{category.category}</h3>
                          <ul>
                            {category.items.map((item, itemIdx) => (
                              <li key={itemIdx}>
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                                </svg>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="contact-section">
              <form onSubmit={handleContactSubmit} className="contact-form">
                <div className="form-group">
                  <label htmlFor="subject">Subject</label>
                  <input
                    type="text"
                    id="subject"
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                    placeholder="What can we help you with?"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="priority">Priority</label>
                  <select
                    id="priority"
                    value={contactForm.priority}
                    onChange={(e) => setContactForm({ ...contactForm, priority: e.target.value })}
                  >
                    <option value="low">Low - General question</option>
                    <option value="normal">Normal - Need help</option>
                    <option value="high">High - Issue affecting work</option>
                    <option value="urgent">Urgent - Critical problem</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="message">Message</label>
                  <textarea
                    id="message"
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    placeholder="Please describe your issue or question in detail..."
                    rows="6"
                    required
                  />
                </div>

                <button type="submit" className="btn-primary">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                  </svg>
                  Send Message
                </button>
              </form>

              <div className="contact-info">
                <h3>Other ways to reach us</h3>
                <div className="contact-methods">
                  <div className="contact-method">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                    </svg>
                    <div>
                      <strong>Email</strong>
                      <span>support@nebulamedia3d.com</span>
                    </div>
                  </div>
                  <div className="contact-method">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                    </svg>
                    <div>
                      <strong>Live Chat</strong>
                      <span>Available Mon-Fri, 9am-5pm EST</span>
                    </div>
                  </div>
                </div>

                <div className="response-time">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                  </svg>
                  Average response time: <strong>4 hours</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default HelpSupportModal;
