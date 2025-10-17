/**
 * Video Transitions Utility
 * Provides fade, wipe, dissolve, and slide transitions between clips
 */

class VideoTransitionsManager {
  constructor() {
    this.transitionTypes = {
      fade: 'Fade',
      dissolve: 'Dissolve',
      wipeLeft: 'Wipe Left',
      wipeRight: 'Wipe Right',
      wipeUp: 'Wipe Up',
      wipeDown: 'Wipe Down',
      slideLeft: 'Slide Left',
      slideRight: 'Slide Right',
      slideUp: 'Slide Up',
      slideDown: 'Slide Down',
      crossfade: 'Crossfade',
      fadeToBlack: 'Fade to Black',
      fadeToWhite: 'Fade to White'
    };

    this.defaultDuration = 1.0; // seconds
  }

  /**
   * Apply transition between two video clips
   */
  async applyTransition(clip1Blob, clip2Blob, transitionType, duration = this.defaultDuration, onProgress) {
    // Validate inputs
    if (!(clip1Blob instanceof Blob)) {
      throw new Error('clip1Blob is not a valid Blob object');
    }
    if (!(clip2Blob instanceof Blob)) {
      throw new Error('clip2Blob is not a valid Blob object');
    }

    // Load both videos
    const video1 = await this.loadVideo(clip1Blob);
    const video2 = await this.loadVideo(clip2Blob);

    // Create canvas for rendering - use smaller resolution for faster processing
    const maxWidth = 1920;
    const maxHeight = 1080;
    const scale = Math.min(
      maxWidth / Math.max(video1.videoWidth, video2.videoWidth),
      maxHeight / Math.max(video1.videoHeight, video2.videoHeight),
      1
    );
    
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(Math.max(video1.videoWidth, video2.videoWidth) * scale);
    canvas.height = Math.floor(Math.max(video1.videoHeight, video2.videoHeight) * scale);
    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });

    // Calculate transition frames - use 30fps for smoother playback
    const fps = 30;
    const transitionFrames = Math.floor(duration * fps);

    // Setup MediaRecorder with optimized settings
    const stream = canvas.captureStream(fps);
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8') 
      ? 'video/webm;codecs=vp8'
      : 'video/webm';
    
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 2500000 // Lower bitrate for faster encoding
    });

    const chunks = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    return new Promise((resolve, reject) => {
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        resolve(blob);
      };

      mediaRecorder.onerror = reject;
      mediaRecorder.start(100); // Collect data every 100ms

      // Render combined video
      this.renderTransition(
        video1,
        video2,
        canvas,
        ctx,
        transitionType,
        transitionFrames,
        fps,
        onProgress
      ).then(() => {
        mediaRecorder.stop();
      }).catch(reject);
    });
  }

  /**
   * Render transition frames
   */
  async renderTransition(video1, video2, canvas, ctx, type, frames, fps, onProgress) {
    const clip1Duration = video1.duration;
    const clip2Duration = video2.duration;
    const transitionDuration = frames / fps;

    let currentFrame = 0;
    let totalFrames = Math.floor((clip1Duration + clip2Duration - transitionDuration) * fps);
    
    const frameInterval = 1000 / fps;
    let lastFrameTime = performance.now();

    const render = () => {
      return new Promise((resolve) => {
        const renderFrame = async () => {
          if (currentFrame >= totalFrames) {
            resolve();
            return;
          }

          const currentTime = currentFrame / fps;
          const transitionStart = clip1Duration - transitionDuration;

          if (currentTime < transitionStart) {
            // Before transition: show clip 1
            video1.currentTime = Math.min(currentTime, video1.duration - 0.01);
            await new Promise(r => {
              video1.onseeked = () => r();
              if (video1.readyState >= 2) r();
            });
            ctx.drawImage(video1, 0, 0, canvas.width, canvas.height);
          } else if (currentTime < clip1Duration) {
            // During transition
            const transitionProgress = (currentTime - transitionStart) / transitionDuration;
            const video1Time = Math.min(currentTime, video1.duration - 0.01);
            const video2Time = Math.max(0, currentTime - transitionStart);
            
            video1.currentTime = video1Time;
            video2.currentTime = Math.min(video2Time, video2.duration - 0.01);
            
            await Promise.all([
              new Promise(r => {
                video1.onseeked = () => r();
                if (video1.readyState >= 2) r();
              }),
              new Promise(r => {
                video2.onseeked = () => r();
                if (video2.readyState >= 2) r();
              })
            ]);

            this.renderTransitionFrame(
              ctx,
              video1,
              video2,
              canvas.width,
              canvas.height,
              type,
              transitionProgress
            );
          } else {
            // After transition: show clip 2
            const video2Time = Math.min(currentTime - transitionStart, video2.duration - 0.01);
            video2.currentTime = video2Time;
            await new Promise(r => {
              video2.onseeked = () => r();
              if (video2.readyState >= 2) r();
            });
            ctx.drawImage(video2, 0, 0, canvas.width, canvas.height);
          }

          currentFrame++;
          
          // Report progress
          if (onProgress && currentFrame % 10 === 0) {
            onProgress(Math.floor((currentFrame / totalFrames) * 100));
          }

          // Throttle rendering to match fps
          const now = performance.now();
          const elapsed = now - lastFrameTime;
          const delay = Math.max(0, frameInterval - elapsed);
          
          lastFrameTime = now + delay;
          
          setTimeout(() => {
            renderFrame();
          }, 0); // Use setTimeout 0 to allow UI updates
        };

        renderFrame();
      });
    };

    await render();
  }

  /**
   * Render specific transition frame
   */
  renderTransitionFrame(ctx, video1, video2, width, height, type, progress) {
    ctx.clearRect(0, 0, width, height);

    switch (type) {
      case 'fade':
      case 'dissolve':
      case 'crossfade':
        this.renderFade(ctx, video1, video2, width, height, progress);
        break;

      case 'wipeLeft':
        this.renderWipe(ctx, video1, video2, width, height, progress, 'left');
        break;

      case 'wipeRight':
        this.renderWipe(ctx, video1, video2, width, height, progress, 'right');
        break;

      case 'wipeUp':
        this.renderWipe(ctx, video1, video2, width, height, progress, 'up');
        break;

      case 'wipeDown':
        this.renderWipe(ctx, video1, video2, width, height, progress, 'down');
        break;

      case 'slideLeft':
        this.renderSlide(ctx, video1, video2, width, height, progress, 'left');
        break;

      case 'slideRight':
        this.renderSlide(ctx, video1, video2, width, height, progress, 'right');
        break;

      case 'slideUp':
        this.renderSlide(ctx, video1, video2, width, height, progress, 'up');
        break;

      case 'slideDown':
        this.renderSlide(ctx, video1, video2, width, height, progress, 'down');
        break;

      case 'fadeToBlack':
        this.renderFadeToColor(ctx, video1, video2, width, height, progress, '#000000');
        break;

      case 'fadeToWhite':
        this.renderFadeToColor(ctx, video1, video2, width, height, progress, '#FFFFFF');
        break;

      default:
        this.renderFade(ctx, video1, video2, width, height, progress);
    }
  }

  /**
   * Render fade/dissolve transition
   */
  renderFade(ctx, video1, video2, width, height, progress) {
    // Draw first video
    ctx.globalAlpha = 1 - progress;
    ctx.drawImage(video1, 0, 0, width, height);

    // Draw second video with increasing opacity
    ctx.globalAlpha = progress;
    ctx.drawImage(video2, 0, 0, width, height);

    ctx.globalAlpha = 1;
  }

  /**
   * Render wipe transition
   */
  renderWipe(ctx, video1, video2, width, height, progress, direction) {
    // Draw second video first (background)
    ctx.drawImage(video2, 0, 0, width, height);

    // Draw first video on top with clipping
    ctx.save();

    switch (direction) {
      case 'left':
        ctx.rect(width * progress, 0, width * (1 - progress), height);
        break;
      case 'right':
        ctx.rect(0, 0, width * (1 - progress), height);
        break;
      case 'up':
        ctx.rect(0, height * progress, width, height * (1 - progress));
        break;
      case 'down':
        ctx.rect(0, 0, width, height * (1 - progress));
        break;
    }

    ctx.clip();
    ctx.drawImage(video1, 0, 0, width, height);
    ctx.restore();
  }

  /**
   * Render slide transition
   */
  renderSlide(ctx, video1, video2, width, height, progress, direction) {
    let x1 = 0, y1 = 0, x2 = 0, y2 = 0;

    switch (direction) {
      case 'left':
        x1 = -width * progress;
        x2 = width * (1 - progress);
        break;
      case 'right':
        x1 = width * progress;
        x2 = -width * (1 - progress);
        break;
      case 'up':
        y1 = -height * progress;
        y2 = height * (1 - progress);
        break;
      case 'down':
        y1 = height * progress;
        y2 = -height * (1 - progress);
        break;
    }

    ctx.drawImage(video1, x1, y1, width, height);
    ctx.drawImage(video2, x2, y2, width, height);
  }

  /**
   * Render fade to color transition
   */
  renderFadeToColor(ctx, video1, video2, width, height, progress, color) {
    if (progress < 0.5) {
      // Fade out to color
      ctx.drawImage(video1, 0, 0, width, height);
      ctx.globalAlpha = progress * 2;
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, width, height);
      ctx.globalAlpha = 1;
    } else {
      // Fade in from color
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, width, height);
      ctx.globalAlpha = (progress - 0.5) * 2;
      ctx.drawImage(video2, 0, 0, width, height);
      ctx.globalAlpha = 1;
    }
  }

  /**
   * Load video from blob
   */
  loadVideo(blob) {
    return new Promise((resolve, reject) => {
      if (!(blob instanceof Blob)) {
        reject(new Error('Invalid blob: Expected Blob object'));
        return;
      }

      const video = document.createElement('video');
      let isSettled = false;
      let infinityCheckAttempted = false;
      
      try {
        video.src = URL.createObjectURL(blob);
      } catch (error) {
        reject(new Error(`Failed to create object URL: ${error.message}`));
        return;
      }

      video.muted = true;
      video.preload = 'metadata';
      
      const handleInfinityDuration = async () => {
        if (infinityCheckAttempted || isSettled) return;
        infinityCheckAttempted = true;
        
        console.log('⚠️ Video has Infinity duration, attempting workaround...');
        
        try {
          // For videos with Infinity duration, try to estimate by seeking
          // This is common with WebM files from MediaRecorder
          video.currentTime = 1e101; // Seek to a very large time
          
          await new Promise((res) => {
            const onSeeked = () => {
              video.removeEventListener('seeked', onSeeked);
              res();
            };
            video.addEventListener('seeked', onSeeked);
            setTimeout(res, 500); // Timeout in case seeked doesn't fire
          });
          
          // After seeking to end, currentTime should be the actual duration
          const estimatedDuration = video.currentTime;
          console.log('📏 Estimated duration from seek:', estimatedDuration);
          
          if (estimatedDuration > 0 && isFinite(estimatedDuration)) {
            // Reset to beginning
            video.currentTime = 0;
            
            // Monkey-patch the duration property
            Object.defineProperty(video, 'duration', {
              value: estimatedDuration,
              writable: false,
              configurable: true
            });
            
            if (!isSettled) {
              isSettled = true;
              console.log('✅ Video loaded with estimated duration:', estimatedDuration);
              resolve(video);
            }
          }
        } catch (error) {
          console.error('Failed to estimate duration:', error);
        }
      };
      
      const checkVideoReady = () => {
        if (isSettled) return;
        
        console.log('Checking video ready:', {
          duration: video.duration,
          readyState: video.readyState,
          isFinite: isFinite(video.duration)
        });
        
        // Check if video has valid duration and is seekable
        if (isFinite(video.duration) && video.duration > 0 && video.readyState >= 1) {
          isSettled = true;
          console.log('✅ Video loaded successfully, duration:', video.duration);
          resolve(video);
        } else if (video.duration === Infinity && video.readyState >= 2 && !infinityCheckAttempted) {
          // If duration is Infinity but video is loaded enough, try workaround
          handleInfinityDuration();
        }
      };
      
      video.onloadedmetadata = () => {
        console.log('loadedmetadata event fired');
        checkVideoReady();
      };
      
      video.onloadeddata = () => {
        console.log('loadeddata event fired');
        checkVideoReady();
      };
      
      video.oncanplay = () => {
        console.log('canplay event fired');
        checkVideoReady();
      };
      
      video.onerror = (e) => {
        if (isSettled) return;
        isSettled = true;
        reject(new Error(`Failed to load video: ${video.error?.message || 'Unknown error'}`));
      };
      
      // Timeout after 10 seconds
      setTimeout(() => {
        if (isSettled) return;
        
        // Last attempt for Infinity duration
        if (video.duration === Infinity && !infinityCheckAttempted) {
          handleInfinityDuration();
          // Give it 2 more seconds
          setTimeout(() => {
            if (!isSettled) {
              isSettled = true;
              const errorMsg = `Timeout loading video: duration=${video.duration}, readyState=${video.readyState}`;
              console.error(errorMsg);
              reject(new Error(errorMsg));
            }
          }, 2000);
        } else {
          isSettled = true;
          const errorMsg = `Timeout loading video: duration=${video.duration}, readyState=${video.readyState}`;
          console.error(errorMsg);
          reject(new Error(errorMsg));
        }
      }, 10000);
    });
  }

  /**
   * Create transition preview
   */
  async createPreview(clip1Blob, clip2Blob, transitionType, duration = 1.0) {
    // Validate inputs
    if (!(clip1Blob instanceof Blob)) {
      throw new Error('clip1Blob is not a valid Blob object');
    }
    if (!(clip2Blob instanceof Blob)) {
      throw new Error('clip2Blob is not a valid Blob object');
    }

    console.log('Loading video clips for preview...');
    const video1 = await this.loadVideo(clip1Blob);
    const video2 = await this.loadVideo(clip2Blob);
    
    console.log('Video 1 duration:', video1.duration, 'readyState:', video1.readyState);
    console.log('Video 2 duration:', video2.duration, 'readyState:', video2.readyState);

    // Validate video durations (should already be validated by loadVideo, but double-check)
    if (!isFinite(video1.duration) || video1.duration <= 0) {
      throw new Error(`Invalid duration for first video clip: ${video1.duration}`);
    }
    if (!isFinite(video2.duration) || video2.duration <= 0) {
      throw new Error(`Invalid duration for second video clip: ${video2.duration}`);
    }

    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 180;
    const ctx = canvas.getContext('2d');

    // Generate preview frames
    const frames = [];
    for (let i = 0; i <= 10; i++) {
      const progress = i / 10;
      
      // Calculate safe currentTime values
      const video1Time = Math.max(0, Math.min(video1.duration - duration, video1.duration - 0.1));
      video1.currentTime = video1Time;
      video2.currentTime = 0;

      await new Promise(resolve => setTimeout(resolve, 100));

      this.renderTransitionFrame(
        ctx,
        video1,
        video2,
        canvas.width,
        canvas.height,
        transitionType,
        progress
      );

      frames.push(canvas.toDataURL('image/jpeg', 0.7));
    }

    return frames;
  }

  /**
   * Get transition presets
   */
  getPresets() {
    return {
      quick: {
        duration: 0.5,
        type: 'fade'
      },
      standard: {
        duration: 1.0,
        type: 'crossfade'
      },
      smooth: {
        duration: 1.5,
        type: 'dissolve'
      },
      dramatic: {
        duration: 2.0,
        type: 'fadeToBlack'
      },
      slideshow: {
        duration: 0.8,
        type: 'slideLeft'
      },
      cinematic: {
        duration: 2.5,
        type: 'fadeToBlack'
      }
    };
  }

  /**
   * Batch apply transitions to multiple clips
   */
  async applyTransitionsToClips(clips, transitionType, duration, onProgress) {
    if (!clips || clips.length === 0) {
      throw new Error('No clips provided');
    }

    if (clips.length === 1) {
      if (onProgress) onProgress(100);
      return [clips[0]]; // Return as array with single clip
    }

    // Verify all clips are valid blobs
    for (let i = 0; i < clips.length; i++) {
      if (!(clips[i] instanceof Blob)) {
        throw new Error(`Clip ${i} is not a valid Blob`);
      }
    }

    // Process clips progressively
    let result = clips[0];
    const totalPairs = clips.length - 1;

    for (let i = 1; i < clips.length; i++) {
      const pairProgress = (progress) => {
        if (onProgress) {
          const overallProgress = Math.floor(
            ((i - 1) / totalPairs) * 100 + (progress / totalPairs)
          );
          onProgress(overallProgress);
        }
      };
      
      result = await this.applyTransition(result, clips[i], transitionType, duration, pairProgress);
    }

    if (onProgress) onProgress(100);
    return [result]; // Return as array for consistency
  }

  /**
   * Get available transition types
   */
  getTransitionTypes() {
    return this.transitionTypes;
  }
}

// Export singleton instance
const videoTransitions = new VideoTransitionsManager();
export default videoTransitions;
