/**
 * Auto-Transcription Service
 * Speech-to-text transcription using Web Speech API with fallback options
 */

class TranscriptionService {
  constructor() {
    this.recognition = null;
    this.isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    this.isTranscribing = false;
    this.transcript = [];
    this.onProgress = null;
    this.onComplete = null;
    this.onError = null;
  }

  /**
   * Check if transcription is supported
   */
  isAvailable() {
    return this.isSupported;
  }

  /**
   * Initialize speech recognition
   */
  initialize(options = {}) {
    if (!this.isSupported) {
      throw new Error('Speech recognition not supported in this browser');
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();

    // Configuration
    this.recognition.continuous = options.continuous !== false;
    this.recognition.interimResults = options.interimResults !== false;
    this.recognition.lang = options.language || 'en-US';
    this.recognition.maxAlternatives = options.maxAlternatives || 1;

    // Event handlers
    this.recognition.onstart = () => {
      this.isTranscribing = true;
      console.log('🎤 Transcription started');
    };

    this.recognition.onend = () => {
      this.isTranscribing = false;
      console.log('🎤 Transcription ended');
      if (this.onComplete) {
        this.onComplete(this.transcript);
      }
    };

    this.recognition.onerror = (event) => {
      console.error('Transcription error:', event.error);
      if (this.onError) {
        this.onError(event.error);
      }
    };

    this.recognition.onresult = (event) => {
      this.handleResult(event);
    };
  }

  /**
   * Handle transcription result
   */
  handleResult(event) {
    const results = Array.from(event.results);
    
    results.forEach((result, index) => {
      if (result.isFinal) {
        const transcript = result[0].transcript;
        const confidence = result[0].confidence;
        const timestamp = Date.now();

        this.transcript.push({
          text: transcript,
          confidence,
          timestamp,
          index: this.transcript.length
        });

        if (this.onProgress) {
          this.onProgress({
            text: transcript,
            confidence,
            timestamp,
            totalSegments: this.transcript.length
          });
        }
      }
    });
  }

  /**
   * Transcribe audio from video/audio element
   */
  async transcribeMedia(mediaElement, options = {}) {
    return new Promise(async (resolve, reject) => {
      try {
        this.transcript = [];
        
        // Create audio context
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaElementSource(mediaElement);
        const destination = audioContext.createMediaStreamDestination();
        
        source.connect(destination);
        source.connect(audioContext.destination);

        // Initialize recognition
        this.initialize({
          ...options,
          continuous: true,
          interimResults: true
        });

        // Set up completion callback
        this.onComplete = (transcript) => {
          audioContext.close();
          resolve(transcript);
        };

        this.onError = (error) => {
          audioContext.close();
          reject(error);
        };

        // Start transcription
        this.recognition.start();

        // Play media
        mediaElement.currentTime = 0;
        await mediaElement.play();

        // Stop when media ends
        mediaElement.onended = () => {
          this.stop();
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Transcribe audio blob
   */
  async transcribeBlob(audioBlob, options = {}) {
    return new Promise((resolve, reject) => {
      const audio = new Audio(URL.createObjectURL(audioBlob));
      
      this.transcribeMedia(audio, options)
        .then(transcript => {
          URL.revokeObjectURL(audio.src);
          resolve(transcript);
        })
        .catch(error => {
          URL.revokeObjectURL(audio.src);
          reject(error);
        });
    });
  }

  /**
   * Stop transcription
   */
  stop() {
    if (this.recognition && this.isTranscribing) {
      this.recognition.stop();
    }
  }

  /**
   * Export transcript as text
   */
  exportAsText(transcript = this.transcript) {
    return transcript.map(segment => segment.text).join(' ');
  }

  /**
   * Export transcript as SRT subtitle format
   */
  exportAsSRT(transcript = this.transcript, options = {}) {
    const { segmentDuration = 5 } = options;
    let srt = '';
    
    transcript.forEach((segment, index) => {
      const startTime = index * segmentDuration;
      const endTime = (index + 1) * segmentDuration;
      
      srt += `${index + 1}\n`;
      srt += `${this.formatSRTTime(startTime)} --> ${this.formatSRTTime(endTime)}\n`;
      srt += `${segment.text}\n\n`;
    });
    
    return srt;
  }

  /**
   * Export transcript as VTT subtitle format
   */
  exportAsVTT(transcript = this.transcript, options = {}) {
    const { segmentDuration = 5 } = options;
    let vtt = 'WEBVTT\n\n';
    
    transcript.forEach((segment, index) => {
      const startTime = index * segmentDuration;
      const endTime = (index + 1) * segmentDuration;
      
      vtt += `${index + 1}\n`;
      vtt += `${this.formatVTTTime(startTime)} --> ${this.formatVTTTime(endTime)}\n`;
      vtt += `${segment.text}\n\n`;
    });
    
    return vtt;
  }

  /**
   * Export transcript as JSON
   */
  exportAsJSON(transcript = this.transcript) {
    return JSON.stringify({
      transcript,
      totalSegments: transcript.length,
      totalText: this.exportAsText(transcript),
      averageConfidence: this.calculateAverageConfidence(transcript),
      generatedAt: new Date().toISOString()
    }, null, 2);
  }

  /**
   * Calculate average confidence
   */
  calculateAverageConfidence(transcript) {
    if (transcript.length === 0) return 0;
    const sum = transcript.reduce((acc, segment) => acc + segment.confidence, 0);
    return (sum / transcript.length * 100).toFixed(2);
  }

  /**
   * Format time for SRT (HH:MM:SS,mmm)
   */
  formatSRTTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
  }

  /**
   * Format time for VTT (HH:MM:SS.mmm)
   */
  formatVTTTime(seconds) {
    return this.formatSRTTime(seconds).replace(',', '.');
  }

  /**
   * Search transcript for keyword
   */
  searchTranscript(keyword, transcript = this.transcript) {
    return transcript.filter(segment => 
      segment.text.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  /**
   * Get transcript statistics
   */
  getStatistics(transcript = this.transcript) {
    const text = this.exportAsText(transcript);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    
    return {
      totalSegments: transcript.length,
      totalWords: words.length,
      totalCharacters: text.length,
      averageConfidence: this.calculateAverageConfidence(transcript),
      averageWordsPerSegment: (words.length / transcript.length).toFixed(1),
      estimatedDuration: transcript.length * 5 // Assuming 5 seconds per segment
    };
  }
}

// Singleton instance
let transcriptionService = null;

/**
 * Get transcription service instance
 */
export function getTranscriptionService() {
  if (!transcriptionService) {
    transcriptionService = new TranscriptionService();
  }
  return transcriptionService;
}

/**
 * Quick transcribe function
 */
export async function transcribeVideo(videoElement, options = {}) {
  const service = getTranscriptionService();
  return await service.transcribeMedia(videoElement, options);
}

/**
 * Check if transcription is supported
 */
export function isTranscriptionSupported() {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
}

export default TranscriptionService;
