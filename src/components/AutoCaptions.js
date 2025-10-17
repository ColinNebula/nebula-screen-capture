import React, { useState, useEffect, useRef } from 'react';
import './AutoCaptions.css';

/**
 * AutoCaptions Component
 * AI-powered automatic speech-to-text captions using Web Speech API
 * Features: Real-time transcription, editable captions, multi-language, SRT/VTT export
 */
const AutoCaptions = ({ recording, onClose, onSave }) => {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [captions, setCaptions] = useState([]);
  const [currentCaption, setCurrentCaption] = useState('');
  const [language, setLanguage] = useState('en-US');
  const [editingIndex, setEditingIndex] = useState(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  
  const videoRef = useRef(null);
  const recognitionRef = useRef(null);
  const captionIdRef = useRef(0);

  // Available languages
  const languages = [
    { code: 'en-US', name: 'English (US)' },
    { code: 'en-GB', name: 'English (UK)' },
    { code: 'es-ES', name: 'Spanish' },
    { code: 'fr-FR', name: 'French' },
    { code: 'de-DE', name: 'German' },
    { code: 'it-IT', name: 'Italian' },
    { code: 'pt-BR', name: 'Portuguese' },
    { code: 'ru-RU', name: 'Russian' },
    { code: 'ja-JP', name: 'Japanese' },
    { code: 'zh-CN', name: 'Chinese' },
    { code: 'ko-KR', name: 'Korean' },
    { code: 'ar-SA', name: 'Arabic' },
    { code: 'hi-IN', name: 'Hindi' },
  ];

  useEffect(() => {
    // Initialize Web Speech API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = language;
      recognitionRef.current.maxAlternatives = 1;

      recognitionRef.current.onresult = (event) => {
        const current = event.results[event.results.length - 1];
        const transcript = current[0].transcript;
        
        if (current.isFinal) {
          // Add final caption with timestamp
          const timestamp = videoRef.current ? videoRef.current.currentTime : 0;
          const newCaption = {
            id: captionIdRef.current++,
            text: transcript,
            startTime: timestamp,
            endTime: timestamp + 3, // Default 3 second duration
            confidence: current[0].confidence
          };
          
          setCaptions(prev => [...prev, newCaption]);
          setCurrentCaption('');
        } else {
          // Show interim results
          setCurrentCaption(transcript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setError(`Recognition error: ${event.error}`);
        setIsTranscribing(false);
      };

      recognitionRef.current.onend = () => {
        if (isTranscribing) {
          // Restart if still transcribing
          try {
            recognitionRef.current.start();
          } catch (err) {
            console.error('Error restarting recognition:', err);
          }
        }
      };
    } else {
      setError('Speech recognition not supported in this browser. Please use Chrome or Edge.');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language]);

  const startTranscription = () => {
    if (!recognitionRef.current) {
      setError('Speech recognition not available');
      return;
    }

    setError('');
    setIsTranscribing(true);
    setCaptions([]);
    setCurrentCaption('');
    captionIdRef.current = 0;

    try {
      recognitionRef.current.lang = language;
      recognitionRef.current.start();
      
      // Play video and track progress
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play();
        
        // Update progress
        const interval = setInterval(() => {
          if (videoRef.current) {
            const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
            setProgress(progress);
            
            if (videoRef.current.currentTime >= videoRef.current.duration) {
              stopTranscription();
              clearInterval(interval);
            }
          }
        }, 100);
      }
    } catch (err) {
      setError(`Failed to start transcription: ${err.message}`);
      setIsTranscribing(false);
    }
  };

  const stopTranscription = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsTranscribing(false);
    setProgress(100);
    
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  const updateCaption = (index, field, value) => {
    setCaptions(prev => prev.map((cap, i) => 
      i === index ? { ...cap, [field]: value } : cap
    ));
  };

  const deleteCaption = (index) => {
    setCaptions(prev => prev.filter((_, i) => i !== index));
  };

  const mergeCaptions = (index) => {
    if (index < captions.length - 1) {
      setCaptions(prev => {
        const merged = [...prev];
        merged[index] = {
          ...merged[index],
          text: `${merged[index].text} ${merged[index + 1].text}`,
          endTime: merged[index + 1].endTime
        };
        merged.splice(index + 1, 1);
        return merged;
      });
    }
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
  };

  const exportToSRT = () => {
    let srt = '';
    captions.forEach((caption, index) => {
      srt += `${index + 1}\n`;
      srt += `${formatTime(caption.startTime)} --> ${formatTime(caption.endTime)}\n`;
      srt += `${caption.text}\n\n`;
    });

    const blob = new Blob([srt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${recording.name || 'recording'}_captions.srt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToVTT = () => {
    let vtt = 'WEBVTT\n\n';
    captions.forEach((caption, index) => {
      vtt += `${index + 1}\n`;
      vtt += `${formatTime(caption.startTime).replace(',', '.')} --> ${formatTime(caption.endTime).replace(',', '.')}\n`;
      vtt += `${caption.text}\n\n`;
    });

    const blob = new Blob([vtt], { type: 'text/vtt' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${recording.name || 'recording'}_captions.vtt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const applyToVideo = async () => {
    if (captions.length === 0) {
      setError('No captions to apply');
      return;
    }

    try {
      // Create video with burned-in captions
      const canvas = document.createElement('canvas');
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');

      const stream = canvas.captureStream(30);
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 5000000
      });

      const chunks = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const captionedRecording = {
          ...recording,
          blob,
          url: URL.createObjectURL(blob),
          name: `${recording.name || 'recording'}_captioned`,
          timestamp: Date.now(),
          size: blob.size
        };
        
        onSave(captionedRecording);
      };

      mediaRecorder.start();
      video.currentTime = 0;
      video.play();

      // Render video with captions
      const renderFrame = () => {
        if (video.currentTime >= video.duration) {
          mediaRecorder.stop();
          video.pause();
          return;
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Find and draw current captions
        const currentTime = video.currentTime;
        const activeCaptions = captions.filter(cap => 
          currentTime >= cap.startTime && currentTime <= cap.endTime
        );

        activeCaptions.forEach(caption => {
          // Draw caption background
          ctx.font = 'bold 48px Arial';
          const textMetrics = ctx.measureText(caption.text);
          const padding = 20;
          const x = (canvas.width - textMetrics.width) / 2;
          const y = canvas.height - 100;

          ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
          ctx.fillRect(
            x - padding,
            y - 48 - padding,
            textMetrics.width + padding * 2,
            48 + padding * 2
          );

          // Draw caption text
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(caption.text, canvas.width / 2, y);
        });

        requestAnimationFrame(renderFrame);
      };

      renderFrame();
    } catch (err) {
      setError(`Failed to apply captions: ${err.message}`);
    }
  };

  return (
    <div className="auto-captions-overlay">
      <div className="auto-captions-modal">
        <div className="captions-header">
          <h2>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            AI Auto-Captions
          </h2>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="captions-content">
          <div className="video-section">
            <video
              ref={videoRef}
              src={recording.url}
              className="caption-video"
              controls
            />
            
            {isTranscribing && (
              <div className="transcription-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <p>Transcribing... {Math.round(progress)}%</p>
              </div>
            )}

            {currentCaption && (
              <div className="interim-caption">
                {currentCaption}
              </div>
            )}
          </div>

          <div className="controls-section">
            <div className="language-selector">
              <label>Language:</label>
              <select 
                value={language} 
                onChange={(e) => setLanguage(e.target.value)}
                disabled={isTranscribing}
              >
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="transcription-controls">
              {!isTranscribing ? (
                <button className="start-transcription-btn" onClick={startTranscription}>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                  </svg>
                  Start Transcription
                </button>
              ) : (
                <button className="stop-transcription-btn" onClick={stopTranscription}>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="6" width="12" height="12" />
                  </svg>
                  Stop
                </button>
              )}
            </div>

            {error && <div className="error-message">{error}</div>}
          </div>

          <div className="captions-list-section">
            <div className="captions-list-header">
              <h3>Captions ({captions.length})</h3>
              <div className="export-buttons">
                <button onClick={exportToSRT} disabled={captions.length === 0}>
                  Export SRT
                </button>
                <button onClick={exportToVTT} disabled={captions.length === 0}>
                  Export VTT
                </button>
                <button onClick={applyToVideo} disabled={captions.length === 0} className="apply-btn">
                  Apply to Video
                </button>
              </div>
            </div>

            <div className="captions-list">
              {captions.length === 0 ? (
                <div className="empty-captions">
                  <p>No captions yet. Start transcription to generate captions automatically.</p>
                </div>
              ) : (
                captions.map((caption, index) => (
                  <div key={caption.id} className="caption-item">
                    <div className="caption-time">
                      <input
                        type="number"
                        value={caption.startTime.toFixed(2)}
                        onChange={(e) => updateCaption(index, 'startTime', parseFloat(e.target.value))}
                        step="0.1"
                      />
                      <span>→</span>
                      <input
                        type="number"
                        value={caption.endTime.toFixed(2)}
                        onChange={(e) => updateCaption(index, 'endTime', parseFloat(e.target.value))}
                        step="0.1"
                      />
                    </div>
                    
                    <div className="caption-text">
                      {editingIndex === index ? (
                        <textarea
                          value={caption.text}
                          onChange={(e) => updateCaption(index, 'text', e.target.value)}
                          onBlur={() => setEditingIndex(null)}
                          autoFocus
                        />
                      ) : (
                        <p onClick={() => setEditingIndex(index)}>{caption.text}</p>
                      )}
                    </div>

                    <div className="caption-actions">
                      <button 
                        onClick={() => mergeCaptions(index)}
                        disabled={index === captions.length - 1}
                        title="Merge with next"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                        </svg>
                      </button>
                      <button onClick={() => deleteCaption(index)} title="Delete">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    {caption.confidence && (
                      <div className="caption-confidence">
                        Confidence: {(caption.confidence * 100).toFixed(0)}%
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoCaptions;
