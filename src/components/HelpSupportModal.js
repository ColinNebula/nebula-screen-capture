import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import './HelpSupportModal.css';

const HelpSupportModal = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('faq');
  const [searchQuery, setSearchQuery] = useState('');
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

  const tutorials = [
    {
      title: 'Quick Start Guide',
      description: 'Learn the basics in 2 minutes',
      icon: '🚀',
      link: '#',
    },
    {
      title: 'Advanced Features',
      description: 'Master all recording options',
      icon: '⚡',
      link: '#',
    },
    {
      title: 'Keyboard Shortcuts',
      description: 'Speed up your workflow',
      icon: '⌨️',
      link: '#',
    },
    {
      title: 'Best Practices',
      description: 'Tips for professional recordings',
      icon: '💡',
      link: '#',
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
              <div className="tutorials-grid">
                {tutorials.map((tutorial, idx) => (
                  <a key={idx} href={tutorial.link} className="tutorial-card">
                    <div className="tutorial-icon">{tutorial.icon}</div>
                    <h3 className="tutorial-title">{tutorial.title}</h3>
                    <p className="tutorial-description">{tutorial.description}</p>
                    <div className="tutorial-link">
                      Watch tutorial
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                      </svg>
                    </div>
                  </a>
                ))}
              </div>

              <div className="resources-box">
                <h3>Additional Resources</h3>
                <div className="resource-links">
                  <a href="#" className="resource-link">
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
                  <a href="#" className="resource-link">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
                    </svg>
                    Community Forum
                  </a>
                </div>
              </div>
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
