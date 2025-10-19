/**
 * Noise Reduction Service
 * AI-powered audio cleanup and noise removal
 */

class NoiseReductionService {
  constructor() {
    this.audioContext = null;
    this.noiseProfile = null;
  }

  /**
   * Initialize audio context
   */
  initAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this.audioContext;
  }

  /**
   * Learn noise profile from silent section
   */
  async learnNoiseProfile(audioBuffer, startTime = 0, duration = 1) {
    const sampleRate = audioBuffer.sampleRate;
    const startSample = Math.floor(startTime * sampleRate);
    const endSample = Math.floor((startTime + duration) * sampleRate);
    
    const channelData = audioBuffer.getChannelData(0);
    const noiseSection = channelData.slice(startSample, endSample);

    // Perform FFT to get frequency spectrum
    const fftSize = 2048;
    const fft = this.performFFT(noiseSection, fftSize);
    
    // Store noise profile
    this.noiseProfile = {
      magnitudes: fft.magnitudes,
      phases: fft.phases,
      sampleRate: sampleRate,
      fftSize: fftSize
    };

    console.log('📊 Noise profile learned');
    return this.noiseProfile;
  }

  /**
   * Auto-detect noise profile from quietest section
   */
  async autoDetectNoiseProfile(audioBuffer, options = {}) {
    const { windowSize = 0.5, overlap = 0.25 } = options;
    
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const windowSamples = Math.floor(windowSize * sampleRate);
    const stepSamples = Math.floor(windowSamples * (1 - overlap));

    let quietestWindow = null;
    let lowestEnergy = Infinity;

    // Find quietest window
    for (let i = 0; i < channelData.length - windowSamples; i += stepSamples) {
      const window = channelData.slice(i, i + windowSamples);
      const energy = this.calculateEnergy(window);

      if (energy < lowestEnergy) {
        lowestEnergy = energy;
        quietestWindow = { start: i / sampleRate, duration: windowSize };
      }
    }

    if (quietestWindow) {
      await this.learnNoiseProfile(audioBuffer, quietestWindow.start, quietestWindow.duration);
      return quietestWindow;
    }

    throw new Error('Could not detect noise profile');
  }

  /**
   * Calculate energy of audio segment
   */
  calculateEnergy(samples) {
    return samples.reduce((sum, sample) => sum + sample * sample, 0) / samples.length;
  }

  /**
   * Perform FFT (Fast Fourier Transform)
   */
  performFFT(samples, fftSize) {
    // Simplified FFT - in production, use a library like fft.js
    const magnitudes = new Float32Array(fftSize / 2);
    const phases = new Float32Array(fftSize / 2);

    for (let k = 0; k < fftSize / 2; k++) {
      let real = 0;
      let imag = 0;

      for (let n = 0; n < Math.min(samples.length, fftSize); n++) {
        const angle = (-2 * Math.PI * k * n) / fftSize;
        real += samples[n] * Math.cos(angle);
        imag += samples[n] * Math.sin(angle);
      }

      magnitudes[k] = Math.sqrt(real * real + imag * imag);
      phases[k] = Math.atan2(imag, real);
    }

    return { magnitudes, phases };
  }

  /**
   * Perform inverse FFT
   */
  performIFFT(magnitudes, phases, fftSize) {
    const samples = new Float32Array(fftSize);

    for (let n = 0; n < fftSize; n++) {
      let sum = 0;

      for (let k = 0; k < magnitudes.length; k++) {
        const angle = (2 * Math.PI * k * n) / fftSize;
        const real = magnitudes[k] * Math.cos(phases[k]);
        const imag = magnitudes[k] * Math.sin(phases[k]);
        
        sum += real * Math.cos(angle) - imag * Math.sin(angle);
      }

      samples[n] = sum / fftSize;
    }

    return samples;
  }

  /**
   * Apply spectral subtraction noise reduction
   */
  async reduceNoise(audioBuffer, options = {}) {
    const {
      reductionAmount = 0.7, // 0-1
      smoothing = 0.5,
      preserveHighFreq = true,
      onProgress = null
    } = options;

    if (!this.noiseProfile) {
      await this.autoDetectNoiseProfile(audioBuffer);
    }

    const sampleRate = audioBuffer.sampleRate;
    const fftSize = this.noiseProfile.fftSize;
    const hopSize = Math.floor(fftSize / 2);
    
    // Process each channel
    const processedChannels = [];
    
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      const processedData = new Float32Array(channelData.length);

      // Process in overlapping windows
      for (let i = 0; i < channelData.length - fftSize; i += hopSize) {
        const window = channelData.slice(i, i + fftSize);
        
        // Apply window function (Hann window)
        const windowedSamples = this.applyHannWindow(window);
        
        // FFT
        const fft = this.performFFT(windowedSamples, fftSize);
        
        // Spectral subtraction
        const cleanedMagnitudes = new Float32Array(fft.magnitudes.length);
        
        for (let k = 0; k < fft.magnitudes.length; k++) {
          const noiseMag = this.noiseProfile.magnitudes[k];
          const signalMag = fft.magnitudes[k];
          
          // Subtract noise with smoothing
          let cleanMag = signalMag - (noiseMag * reductionAmount);
          
          // Apply spectral flooring
          const floor = noiseMag * (1 - reductionAmount) * smoothing;
          cleanMag = Math.max(cleanMag, floor);
          
          // Preserve high frequencies if enabled
          if (preserveHighFreq && k > fft.magnitudes.length * 0.7) {
            cleanMag = signalMag;
          }
          
          cleanedMagnitudes[k] = cleanMag;
        }
        
        // Inverse FFT
        const cleanedSamples = this.performIFFT(cleanedMagnitudes, fft.phases, fftSize);
        
        // Overlap-add
        for (let j = 0; j < fftSize && i + j < processedData.length; j++) {
          processedData[i + j] += cleanedSamples[j] * 0.5; // Scale for overlap
        }

        if (onProgress) {
          onProgress({
            progress: (i / channelData.length) * 100,
            channel: channel + 1,
            totalChannels: audioBuffer.numberOfChannels
          });
        }
      }

      processedChannels.push(processedData);
    }

    // Create new audio buffer
    const cleanedBuffer = this.audioContext.createBuffer(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );

    processedChannels.forEach((data, index) => {
      cleanedBuffer.copyToChannel(data, index);
    });

    return cleanedBuffer;
  }

  /**
   * Apply Hann window function
   */
  applyHannWindow(samples) {
    const windowed = new Float32Array(samples.length);
    
    for (let i = 0; i < samples.length; i++) {
      const window = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (samples.length - 1)));
      windowed[i] = samples[i] * window;
    }
    
    return windowed;
  }

  /**
   * Apply adaptive noise gate
   */
  async applyNoiseGate(audioBuffer, options = {}) {
    const {
      threshold = -40, // dB
      attack = 0.001, // seconds
      release = 0.1, // seconds
      ratio = 10,
      onProgress = null
    } = options;

    const sampleRate = audioBuffer.sampleRate;
    const attackSamples = Math.floor(attack * sampleRate);
    const releaseSamples = Math.floor(release * sampleRate);

    const processedChannels = [];

    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      const processedData = new Float32Array(channelData.length);
      
      let gain = 1.0;
      const thresholdLinear = Math.pow(10, threshold / 20);

      for (let i = 0; i < channelData.length; i++) {
        const sample = Math.abs(channelData[i]);
        
        // Calculate target gain
        let targetGain = 1.0;
        if (sample < thresholdLinear) {
          targetGain = Math.pow(sample / thresholdLinear, ratio - 1);
        }

        // Smooth gain changes
        if (targetGain < gain) {
          // Attack
          gain = Math.max(targetGain, gain - 1 / attackSamples);
        } else {
          // Release
          gain = Math.min(targetGain, gain + 1 / releaseSamples);
        }

        processedData[i] = channelData[i] * gain;

        if (onProgress && i % 10000 === 0) {
          onProgress({
            progress: (i / channelData.length) * 100,
            channel: channel + 1,
            totalChannels: audioBuffer.numberOfChannels
          });
        }
      }

      processedChannels.push(processedData);
    }

    const gatedBuffer = this.audioContext.createBuffer(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );

    processedChannels.forEach((data, index) => {
      gatedBuffer.copyToChannel(data, index);
    });

    return gatedBuffer;
  }

  /**
   * Reduce background hum (50/60Hz and harmonics)
   */
  async removeHum(audioBuffer, options = {}) {
    const {
      fundamentalFreq = 60, // Hz (50 for EU, 60 for US)
      harmonics = 5,
      qFactor = 30,
      onProgress = null
    } = options;

    const processedChannels = [];

    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      let processedData = new Float32Array(channelData);

      // Create notch filters for fundamental and harmonics
      for (let h = 1; h <= harmonics; h++) {
        const frequency = fundamentalFreq * h;
        processedData = this.applyNotchFilter(processedData, frequency, audioBuffer.sampleRate, qFactor);

        if (onProgress) {
          onProgress({
            progress: ((h / harmonics) * 100) / audioBuffer.numberOfChannels,
            harmonic: h,
            totalHarmonics: harmonics,
            channel: channel + 1
          });
        }
      }

      processedChannels.push(processedData);
    }

    const cleanBuffer = this.audioContext.createBuffer(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );

    processedChannels.forEach((data, index) => {
      cleanBuffer.copyToChannel(data, index);
    });

    return cleanBuffer;
  }

  /**
   * Apply notch filter (IIR)
   */
  applyNotchFilter(samples, frequency, sampleRate, q) {
    const w0 = (2 * Math.PI * frequency) / sampleRate;
    const alpha = Math.sin(w0) / (2 * q);
    
    // Notch filter coefficients
    const b0 = 1;
    const b1 = -2 * Math.cos(w0);
    const b2 = 1;
    const a0 = 1 + alpha;
    const a1 = -2 * Math.cos(w0);
    const a2 = 1 - alpha;

    // Normalize
    const nb0 = b0 / a0;
    const nb1 = b1 / a0;
    const nb2 = b2 / a0;
    const na1 = a1 / a0;
    const na2 = a2 / a0;

    // Apply filter
    const filtered = new Float32Array(samples.length);
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;

    for (let i = 0; i < samples.length; i++) {
      const x0 = samples[i];
      const y0 = nb0 * x0 + nb1 * x1 + nb2 * x2 - na1 * y1 - na2 * y2;
      
      filtered[i] = y0;
      
      x2 = x1;
      x1 = x0;
      y2 = y1;
      y1 = y0;
    }

    return filtered;
  }

  /**
   * Process audio from video/audio element
   */
  async processAudio(mediaElement, options = {}) {
    this.initAudioContext();

    return new Promise(async (resolve, reject) => {
      try {
        // Fetch audio data
        const response = await fetch(mediaElement.src);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

        // Apply noise reduction
        let processedBuffer = audioBuffer;

        if (options.removeNoise !== false) {
          processedBuffer = await this.reduceNoise(processedBuffer, options);
        }

        if (options.applyGate !== false) {
          processedBuffer = await this.applyNoiseGate(processedBuffer, options);
        }

        if (options.removeHum !== false) {
          processedBuffer = await this.removeHum(processedBuffer, options);
        }

        resolve(processedBuffer);

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Convert AudioBuffer to Blob
   */
  async audioBufferToBlob(audioBuffer, options = {}) {
    const { mimeType = 'audio/wav' } = options;

    return new Promise((resolve, reject) => {
      try {
        const offlineContext = new OfflineAudioContext(
          audioBuffer.numberOfChannels,
          audioBuffer.length,
          audioBuffer.sampleRate
        );

        const source = offlineContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(offlineContext.destination);
        source.start();

        offlineContext.startRendering().then(renderedBuffer => {
          // Convert to WAV
          const wav = this.audioBufferToWav(renderedBuffer);
          const blob = new Blob([wav], { type: mimeType });
          resolve(blob);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Convert AudioBuffer to WAV format
   */
  audioBufferToWav(buffer) {
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numberOfChannels * bytesPerSample;

    const data = new Float32Array(buffer.length * numberOfChannels);
    
    // Interleave channels
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        data[i * numberOfChannels + channel] = buffer.getChannelData(channel)[i];
      }
    }

    const dataLength = data.length * bytesPerSample;
    const buffer_ = new ArrayBuffer(44 + dataLength);
    const view = new DataView(buffer_);

    // Write WAV header
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    this.writeString(view, 8, 'WAVE');
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);

    // Write audio data
    let offset = 44;
    for (let i = 0; i < data.length; i++) {
      const sample = Math.max(-1, Math.min(1, data[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }

    return buffer_;
  }

  /**
   * Write string to DataView
   */
  writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  /**
   * Get audio statistics
   */
  getAudioStatistics(audioBuffer) {
    const channelData = audioBuffer.getChannelData(0);
    
    let sum = 0;
    let sumSquares = 0;
    let peak = 0;

    for (let i = 0; i < channelData.length; i++) {
      const abs = Math.abs(channelData[i]);
      sum += abs;
      sumSquares += channelData[i] * channelData[i];
      peak = Math.max(peak, abs);
    }

    const mean = sum / channelData.length;
    const rms = Math.sqrt(sumSquares / channelData.length);
    const peakDb = 20 * Math.log10(peak);
    const rmsDb = 20 * Math.log10(rms);

    return {
      duration: audioBuffer.duration,
      sampleRate: audioBuffer.sampleRate,
      channels: audioBuffer.numberOfChannels,
      peak: peak.toFixed(4),
      peakDb: peakDb.toFixed(2),
      rms: rms.toFixed(4),
      rmsDb: rmsDb.toFixed(2),
      dynamicRange: (peakDb - rmsDb).toFixed(2)
    };
  }
}

// Singleton instance
let noiseReductionService = null;

/**
 * Get noise reduction service instance
 */
export function getNoiseReductionService() {
  if (!noiseReductionService) {
    noiseReductionService = new NoiseReductionService();
  }
  return noiseReductionService;
}

/**
 * Quick noise reduction
 */
export async function reduceNoise(audioBuffer, options = {}) {
  const service = getNoiseReductionService();
  return await service.reduceNoise(audioBuffer, options);
}

export default NoiseReductionService;
