/**
 * Auto-Highlights Service
 * Detect important moments based on audio peaks, silence, and activity
 */

class AutoHighlightsService {
  constructor() {
    this.highlightTypes = {
      ACTION: 'action', // High audio activity
      SPEECH: 'speech', // Voice detected
      MUSIC: 'music', // Musical moments
      SILENCE: 'silence', // Dramatic pauses
      PEAK: 'peak', // Audio peaks
      TRANSITION: 'transition' // Scene changes
    };
  }

  /**
   * Detect all highlights in video
   */
  async detectHighlights(videoElement, options = {}) {
    const {
      minDuration = 3, // Minimum highlight duration in seconds
      maxHighlights = 10,
      types = Object.values(this.highlightTypes),
      onProgress = null
    } = options;

    try {
      const highlights = [];

      // Analyze audio
      if (types.includes(this.highlightTypes.PEAK) || 
          types.includes(this.highlightTypes.ACTION) ||
          types.includes(this.highlightTypes.SPEECH)) {
        const audioHighlights = await this.detectAudioHighlights(videoElement, {
          types,
          onProgress: (progress) => {
            if (onProgress) onProgress({ ...progress, phase: 'audio', step: 1, totalSteps: 2 });
          }
        });
        highlights.push(...audioHighlights);
      }

      // Analyze video
      if (types.includes(this.highlightTypes.TRANSITION)) {
        const videoHighlights = await this.detectVideoHighlights(videoElement, {
          onProgress: (progress) => {
            if (onProgress) onProgress({ ...progress, phase: 'video', step: 2, totalSteps: 2 });
          }
        });
        highlights.push(...videoHighlights);
      }

      // Merge overlapping highlights
      const mergedHighlights = this.mergeHighlights(highlights, minDuration);

      // Sort by importance and limit
      const sortedHighlights = mergedHighlights
        .sort((a, b) => b.importance - a.importance)
        .slice(0, maxHighlights);

      // Sort by time
      return sortedHighlights.sort((a, b) => a.startTime - b.startTime);

    } catch (error) {
      console.error('Highlight detection failed:', error);
      throw error;
    }
  }

  /**
   * Detect audio-based highlights
   */
  async detectAudioHighlights(videoElement, options = {}) {
    const { types = [], onProgress = null } = options;

    return new Promise((resolve, reject) => {
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaElementSource(videoElement);
        const analyser = audioContext.createAnalyser();
        
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.8;
        
        source.connect(analyser);
        analyser.connect(audioContext.destination);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const timeArray = new Uint8Array(bufferLength);

        const highlights = [];
        const windowSize = 0.5; // 500ms windows
        const samples = [];
        
        let startTime = Date.now();
        const duration = videoElement.duration;

        const analyze = () => {
          if (videoElement.currentTime >= duration || videoElement.ended) {
            audioContext.close();
            
            // Process collected samples
            const detectedHighlights = this.analyzeAudioSamples(samples, types);
            resolve(detectedHighlights);
            return;
          }

          analyser.getByteFrequencyData(dataArray);
          analyser.getByteTimeDomainData(timeArray);

          // Calculate metrics
          const frequency = this.analyzeFrequencyData(dataArray);
          const temporal = this.analyzeTemporalData(timeArray);
          
          samples.push({
            time: videoElement.currentTime,
            frequency,
            temporal
          });

          if (onProgress) {
            onProgress({
              progress: (videoElement.currentTime / duration) * 100,
              currentTime: videoElement.currentTime,
              duration
            });
          }

          requestAnimationFrame(analyze);
        };

        videoElement.play();
        analyze();

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Analyze frequency data
   */
  analyzeFrequencyData(dataArray) {
    let total = 0;
    let bass = 0;
    let mid = 0;
    let treble = 0;

    const bassEnd = Math.floor(dataArray.length * 0.2);
    const midEnd = Math.floor(dataArray.length * 0.6);

    for (let i = 0; i < dataArray.length; i++) {
      total += dataArray[i];
      
      if (i < bassEnd) {
        bass += dataArray[i];
      } else if (i < midEnd) {
        mid += dataArray[i];
      } else {
        treble += dataArray[i];
      }
    }

    return {
      average: total / dataArray.length,
      bass: bass / bassEnd,
      mid: mid / (midEnd - bassEnd),
      treble: treble / (dataArray.length - midEnd),
      peak: Math.max(...dataArray)
    };
  }

  /**
   * Analyze temporal (waveform) data
   */
  analyzeTemporalData(dataArray) {
    let sum = 0;
    let sumSquares = 0;
    let zeroCrossings = 0;
    let lastValue = dataArray[0] - 128;

    for (let i = 0; i < dataArray.length; i++) {
      const value = dataArray[i] - 128;
      sum += Math.abs(value);
      sumSquares += value * value;

      if ((lastValue >= 0 && value < 0) || (lastValue < 0 && value >= 0)) {
        zeroCrossings++;
      }
      lastValue = value;
    }

    const rms = Math.sqrt(sumSquares / dataArray.length);
    const average = sum / dataArray.length;

    return {
      rms,
      average,
      zeroCrossings,
      energy: sumSquares / dataArray.length
    };
  }

  /**
   * Analyze collected audio samples
   */
  analyzeAudioSamples(samples, types) {
    const highlights = [];
    const windowSize = 10; // Analyze in 10-sample windows

    for (let i = 0; i < samples.length - windowSize; i++) {
      const window = samples.slice(i, i + windowSize);
      const analysis = this.analyzeWindow(window);

      // Detect peaks
      if (types.includes(this.highlightTypes.PEAK) && analysis.isPeak) {
        highlights.push({
          type: this.highlightTypes.PEAK,
          startTime: window[0].time,
          endTime: window[window.length - 1].time,
          importance: analysis.peakIntensity,
          metadata: { peak: analysis.peakValue }
        });
      }

      // Detect action (high energy)
      if (types.includes(this.highlightTypes.ACTION) && analysis.isAction) {
        highlights.push({
          type: this.highlightTypes.ACTION,
          startTime: window[0].time,
          endTime: window[window.length - 1].time,
          importance: analysis.actionIntensity,
          metadata: { energy: analysis.energy }
        });
      }

      // Detect speech (high zero crossings in mid frequencies)
      if (types.includes(this.highlightTypes.SPEECH) && analysis.isSpeech) {
        highlights.push({
          type: this.highlightTypes.SPEECH,
          startTime: window[0].time,
          endTime: window[window.length - 1].time,
          importance: analysis.speechConfidence,
          metadata: { confidence: analysis.speechConfidence }
        });
      }

      // Detect music (strong bass and rhythm)
      if (types.includes(this.highlightTypes.MUSIC) && analysis.isMusic) {
        highlights.push({
          type: this.highlightTypes.MUSIC,
          startTime: window[0].time,
          endTime: window[window.length - 1].time,
          importance: analysis.musicality,
          metadata: { rhythm: analysis.rhythmStrength }
        });
      }
    }

    return highlights;
  }

  /**
   * Analyze audio window
   */
  analyzeWindow(window) {
    const avgEnergy = window.reduce((sum, s) => sum + s.temporal.energy, 0) / window.length;
    const avgFreq = window.reduce((sum, s) => sum + s.frequency.average, 0) / window.length;
    const avgBass = window.reduce((sum, s) => sum + s.frequency.bass, 0) / window.length;
    const avgMid = window.reduce((sum, s) => sum + s.frequency.mid, 0) / window.length;
    const avgZeroCrossings = window.reduce((sum, s) => sum + s.temporal.zeroCrossings, 0) / window.length;
    const peakValue = Math.max(...window.map(s => s.frequency.peak));

    // Calculate thresholds
    const energyThreshold = 50;
    const peakThreshold = 200;
    const bassThreshold = 100;
    const zeroCrossingThreshold = 50;

    return {
      // Peak detection
      isPeak: peakValue > peakThreshold,
      peakIntensity: Math.min(100, (peakValue / 255) * 100),
      peakValue,

      // Action detection (high energy)
      isAction: avgEnergy > energyThreshold,
      actionIntensity: Math.min(100, (avgEnergy / 100) * 100),
      energy: avgEnergy,

      // Speech detection (mid frequencies + zero crossings)
      isSpeech: avgMid > 80 && avgZeroCrossings > zeroCrossingThreshold,
      speechConfidence: Math.min(100, ((avgMid / 128) * (avgZeroCrossings / 100)) * 100),

      // Music detection (strong bass + rhythm)
      isMusic: avgBass > bassThreshold && avgEnergy > energyThreshold * 0.7,
      musicality: Math.min(100, ((avgBass / 128) * (avgEnergy / 100)) * 100),
      rhythmStrength: avgBass
    };
  }

  /**
   * Detect video-based highlights (scene changes, motion)
   */
  async detectVideoHighlights(videoElement, options = {}) {
    const { onProgress = null } = options;

    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        canvas.width = 160;
        canvas.height = 90;

        const highlights = [];
        let previousFrame = null;
        const duration = videoElement.duration;
        const sampleRate = 0.5; // Sample every 0.5 seconds
        let currentTime = 0;

        const processFrame = () => {
          if (currentTime >= duration) {
            resolve(highlights);
            return;
          }

          videoElement.currentTime = currentTime;
        };

        videoElement.onseeked = () => {
          ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
          const currentFrame = ctx.getImageData(0, 0, canvas.width, canvas.height);

          if (previousFrame) {
            const difference = this.calculateFrameDifference(previousFrame, currentFrame);
            
            // Scene change detected
            if (difference > 30) {
              highlights.push({
                type: this.highlightTypes.TRANSITION,
                startTime: Math.max(0, currentTime - 1),
                endTime: Math.min(duration, currentTime + 1),
                importance: Math.min(100, difference),
                metadata: { sceneChangeMagnitude: difference }
              });
            }
          }

          previousFrame = currentFrame;
          currentTime += sampleRate;

          if (onProgress) {
            onProgress({
              progress: (currentTime / duration) * 100,
              currentTime,
              duration
            });
          }

          processFrame();
        };

        processFrame();

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Calculate frame difference
   */
  calculateFrameDifference(frame1, frame2) {
    const data1 = frame1.data;
    const data2 = frame2.data;
    let diff = 0;

    for (let i = 0; i < data1.length; i += 4) {
      diff += Math.abs(data1[i] - data2[i]);
      diff += Math.abs(data1[i + 1] - data2[i + 1]);
      diff += Math.abs(data1[i + 2] - data2[i + 2]);
    }

    return (diff / (data1.length / 4)) / 3;
  }

  /**
   * Merge overlapping highlights
   */
  mergeHighlights(highlights, minDuration) {
    if (highlights.length === 0) return [];

    // Sort by start time
    highlights.sort((a, b) => a.startTime - b.startTime);

    const merged = [];
    let current = { ...highlights[0] };

    for (let i = 1; i < highlights.length; i++) {
      const next = highlights[i];

      // Check if overlapping or close
      if (next.startTime <= current.endTime + 1) {
        // Merge
        current.endTime = Math.max(current.endTime, next.endTime);
        current.importance = Math.max(current.importance, next.importance);
        
        // Combine types
        if (current.type !== next.type) {
          current.type = `${current.type},${next.type}`;
        }
      } else {
        // Save current and start new
        if (current.endTime - current.startTime >= minDuration) {
          merged.push(current);
        }
        current = { ...next };
      }
    }

    // Add last highlight
    if (current.endTime - current.startTime >= minDuration) {
      merged.push(current);
    }

    return merged;
  }

  /**
   * Export highlights as JSON
   */
  exportAsJSON(highlights) {
    return JSON.stringify({
      highlights,
      totalHighlights: highlights.length,
      totalDuration: highlights.reduce((sum, h) => sum + (h.endTime - h.startTime), 0),
      generatedAt: new Date().toISOString()
    }, null, 2);
  }

  /**
   * Export highlights for video editor
   */
  exportForEditor(highlights) {
    return highlights.map(h => ({
      in: h.startTime,
      out: h.endTime,
      name: `${h.type} - Importance: ${Math.round(h.importance)}%`,
      color: this.getHighlightColor(h.type)
    }));
  }

  /**
   * Get color for highlight type
   */
  getHighlightColor(type) {
    const colors = {
      [this.highlightTypes.ACTION]: '#ff4444',
      [this.highlightTypes.SPEECH]: '#4444ff',
      [this.highlightTypes.MUSIC]: '#ff44ff',
      [this.highlightTypes.SILENCE]: '#888888',
      [this.highlightTypes.PEAK]: '#ffaa00',
      [this.highlightTypes.TRANSITION]: '#00aaff'
    };
    return colors[type] || '#666666';
  }

  /**
   * Format time
   */
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }

  /**
   * Create highlight reel
   */
  async createHighlightReel(videoBlob, highlights, options = {}) {
    const { padding = 0.5, transition = 0.3 } = options;

    // This would need to be implemented with video editing capabilities
    // For now, return the segments information
    return highlights.map(h => ({
      startTime: Math.max(0, h.startTime - padding),
      endTime: h.endTime + padding,
      type: h.type,
      importance: h.importance
    }));
  }
}

// Singleton instance
let autoHighlightsService = null;

/**
 * Get auto-highlights service instance
 */
export function getAutoHighlightsService() {
  if (!autoHighlightsService) {
    autoHighlightsService = new AutoHighlightsService();
  }
  return autoHighlightsService;
}

/**
 * Quick highlight detection
 */
export async function detectHighlights(videoElement, options = {}) {
  const service = getAutoHighlightsService();
  return await service.detectHighlights(videoElement, options);
}

export default AutoHighlightsService;
