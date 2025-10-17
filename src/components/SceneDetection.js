import React, { useState, useRef, useEffect } from 'react';
import './SceneDetection.css';

/**
 * SceneDetection Component
 * AI-powered scene detection using frame difference analysis
 * Features: Automatic scene cuts, chapter markers, timeline visualization
 */
const SceneDetection = ({ recording, onClose, onSave }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scenes, setScenes] = useState([]);
  const [progress, setProgress] = useState(0);
  const [sensitivity, setSensitivity] = useState(30);
  const [minSceneDuration, setMinSceneDuration] = useState(2);
  const [selectedScene, setSelectedScene] = useState(null);
  const [exportFormat, setExportFormat] = useState('chapters');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const previousFrameRef = useRef(null);

  // Initialize frame-differ WASM module (if available)
  const frameDifferRef = useRef(null);

  useEffect(() => {
    // Try to load WASM module
    const loadWasm = async () => {
      try {
        if (window.FrameDiffer) {
          frameDifferRef.current = new window.FrameDiffer();
          console.log('Frame-differ WASM loaded');
        }
      } catch (err) {
        console.log('WASM not available, using JavaScript fallback');
      }
    };
    loadWasm();
  }, []);

  const analyzeScenes = async () => {
    if (!videoRef.current) return;

    setIsAnalyzing(true);
    setScenes([]);
    setProgress(0);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    canvas.width = 320; // Analyze at lower resolution for speed
    canvas.height = 180;

    const detectedScenes = [];
    let currentSceneStart = 0;
    let frameCount = 0;
    const fps = 5; // Sample 5 frames per second
    const interval = 1 / fps;

    video.currentTime = 0;

    return new Promise((resolve) => {
      const processFrame = () => {
        if (video.currentTime >= video.duration) {
          // Add final scene
          if (video.duration - currentSceneStart >= minSceneDuration) {
            detectedScenes.push({
              id: detectedScenes.length,
              startTime: currentSceneStart,
              endTime: video.duration,
              duration: video.duration - currentSceneStart,
              thumbnail: captureFrameThumbnail(video, currentSceneStart)
            });
          }

          setScenes(detectedScenes);
          setIsAnalyzing(false);
          setProgress(100);
          resolve(detectedScenes);
          return;
        }

        // Draw current frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const currentFrame = ctx.getImageData(0, 0, canvas.width, canvas.height);

        if (previousFrameRef.current) {
          // Calculate frame difference
          const difference = frameDifferRef.current
            ? calculateDifferenceWasm(previousFrameRef.current, currentFrame)
            : calculateDifferenceJS(previousFrameRef.current.data, currentFrame.data);

          // Check if scene change detected
          if (difference > sensitivity) {
            const sceneDuration = video.currentTime - currentSceneStart;
            
            // Only add scene if it meets minimum duration
            if (sceneDuration >= minSceneDuration) {
              detectedScenes.push({
                id: detectedScenes.length,
                startTime: currentSceneStart,
                endTime: video.currentTime,
                duration: sceneDuration,
                thumbnail: captureFrameThumbnail(video, currentSceneStart),
                changeScore: difference
              });

              currentSceneStart = video.currentTime;
            }
          }
        }

        previousFrameRef.current = currentFrame;
        frameCount++;

        // Update progress
        const progressPercent = (video.currentTime / video.duration) * 100;
        setProgress(progressPercent);

        // Move to next frame
        video.currentTime = Math.min(video.currentTime + interval, video.duration);
        
        // Continue processing
        requestAnimationFrame(processFrame);
      };

      video.onseeked = () => {
        processFrame();
        video.onseeked = null;
      };

      video.currentTime = 0;
    });
  };

  const calculateDifferenceWasm = (frame1, frame2) => {
    // Use WASM module for fast calculation (if available)
    try {
      return frameDifferRef.current.compare(frame1, frame2);
    } catch (err) {
      return calculateDifferenceJS(frame1.data, frame2.data);
    }
  };

  const calculateDifferenceJS = (data1, data2) => {
    let diff = 0;
    const pixels = data1.length / 4;

    for (let i = 0; i < data1.length; i += 4) {
      const r = Math.abs(data1[i] - data2[i]);
      const g = Math.abs(data1[i + 1] - data2[i + 1]);
      const b = Math.abs(data1[i + 2] - data2[i + 2]);
      diff += (r + g + b) / 3;
    }

    return (diff / pixels) * 100 / 255; // Percentage
  };

  const captureFrameThumbnail = (video, time) => {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 160;
    tempCanvas.height = 90;
    const tempCtx = tempCanvas.getContext('2d');
    
    const originalTime = video.currentTime;
    video.currentTime = time;
    tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
    video.currentTime = originalTime;
    
    return tempCanvas.toDataURL('image/jpeg', 0.7);
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const jumpToScene = (scene) => {
    if (videoRef.current) {
      videoRef.current.currentTime = scene.startTime;
      setSelectedScene(scene);
    }
  };

  const mergeScenes = (index1, index2) => {
    const newScenes = [...scenes];
    const merged = {
      ...newScenes[index1],
      endTime: newScenes[index2].endTime,
      duration: newScenes[index2].endTime - newScenes[index1].startTime
    };
    
    newScenes[index1] = merged;
    newScenes.splice(index2, 1);
    
    // Reindex
    newScenes.forEach((scene, i) => scene.id = i);
    setScenes(newScenes);
  };

  const splitScene = (sceneIndex, splitTime) => {
    const newScenes = [...scenes];
    const scene = newScenes[sceneIndex];
    
    const scene1 = {
      id: scene.id,
      startTime: scene.startTime,
      endTime: splitTime,
      duration: splitTime - scene.startTime,
      thumbnail: scene.thumbnail
    };
    
    const scene2 = {
      id: scene.id + 1,
      startTime: splitTime,
      endTime: scene.endTime,
      duration: scene.endTime - splitTime,
      thumbnail: captureFrameThumbnail(videoRef.current, splitTime)
    };
    
    newScenes[sceneIndex] = scene1;
    newScenes.splice(sceneIndex + 1, 0, scene2);
    
    // Reindex
    newScenes.forEach((scene, i) => scene.id = i);
    setScenes(newScenes);
  };

  const deleteScene = (index) => {
    const newScenes = scenes.filter((_, i) => i !== index);
    newScenes.forEach((scene, i) => scene.id = i);
    setScenes(newScenes);
  };

  const exportChapters = () => {
    let output = '';
    
    if (exportFormat === 'chapters') {
      // YouTube chapter format
      output = 'Chapters:\n';
      scenes.forEach((scene, index) => {
        output += `${formatTime(scene.startTime)} - Scene ${index + 1}\n`;
      });
    } else if (exportFormat === 'json') {
      // JSON format for programmatic use
      output = JSON.stringify(scenes, null, 2);
    } else if (exportFormat === 'edl') {
      // Edit Decision List format
      scenes.forEach((scene, index) => {
        output += `${index + 1}  001  V  C  ${formatTime(scene.startTime)} ${formatTime(scene.endTime)} ${formatTime(scene.startTime)} ${formatTime(scene.endTime)}\n`;
      });
    }

    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${recording.name || 'recording'}_scenes.${exportFormat === 'json' ? 'json' : 'txt'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const createChapterMarkers = () => {
    // Add chapter markers to video metadata
    const recordingWithChapters = {
      ...recording,
      chapters: scenes.map(scene => ({
        time: scene.startTime,
        title: `Scene ${scene.id + 1}`
      }))
    };

    onSave(recordingWithChapters);
  };

  return (
    <div className="scene-detection-overlay">
      <div className="scene-detection-modal">
        <div className="scene-header">
          <h2>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
            AI Scene Detection
          </h2>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="scene-content">
          <div className="video-preview-section">
            <video
              ref={videoRef}
              src={recording.url}
              className="preview-video"
              controls
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {isAnalyzing && (
              <div className="analysis-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <p>Analyzing scenes... {Math.round(progress)}%</p>
              </div>
            )}
          </div>

          <div className="controls-panel">
            <div className="settings-group">
              <label>
                Sensitivity: {sensitivity}%
                <input
                  type="range"
                  min="10"
                  max="80"
                  value={sensitivity}
                  onChange={(e) => setSensitivity(parseInt(e.target.value))}
                  disabled={isAnalyzing}
                />
                <span className="range-hint">Higher = more scene cuts detected</span>
              </label>

              <label>
                Min Scene Duration: {minSceneDuration}s
                <input
                  type="range"
                  min="0.5"
                  max="10"
                  step="0.5"
                  value={minSceneDuration}
                  onChange={(e) => setMinSceneDuration(parseFloat(e.target.value))}
                  disabled={isAnalyzing}
                />
                <span className="range-hint">Minimum length of each scene</span>
              </label>
            </div>

            <div className="action-buttons">
              {!isAnalyzing ? (
                <button className="analyze-btn" onClick={analyzeScenes}>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14.25 2.1l-.35.32L8.5 7.83l-.35.32h1.07l3.87 3.87.52.52-.52.52-3.87 3.87H8.15l.35.32 5.4 5.41.35.32v-1.07l.52-.52 3.87-3.87.32-.35h-1.07l-.52-.52-3.87-3.87-.32-.35v1.07l-.52.52-3.87 3.87H7.08l.35-.32 5.4-5.41.32-.35v1.07l.52-.52 3.87-3.87.32-.35h-1.07l-.52-.52L12.4 3.17V2.1z" />
                  </svg>
                  Analyze Scenes
                </button>
              ) : (
                <button className="stop-analysis-btn" onClick={() => setIsAnalyzing(false)}>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="6" width="12" height="12" />
                  </svg>
                  Stop Analysis
                </button>
              )}
            </div>

            {scenes.length > 0 && (
              <div className="export-section">
                <h3>Export Options</h3>
                <select 
                  value={exportFormat} 
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="export-format-select"
                >
                  <option value="chapters">YouTube Chapters</option>
                  <option value="json">JSON Data</option>
                  <option value="edl">Edit Decision List</option>
                </select>

                <div className="export-actions">
                  <button onClick={exportChapters}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export Scenes
                  </button>
                  <button onClick={createChapterMarkers} className="save-btn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save with Chapters
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="scenes-timeline">
            <div className="timeline-header">
              <h3>Detected Scenes ({scenes.length})</h3>
              {scenes.length > 0 && (
                <span className="total-duration">
                  Total: {formatTime(recording.duration || 0)}
                </span>
              )}
            </div>

            {scenes.length === 0 ? (
              <div className="empty-scenes">
                <p>No scenes detected yet. Click "Analyze Scenes" to start.</p>
              </div>
            ) : (
              <div className="scenes-grid">
                {scenes.map((scene, index) => (
                  <div 
                    key={scene.id} 
                    className={`scene-card ${selectedScene?.id === scene.id ? 'selected' : ''}`}
                    onClick={() => jumpToScene(scene)}
                  >
                    <div className="scene-thumbnail">
                      {scene.thumbnail && <img src={scene.thumbnail} alt={`Scene ${index + 1}`} />}
                      <div className="scene-number">#{index + 1}</div>
                    </div>

                    <div className="scene-info">
                      <div className="scene-time">
                        {formatTime(scene.startTime)} - {formatTime(scene.endTime)}
                      </div>
                      <div className="scene-duration">
                        Duration: {scene.duration.toFixed(1)}s
                      </div>
                      {scene.changeScore && (
                        <div className="scene-score">
                          Change: {scene.changeScore.toFixed(1)}%
                        </div>
                      )}
                    </div>

                    <div className="scene-actions">
                      {index < scenes.length - 1 && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); mergeScenes(index, index + 1); }}
                          title="Merge with next"
                          className="action-btn"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                          </svg>
                        </button>
                      )}
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          const splitTime = (scene.startTime + scene.endTime) / 2;
                          splitScene(index, splitTime);
                        }}
                        title="Split scene"
                        className="action-btn"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteScene(index); }}
                        title="Delete scene"
                        className="action-btn delete"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SceneDetection;
