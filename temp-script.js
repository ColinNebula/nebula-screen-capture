
  import { onMount, onDestroy } from 'svelte';
  import { get } from 'svelte/store';
  import './VideoEditor.css';
  import { 
    saveSessionToIndexedDB, 
    getAllSessions, 
    getSessionById,
    deleteSessionById,
    exportSessionToFile,
    base64ToFile 
  } from '../utils/sessionManager.js';
  import { recordedVideos, screenshots } from '../stores/recording.js';
  import { addNotification } from '../stores/notifications.js';
  import TextOverlay from './TextOverlay.svelte';
  import TextOverlayEditor from './TextOverlayEditor.svelte';
  import KeyingMaskingPanel from './KeyingMaskingPanel.svelte';
  import VideoEditorHelp from './VideoEditorHelp.svelte';

  export let video = null;
  export let onClose = () => {};
  export let onSave = () => {};
  export let onOpenCreatorTools = () => {};

  let videoElement;
  let imagePreviewCanvas;
  let activeClipType = null; // 'video', 'image', or null when no preview
  let isPreviewingClip = false;
  let currentTime = 0;
  let duration = 0;
  let isPlaying = false;
  let playbackInterval = null;
  let trimStart = 0;
  let trimEnd = 0;
  let videoName = '';
  let showHelp = false;
  let isDraggingStart = false;
  let isDraggingEnd = false;
  let isDraggingPlayhead = false;
  let timelineElement;
  let isProcessing = false;
  let exportProgress = 0;
  let activeTab = 'trim'; // trim, filters, audio, effects, transitions, timeline, creator, keyframes, masks, scopes, wheels, speed, chroma, cinematic
  let showTemplatePreview = false;
  let previewTemplate = null;
  let isFooterExpanded = false;
  
  // Filters & Color Correction
  let filters = {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    blur: 0,
    hue: 0,
    // Advanced color correction
    temperature: 0, // -100 to 100 (blue to orange)
    tint: 0, // -100 to 100 (green to magenta)
    exposure: 0, // -100 to 100
    shadows: 0, // -100 to 100
    highlights: 0, // -100 to 100
    gamma: 1, // 0.1 to 3
    // Professional color grading
    vibrance: 0, // -100 to 100 (smart saturation)
    clarity: 0, // -100 to 100 (local contrast)
    // Film looks
    filmGrain: 0, // 0 to 100
    bleachBypass: 0, // 0 to 100
    channelMixer: { red: 100, green: 100, blue: 100 }, // RGB channel control
    // Creative filters
    sepia: 0, // 0 to 100
    grayscale: 0, // 0 to 100
    invert: 0, // 0 to 100
    posterize: 0, // 0 to 32 (color levels)
  };
  
  // Filter presets
  let filterPresets = {
    none: { name: 'None', description: 'Original' },
    cinematic: { name: 'Cinematic', description: 'Film-like color grading' },
    vivid: { name: 'Vivid', description: 'Enhanced colors' },
    vintage: { name: 'Vintage', description: 'Old film look' },
    dramatic: { name: 'Dramatic', description: 'High contrast B&W' },
    warm: { name: 'Warm', description: 'Golden hour' },
    cool: { name: 'Cool', description: 'Blue tones' },
    dream: { name: 'Dream', description: 'Soft and ethereal' },
    noir: { name: 'Film Noir', description: 'Classic black & white' },
    bleach: { name: 'Bleach Bypass', description: 'Desaturated film look' },
    cyberpunk: { name: 'Cyberpunk', description: 'Neon vibes' },
    sunset: { name: 'Sunset', description: 'Warm orange glow' },
  };
  let selectedFilterPreset = 'none';
  
  // Effects
  let effects = {
    zoom: 1, // 1 to 3
    zoomX: 50, // 0 to 100 (center point)
    zoomY: 50, // 0 to 100 (center point)
    vignette: 0, // 0 to 100
    noise: 0, // 0 to 100
    sharpen: 0, // 0 to 100
    // Advanced effects
    chromaticAberration: 0, // 0 to 100 (RGB shift)
    glitch: 0, // 0 to 100 (digital glitch)
    pixelate: 0, // 0 to 50 (pixel size)
    kaleidoscope: 0, // 0 to 12 (segments)
    mirror: 'none', // none, horizontal, vertical, both
    rotation: 0, // -180 to 180 degrees
    flip: { horizontal: false, vertical: false },
    // Lens effects
    fishEye: 0, // 0 to 100
    bulge: 0, // -100 to 100
    // Borders and frames
    border: { enabled: false, width: 0, color: '#000000', style: 'solid' },
    cornerRadius: 0, // 0 to 50 (rounded corners)
    // Motion effects
    motionBlur: 0, // 0 to 100
    shake: 0, // 0 to 100 (camera shake)
    // Color effects
    duotone: { enabled: false, color1: '#000000', color2: '#ffffff' },
    colorSplash: { enabled: false, hue: 0, tolerance: 30 }, // Keep one color, desaturate rest
  };
  
  // Transitions
  let transitions = {
    fadeIn: 0, // seconds
    fadeOut: 0, // seconds
    fadeInType: 'black', // black, white, transparent
    fadeOutType: 'black',
    // Advanced transitions
    slideDirection: 'none', // none, left, right, up, down
    slideIn: 0, // seconds
    slideOut: 0, // seconds
    zoom: { in: 0, out: 0 }, // Zoom transitions in seconds
    wipe: { enabled: false, direction: 'left', duration: 1 }, // left, right, up, down, diagonal
    dissolve: 0, // Cross-dissolve duration
    // Creative transitions
    circularReveal: 0, // Circle wipe duration
    pageFlip: 0, // 3D page flip duration
    blur: 0, // Blur transition duration
    pixelate: 0, // Pixelate transition duration
    glitch: 0, // Glitch transition duration
    // Color transitions
    colorFade: { enabled: false, color: '#000000', duration: 1 },
  };
  
  // Transition presets
  let transitionPresets = {
    none: { name: 'None', description: 'No transition' },
    crossfade: { name: 'Cross Fade', description: 'Smooth blend' },
    fadeBlack: { name: 'Fade to Black', description: 'Classic fade' },
    fadeWhite: { name: 'Fade to White', description: 'Bright fade' },
    slideLeft: { name: 'Slide Left', description: 'Push from right' },
    slideRight: { name: 'Slide Right', description: 'Push from left' },
    slideUp: { name: 'Slide Up', description: 'Push from bottom' },
    slideDown: { name: 'Slide Down', description: 'Push from top' },
    zoomIn: { name: 'Zoom In', description: 'Scale up reveal' },
    zoomOut: { name: 'Zoom Out', description: 'Scale down reveal' },
    wipeLeft: { name: 'Wipe Left', description: 'Linear wipe' },
    wipeRight: { name: 'Wipe Right', description: 'Linear wipe' },
    circleReveal: { name: 'Circle Reveal', description: 'Radial wipe' },
    pageFlip: { name: 'Page Flip', description: '3D flip effect' },
    blurTransition: { name: 'Blur', description: 'Defocus transition' },
    glitchTransition: { name: 'Glitch', description: 'Digital distortion' },
    // NEW Professional Transitions
    starWipe: { name: '⭐ Star Wipe', description: 'Classic star reveal' },
    barnDoors: { name: '🚪 Barn Doors', description: 'Doors opening effect' },
    venetianBlinds: { name: '🪟 Venetian Blinds', description: 'Horizontal slats reveal' },
  };
  let selectedTransitionPreset = 'none';
  
  // Audio
  let volume = 100;
  let playbackSpeed = 1;
  let audioNormalize = false;
  let audioEnhance = false;
  let showAudioWaveform = true; // Show waveform in timeline
  let audioViewMode = 'waveform'; // 'waveform' or 'spectral' - NEW spectral view
  
  // Enhanced sequencer features
  let autoScrollWithPlayhead = true;
  let showClipLabels = true;
  let showTimecodeOverlay = true;
  let selectedClipIds = new Set(); // Multi-selection
  let clipMarkers = {}; // { clipId: [{ id, time, label, color, note, type }] }
  let showMarkerEditor = false;
  let editingMarker = null;
  let markerTypes = {
    default: { icon: '📍', color: '#f59e0b', name: 'Default' },
    chapter: { icon: '📖', color: '#3b82f6', name: 'Chapter' },
    beat: { icon: '🎵', color: '#ec4899', name: 'Beat' },
    cut: { icon: '✂️', color: '#ef4444', name: 'Cut Point' },
    note: { icon: '📝', color: '#10b981', name: 'Note' },
    warning: { icon: '⚠️', color: '#f97316', name: 'Warning' },
  };
  
  // Context Menu for Timeline Clips
  let showContextMenu = false;
  let contextMenuX = 0;
  let contextMenuY = 0;
  let contextMenuClip = null;
  let contextMenuTrack = null;
  
  // Keyframe Animation System
  let keyframes = {}; // { clipId: { property: [{ time, value, easing }] } }
  let selectedKeyframeProperty = 'position'; // position, scale, rotation, opacity
  let selectedEasingType = 'easeInOut'; // For the next keyframe to be added
  let keyframeEasing = 'linear'; // linear, easeIn, easeOut, easeInOut, bezier
  let showKeyframeEditor = false;
  let keyframeProperties = {
    position: { label: '📐 Position', type: 'vector2', default: { x: 0, y: 0 }, min: -1000, max: 1000 },
    scale: { label: '📏 Scale', type: 'vector2', default: { x: 1, y: 1 }, min: 0.1, max: 5 },
    rotation: { label: '🔄 Rotation', type: 'number', default: 0, min: -360, max: 360 },
    opacity: { label: '👁️ Opacity', type: 'number', default: 1, min: 0, max: 1 },
  };
  let easingTypes = {
    linear: { name: 'Linear', curve: 'linear' },
    easeIn: { name: 'Ease In', curve: 'cubic-bezier(0.42, 0, 1, 1)' },
    easeOut: { name: 'Ease Out', curve: 'cubic-bezier(0, 0, 0.58, 1)' },
    easeInOut: { name: 'Ease In-Out', curve: 'cubic-bezier(0.42, 0, 0.58, 1)' },
  };
  
  // LUT (Look-Up Table) Support
  let luts = []; // Array of loaded LUT objects
  let selectedLUT = null;
  let selectedLUTId = 'none'; // Currently selected LUT ID
  let lutEnabled = false; // Enable/disable LUT application
  let lutIntensity = 100; // 0-100%
  let showLUTBrowser = false;
  let builtInLUTs = {
    none: { name: 'None', description: 'No LUT applied' },
    cinematic: { name: 'Cinematic', description: 'Film-like color grading', data: null },
    tealOrange: { name: 'Teal & Orange', description: 'Blockbuster look', data: null },
    vintage: { name: 'Vintage Film', description: 'Classic film stock', data: null },
    bleachBypass: { name: 'Bleach Bypass', description: 'Desaturated silver look', data: null },
    moody: { name: 'Moody Dark', description: 'Dark atmospheric', data: null },
  };
  
  // Masks & Rotoscoping
  let masks = []; // Array of mask objects
  let selectedMaskId = null;
  let selectedMaskType = 'rectangle'; // For UI selector
  let maskDrawMode = 'none'; // none, rectangle, ellipse, polygon, freehand
  let maskFeather = 10; // 0-100 px
  let maskInvert = false;
  let showMaskEditor = false;
  let maskTypes = {
    rectangle: { icon: '⬜', name: 'Rectangle' },
    ellipse: { icon: '⭕', name: 'Ellipse' },
    polygon: { icon: '⬢', name: 'Polygon' },
    freehand: { icon: '✏️', name: 'Freehand' },
  };
  
  // Advanced Audio Processing
  let audioEQ = {
    enabled: false,
    lowGain: 0, // -12 to +12 dB
    midGain: 0,
    highGain: 0,
    lowFreq: 250, // Hz
    midFreq: 1000,
    highFreq: 4000,
  };
  let audioCompressor = {
    enabled: false,
    threshold: -24, // dB
    ratio: 4, // 1-20
    attack: 3, // ms
    release: 250, // ms
    knee: 30, // dB
    makeupGain: 0, // dB
  };
  let audioEffects = {
    reverb: { enabled: false, roomSize: 0.5, damping: 0.5, wetLevel: 0.3 },
    delay: { enabled: false, delayTime: 0.5, feedback: 0.3, wetLevel: 0.3 },
    gate: { enabled: false, threshold: -40, ratio: 10, attack: 1, release: 100 },
  };
  let showAudioProcessor = false;
  let trackColors = {
    video: '#667eea',
    audio: '#10b981',
    effects: '#f59e0b'
  };
  let loopPlayback = false;
  let loopStart = 0;
  let loopEnd = 0;
  
  // Advanced color grading
  let colorCurves = {
    rgb: Array(256).fill(0).map((_, i) => i), // Linear by default
    red: Array(256).fill(0).map((_, i) => i),
    green: Array(256).fill(0).map((_, i) => i),
    blue: Array(256).fill(0).map((_, i) => i),
  };
  let showColorCurves = false;
  
  // Chroma Key (Green Screen)
  let chromaKey = {
    enabled: false,
    color: '#00ff00', // Green by default
    similarity: 0.4, // 0-1
    smoothness: 0.1, // 0-1
    spill: 0.1, // Spill suppression 0-1
    // Enhanced controls
    edgeRefinement: 0.5, // 0-1 (edge feathering quality)
    lightWrap: 0, // 0-1 (blend edges with key color for realistic lighting)
    despill: 0.5, // 0-1 (remove color cast from edges)
    coreMatteStrength: 0.8, // 0-1 (opacity of core key)
    despillMode: 2, // 0=none, 1=simple, 2=advanced
  };
  
  // Advanced Keying & Masking
  let keyingMasking = {
    // Luma Key
    lumaKey: {
      enabled: false,
      threshold: 0.5, // 0-1
      tolerance: 0.1, // 0-1
      invert: false, // Remove bright instead of dark
    },
    // Difference Matte
    differenceMatte: {
      enabled: false,
      referenceFrame: null, // ImageData of reference frame
      threshold: 0.3, // 0-1
      tolerance: 0.1, // 0-1
    },
    // Color Range Key
    colorRangeKey: {
      enabled: false,
      hueCenter: 120, // 0-360 (green by default)
      hueRange: 30, // 0-180
      satMin: 0.3, // 0-1
      satMax: 1.0, // 0-1
      valMin: 0.3, // 0-1
      valMax: 1.0, // 0-1
      softness: 0.1, // 0-1
    },
    // Mask Post-Processing
    maskPostProcess: {
      feather: 0, // 0-50 pixels
      expansion: 0, // -20 to 20 pixels
      refineEdges: 0, // 0-1 strength
    },
  };
  
  // Bezier Masks & Rotoscoping
  let bezierMasks = []; // Array of { id, name, frames: Map<frameNum, BezierMask>, visible, locked }
  let selectedBezierMaskId = null;
  let rotoscopingMode = false; // Enable frame-by-frame editing
  let currentBezierMask = null; // Currently editing mask
  let bezierDrawMode = 'select'; // select, draw, edit-points, edit-curves
  let bezierMaskInterpolation = 'linear'; // linear, bezier, hold
  let showBezierMaskPanel = false;
  let maskKeyframes = new Map(); // frame -> mask data
  
  // Motion Tracking
  let motionTracking = {
    enabled: false,
    tracks: [], // Array of tracking data
    selectedTrackId: null,
    trackingMode: 'single-point', // single-point, planar
    stabilize: false, // Apply stabilization to tracking
    smoothing: 5, // 1-10 frames
  };
  let showMotionTrackingPanel = false;
  let isTracking = false; // Currently tracking
  
  // Video Stabilization
  let stabilization = {
    enabled: false,
    strength: 50, // 0-100
    smoothing: 50, // 0-100
  };
  
  // Keyboard shortcuts help
  let showKeyboardShortcuts = false;
  
  // Undo/Redo history
  let history = [];
  let historyIndex = -1;
  const MAX_HISTORY = 50; // Keep last 50 states
  
  // Render queue for batch exports
  let renderQueue = []; // Array of {id, name, format, quality, status, progress, error}
  let showRenderQueue = false;
  let exportTemplates = {
    youtube4k: { name: 'YouTube 4K', format: 'mp4', width: 3840, height: 2160, bitrate: 45000000, fps: 60 },
    youtube1080p: { name: 'YouTube 1080p', format: 'mp4', width: 1920, height: 1080, bitrate: 8000000, fps: 60 },
    instagram: { name: 'Instagram Post', format: 'mp4', width: 1080, height: 1080, bitrate: 5000000, fps: 30 },
    instagramStory: { name: 'Instagram Story', format: 'mp4', width: 1080, height: 1920, bitrate: 5000000, fps: 30 },
    tiktok: { name: 'TikTok', format: 'mp4', width: 1080, height: 1920, bitrate: 6000000, fps: 30 },
    twitter: { name: 'Twitter', format: 'mp4', width: 1280, height: 720, bitrate: 5000000, fps: 30 },
    webOptimized: { name: 'Web Optimized', format: 'webm', width: 1920, height: 1080, bitrate: 4000000, fps: 30 },
    proRes: { name: 'ProRes (High Quality)', format: 'mov', width: 1920, height: 1080, bitrate: 120000000, fps: 60 },
  };
  let selectedExportTemplate = 'youtube1080p';
  
  // Export output path
  let outputPath = '';
  let outputFileName = '';
  
  // Watermark
  let watermark = {
    enabled: false,
    text: '',
    position: 'bottom-right', // top-left, top-right, bottom-left, bottom-right, center
    size: 24,
    opacity: 80,
    color: '#ffffff',
  };
  
  // Multi-clip timeline (for outliner/media bin)
  let clips = [];
  let selectedClipIndex = 0;
  let fileInputElement = null;
  let showOutliner = true;
  let showPropertiesPanel = true;
  
  // Color image creation
  let showColorImageModal = false;
  let colorImageSettings = {
    color: '#000000',
    width: 1920,
    height: 1080,
    duration: 5 // seconds
  };
  
  // Text overlays
  let textOverlays = [];
  let selectedOverlayIndex = null;
  let showTextOverlayEditor = false;
  
  // ============ PROFESSIONAL CINEMATIC FEATURES ============
  
  // Color Scopes & Analysis
  let showColorScopes = false;
  let activeScopeTab = 'waveform'; // waveform, vectorscope, histogram, parade
  let scopeCanvas = null;
  let scopeSize = 'medium'; // small, medium, large
  
  // Color Wheels (Lift, Gamma, Gain)
  let colorWheels = {
    lift: { r: 0, g: 0, b: 0, master: 0 }, // Shadows (-1 to 1)
    gamma: { r: 0, g: 0, b: 0, master: 0 }, // Midtones (-1 to 1)
    gain: { r: 0, g: 0, b: 0, master: 0 }, // Highlights (-1 to 1)
    offset: 0, // Global offset (-100 to 100)
  };
  let showColorWheels = false;
  let activeColorWheel = 'gamma'; // lift, gamma, gain
  
  // Speed Control & Time Remapping
  let speedControl = {
    enabled: false,
    speed: 1.0, // 0.1x to 10x
    rampEnabled: false, // Speed ramping
    rampPoints: [], // [{time, speed}]
    interpolation: 'smooth', // linear, smooth, hold
    frameBlending: true, // Smooth slow-motion
    reversePlayback: false,
    freezeFrame: false,
    freezeTime: 0,
  };
  let showSpeedRampEditor = false;
  
  // Advanced Chroma Key (Professional Green Screen)
  let advancedChromaKey = {
    enabled: false,
    keyColor: '#00ff00',
    tolerance: 0.4, // How much color variation to key
    softness: 0.2, // Edge softness
    despill: 0.5, // Remove green/blue spill
    spillSuppress: 'green', // green, blue, custom
    edgeThickness: 2, // px
    edgeFeather: 5, // px
    preBlur: 0, // Blur before keying (0-10px)
    postBlur: 0, // Blur matte after keying (0-10px)
    coreTransparency: 0, // Make center more/less transparent
    edgeTransparency: 100, // Edge transparency
    lightWrap: 0, // Wrap background light onto edges (0-100)
    spillRange: 0.3, // Range for spill suppression
    // Advanced settings
    maskContrast: 1.0, // Increase matte contrast
    maskGamma: 1.0, // Adjust matte gamma
    chokeExpand: 0, // Shrink/grow matte (-10 to 10)
    previewMode: 'final', // final, matte, edges, original
  };
  
  // Lens Flare Effects
  let lensFlare = {
    enabled: false,
    type: 'cinematic', // cinematic, anamorphic, sun, custom
    intensity: 50, // 0-100
    position: { x: 50, y: 50 }, // Percentage
    scale: 1.0,
    rotation: 0,
    color: '#ffffff',
    chromatic: 30, // Chromatic aberration amount
    animated: false,
    animationPath: [], // [{time, x, y}]
  };
  
  // Film Look & Grain
  let filmLook = {
    enabled: false,
    filmStock: '35mm', // 35mm, 16mm, 8mm, super8
    grainIntensity: 50, // 0-100
    grainSize: 1.0, // 0.5-3.0
    halation: 0, // Light bloom (0-100)
    gateWeave: 0, // Camera shake (0-100)
    scratches: 0, // Film scratches (0-100)
    dust: 0, // Dust particles (0-100)
    vignette: 0, // Edge darkening (0-100)
  };
  
  // Anamorphic Lens Simulation
  let anamorphic = {
    enabled: false,
    squeeze: 1.33, // 1.33x, 1.5x, 2.0x
    aspectRatio: '2.39:1', // Cinemascope
    bokehOval: true, // Oval bokeh shapes
    horizontalFlare: true, // Characteristic horizontal flares
    blueFlare: 30, // Blue flare intensity
    lensDistortion: 0, // Barrel/pincushion distortion
  };
  
  // Depth of Field / Bokeh
  let depthOfField = {
    enabled: false,
    focusDistance: 50, // 0-100 (percentage of frame)
    focalLength: 50, // 18-200mm equivalent
    aperture: 2.8, // f-stop (1.4 - 22)
    blurAmount: 50, // Overall blur strength
    bokehShape: 'hexagon', // circle, hexagon, octagon, custom
    bokehRotation: 0,
    chromaticAberration: 0, // Color fringing on bokeh
  };
  
  // Camera Movement Effects
  let cameraEffects = {
    shake: {
      enabled: false,
      intensity: 50, // 0-100
      frequency: 10, // Shake speed
      type: 'handheld', // handheld, earthquake, explosion, subtle
    },
    dollyZoom: {
      enabled: false,
      startFocalLength: 50,
      endFocalLength: 20,
      duration: 3, // seconds
    },
  };
  
  // Cinematic Aspect Ratios & Crop
  let aspectRatio = {
    enabled: false,
    ratio: '16:9', // 16:9, 21:9, 2.39:1, 1.85:1, 4:3, 1:1, 9:16
    cropType: 'letterbox', // letterbox, pillarbox, crop
    overlayOpacity: 80, // Overlay darkness for cropped areas
  };
  const aspectRatioPresets = {
    '16:9': { width: 16, height: 9, name: 'Standard HD/4K' },
    '21:9': { width: 21, height: 9, name: 'Ultra-Wide' },
    '2.39:1': { width: 2.39, height: 1, name: 'Anamorphic Cinema' },
    '1.85:1': { width: 1.85, height: 1, name: 'Theatrical' },
    '4:3': { width: 4, height: 3, name: 'Classic TV' },
    '1:1': { width: 1, height: 1, name: 'Instagram' },
    '9:16': { width: 9, height: 16, name: 'Vertical/TikTok' },
  };
  
  // Professional Audio Meters
  let audioMeters = {
    enabled: true,
    type: 'peak', // peak, rms, lufs
    stereo: true,
    targetLoudness: -16, // LUFS (broadcast standard)
    peakLimit: -3, // dBFS
  };
  
  // Multi-track Audio Visualization
  let audioWaveform = {
    enabled: true,
    height: 60, // px
    color: '#10b981',
    opacity: 80,
    style: 'bars', // bars, waveform, spectrogram
  };
  
  // Frame Rate & Timing
  let frameRateControl = {
    inputFps: 30, // Detected from source
    outputFps: 30, // Target output
    conversion: 'blend', // blend, duplicate, optical
    timecode: {
      enabled: false,
      format: 'HH:MM:SS:FF', // Hours:Minutes:Seconds:Frames
      dropFrame: false,
      burnIn: false, // Burn into video
      position: 'top-left',
    },
  };
  
  // ProRes & Professional Codecs
  let professionalExport = {
    codec: 'h264', // h264, h265, prores, dnxhd, utvideo
    proResProfile: '422HQ', // Proxy, LT, 422, 422HQ, 4444, 4444XQ
    bitDepth: 8, // 8, 10, 12
    colorSpace: 'rec709', // rec709, rec2020, dci-p3
    colorRange: 'limited', // limited, full
    pixelFormat: 'yuv420p', // yuv420p, yuv422p, yuv444p
    hdrMetadata: {
      enabled: false,
      maxCLL: 1000, // Max Content Light Level (nits)
      maxFALL: 400, // Max Frame Average Light Level (nits)
    },
  };
  
  // Broadcast Safe & Legalizer
  let broadcastSafe = {
    enabled: false,
    standard: 'ntsc', // ntsc, pal, hd
    legalizeColors: true,
    maxLuma: 235, // 0-255
    minLuma: 16,
    maxChroma: 240,
  };
  
  // Motion Blur (Cinematic)
  let motionBlur = {
    enabled: false,
    shutterAngle: 180, // 45-360 degrees (180° = natural)
    samples: 5, // Quality (1-10)
  };
  
  // ============ END CINEMATIC FEATURES ============

  
  // Multi-track sequencer - Unlimited tracks support
  let tracks = [
    { id: 1, type: 'video', name: 'Video 1', clips: [], muted: false, solo: false, locked: false, visible: true, height: 80, group: 'main' },
    { id: 2, type: 'video', name: 'Video 2', clips: [], muted: false, solo: false, locked: false, visible: true, height: 80, group: 'main' },
    { id: 3, type: 'video', name: 'Video 3', clips: [], muted: false, solo: false, locked: false, visible: true, height: 80, group: 'overlay' },
    { id: 4, type: 'video', name: 'Video 4', clips: [], muted: false, solo: false, locked: false, visible: true, height: 80, group: 'overlay' },
    { id: 5, type: 'audio', name: 'Audio 1', clips: [], muted: false, solo: false, locked: false, visible: true, height: 60, group: 'dialog' },
    { id: 6, type: 'audio', name: 'Audio 2', clips: [], muted: false, solo: false, locked: false, visible: true, height: 60, group: 'music' },
    { id: 7, type: 'audio', name: 'Audio 3', clips: [], muted: false, solo: false, locked: false, visible: true, height: 60, group: 'sfx' },
    { id: 8, type: 'effects', name: 'Effects', clips: [], muted: false, solo: false, locked: false, visible: true, height: 50, group: 'fx' },
  ];
  
  // Track groups for better organization
  let trackGroups = [
    { id: 'main', name: '🎬 Main Video', collapsed: false, color: '#667eea' },
    { id: 'overlay', name: '✨ Overlays', collapsed: false, color: '#764ba2' },
    { id: 'dialog', name: '🎤 Dialog', collapsed: false, color: '#10b981' },
    { id: 'music', name: '🎵 Music', collapsed: false, color: '#f59e0b' },
    { id: 'sfx', name: '🔊 Sound FX', collapsed: false, color: '#ef4444' },
    { id: 'fx', name: '⚡ Effects', collapsed: false, color: '#8b5cf6' },
  ];
  
  let maxTracks = 100; // Maximum allowed tracks
  let showTrackManager = false; // Toggle for advanced track management panel
  let selectedTrackId = 1;
  let selectedClipId = null;
  let draggingClip = null;
  let dragOffset = 0;
  let draggingFromOutliner = null; // Track clip being dragged from outliner
  let dropTargetTrackId = null; // Highlight track while dragging over it
  let magneticSnapping = true;
  let snapDistance = 0.5; // seconds - adjustable snap threshold
  let showMagneticGuides = true; // Visual feedback for snap points
  let activeSnapGuides = []; // Array of visible snap guide positions
  let rippleEdit = false;
  let sequencerPixelsPerSecond = 100; // Pixels per second for sequencer timeline
  let horizontalZoom = 0.25; // Horizontal zoom multiplier (0.25x to 4x) - Start zoomed out
  let fadeOpacity = 1; // Combined opacity from global and per-clip transitions
  
  // Sequencer dragging (vertical resize)
  let isDraggingSequencer = false;
  let sequencerDragStartY = 0;
  let sequencerInitialHeight = 0;
  
  // Minimize state
  let isMinimized = false;
  let minimizedProgress = 0; // For intelligent display
  $: minimizedProgress = isMinimized && duration > 0 ? (currentTime / duration) * 100 : 0;
  
  // Computed pixels per second based on horizontal zoom
  $: effectivePixelsPerSecond = sequencerPixelsPerSecond * horizontalZoom;
  
  // Calculate total height of all visible tracks for playhead
  $: totalTracksHeight = tracks.filter(t => t.visible).reduce((sum, t) => sum + (t.height || 60), 0);
  
  // Reactive computed selected clip (prevents undefined access errors)
  $: currentSelectedClip = (() => {
    if (!selectedClipId) return null;
    const track = tracks.find(t => t.id === selectedTrackId);
    if (!track) return null;
    return track.clips.find(c => c.id === selectedClipId) || null;
  })();
  
  // Timeline zoom/scale settings
  let timelineZoom = 1; // 0.5 (zoomed out) to 4 (zoomed in)
  let timelineFrameDensity = 30; // frames to show (adjustable)
  let showFrameNumbers = true;
  let snapToFrames = false;
  
  // Export settings
  let exportFormat = 'webm'; // webm, mp4, mov, avi, mkv, hevc, prores, dnxhd, mxf, vp8
  let exportQuality = 'high'; // low, medium, high, youtube, instagram, twitter
  let exportType = 'video'; // video, audio, frames, gif
  let showExportOptions = false;
  let showSaveOptions = false;
  let audioFormat = 'mp3'; // mp3, wav, ogg
  let frameRate = 30;
  let gifFps = 10;
  
  // Image sequence settings
  let showImageSequenceDialog = false;
  let pendingImageSequence = [];
  let sequenceFrameRate = 24;
  let sequenceName = 'Image Sequence';
  
  // Computed values for timeline display
  $: visibleFrameCount = Math.ceil(duration * frameRate * timelineZoom);
  $: frameInterval = timelineZoom <= 1 ? 1 : Math.floor(1 / timelineZoom);
  $: rulerInterval = timelineZoom >= 2 ? 0.5 : timelineZoom >= 1 ? 1 : 2;
  
  // Quality presets
  const qualityPresets = {
    low: { width: 640, height: 360, bitrate: 1000000, fps: 24 },
    medium: { width: 1280, height: 720, bitrate: 3000000, fps: 30 },
    high: { width: 1920, height: 1080, bitrate: 8000000, fps: 30 },
    youtube: { width: 1920, height: 1080, bitrate: 8000000, fps: 60 },
    instagram: { width: 1080, height: 1080, bitrate: 5000000, fps: 30 },
    twitter: { width: 1280, height: 720, bitrate: 5000000, fps: 30 },
  };

  $: if (video && clips.length === 0) {
    videoName = video.name || 'Untitled Recording';
    trimStart = 0;
    trimEnd = duration;
    
    // Detect if it's a screenshot or image based on type or mimeType
    const isScreenshot = video.type === 'screenshot' || video.mimeType === 'image/png' || video.mimeType?.startsWith('image/');
    const clipType = isScreenshot ? 'screenshot' : 'video';
    
    const newClip = {
      id: video.id || Date.now(),
      name: video.name || 'Untitled Recording',
      url: video.url || video.dataUrl,
      duration: isScreenshot ? 5 : 0,
      thumbnail: video.thumbnail || null,
      type: clipType,
      dataUrl: video.dataUrl || video.url
    };
    
    // Generate thumbnail for screenshots
    if (isScreenshot && !newClip.thumbnail) {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 160;
        canvas.height = 90;
        const ctx = canvas.getContext('2d');
        
        // Calculate aspect ratio for thumbnail
        const aspectRatio = img.width / img.height;
        const targetAspect = 160 / 90;
        let drawWidth = canvas.width;
        let drawHeight = canvas.height;
        let offsetX = 0;
        let offsetY = 0;
        
        if (aspectRatio > targetAspect) {
          drawWidth = canvas.height * aspectRatio;
          offsetX = (canvas.width - drawWidth) / 2;
        } else {
          drawHeight = canvas.width / aspectRatio;
          offsetY = (canvas.height - drawHeight) / 2;
        }
        
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        newClip.thumbnail = canvas.toDataURL();
        clips = clips; // trigger reactivity
      };
      img.src = newClip.url || newClip.dataUrl;
    }
    
    clips = [newClip];
  }
  
  // Apply all filters and effects to video element
  $: if (videoElement) {
    // Build comprehensive filter string
    const filterString = [
      `brightness(${filters.brightness + filters.exposure}%)`,
      `contrast(${filters.contrast}%)`,
      `saturate(${filters.saturation}%)`,
      `blur(${filters.blur}px)`,
      `hue-rotate(${filters.hue}deg)`,
      effects.sharpen > 0 ? `contrast(${100 + effects.sharpen * 0.5}%)` : '',
    ].filter(Boolean).join(' ');
    
    videoElement.style.filter = filterString;
    
    // Apply zoom effect
    const scale = effects.zoom;
    const translateX = (50 - effects.zoomX) * (scale - 1);
    const translateY = (50 - effects.zoomY) * (scale - 1);
    videoElement.style.transform = `scale(${scale}) translate(${translateX}%, ${translateY}%)`;
    
    // Apply audio
    videoElement.volume = audioNormalize ? Math.min(1, volume / 100 * 1.2) : volume / 100;
    videoElement.playbackRate = playbackSpeed;
  }

  $: playheadPosition = duration > 0 ? (currentTime / duration) * 100 : 0;
  // Calculate total timeline duration from all clips across all tracks
  $: {
    const baseVideoDuration = videoElement?.duration || 0;
    const maxClipEndTime = tracks.length > 0
      ? Math.max(0, ...tracks.flatMap(t => t.clips.map(c => c.startTime + c.duration)))
      : 0;
    duration = Math.max(baseVideoDuration, maxClipEndTime);
    
    // Update trimEnd to match new duration if it was at the end
    if (trimEnd === baseVideoDuration && duration > baseVideoDuration) {
      trimEnd = duration;
    }
  }
  
  $: trimStartPercent = duration > 0 ? (trimStart / duration) * 100 : 0;
  $: trimEndPercent = duration > 0 ? (trimEnd / duration) * 100 : 100;
  $: trimDuration = trimEnd - trimStart;
  $: trimmedPercent = duration > 0 ? (trimDuration / duration) * 100 : 100;
  
  // Transition calculations (global)
  $: fadeInDuration = Math.min(transitions.fadeIn, trimDuration);
  $: fadeOutDuration = Math.min(transitions.fadeOut, trimDuration);
  $: isInFadeIn = currentTime < trimStart + fadeInDuration;
  $: isInFadeOut = currentTime > trimEnd - fadeOutDuration;
  
  // Calculate combined opacity from global and per-clip transitions
  // NOTE: This is only used during export, not for preview display
  // Preview should show full opacity to see all clips in sequence
  $: {
    fadeOpacity = 1; // Always show full opacity in preview
  }

  onMount(() => {
    // Initialize built-in LUTs
    luts = [
      { id: 'none', name: '⚪ None', data: null, custom: false },
      { id: 'cinematic', name: '🎬 Cinematic', data: null, custom: false },
      { id: 'tealOrange', name: '🌊 Teal & Orange', data: null, custom: false },
      { id: 'vintage', name: '📽️ Vintage Film', data: null, custom: false },
      { id: 'bleachBypass', name: '🖤 Bleach Bypass', data: null, custom: false },
      { id: 'moody', name: '🌙 Moody Dark', data: null, custom: false },
    ];
    
    if (videoElement) {
      videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.addEventListener('timeupdate', handleTimeUpdate);
      
      // Set initial video source
      if (video && video.url) {
        videoElement.src = video.url;
      }
    }
    
    // Load saved clips and tracks from localStorage
    loadFromLocalStorage();
    
    // Save initial state to history after a short delay to ensure everything is loaded
    setTimeout(() => {
      console.log('🔍 About to save initial history state...');
      console.log('Current tracks:', tracks);
      console.log('Current historyIndex:', historyIndex);
      saveToHistory();
      console.log('📸 Initial state saved to history - historyIndex:', historyIndex, 'length:', history.length);
    }, 500);
    
    // Load all user assets (videos and screenshots) into media bin
    // Use setTimeout to ensure stores are fully initialized
    setTimeout(() => {
      loadAllUserAssets();
      
      // Fix any clips missing URLs (migration for older sessions)
      fixMissingClipUrls();
      
      // Check for pending template from Creator Tools
      const pendingTemplateStr = localStorage.getItem('pendingTemplate');
      if (pendingTemplateStr) {
        try {
          const template = JSON.parse(pendingTemplateStr);
          console.log('📋 Loading pending template:', template);
          
          // Create a canvas to generate a thumbnail for the template
          const canvas = document.createElement('canvas');
          canvas.width = 160;
          canvas.height = 90;
          const ctx = canvas.getContext('2d');
          
          // Draw template preview
          if (template.style?.background) {
            ctx.fillStyle = template.style.background.includes('gradient') 
              ? '#667eea' // Fallback color for gradients
              : template.style.background;
          } else {
            ctx.fillStyle = '#667eea';
          }
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Draw template thumbnail emoji/icon centered
          ctx.font = '48px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(template.thumbnail || '📚', canvas.width / 2, canvas.height / 2);
          
          const thumbnailDataUrl = canvas.toDataURL();
          
          // Create a visual representation of the template as an image clip
          const templateClip = {
            id: `template-${Date.now()}`,
            name: template.name,
            thumbnail: thumbnailDataUrl,
            duration: template.duration || 5,
            type: 'image',
            url: thumbnailDataUrl, // Use the generated thumbnail as the image
            dataUrl: thumbnailDataUrl,
            isTemplate: true,
            templateData: template
          };
          
          // Add to clips array for Media Bin
          clips = [...clips, templateClip];
          
          // Show notification
          addNotification({
            type: 'success',
            message: `Template "${template.name}" loaded! Drag it from the Media Bin to the timeline.`,
            duration: 5000
          });
          
          // Clear the pending template
          localStorage.removeItem('pendingTemplate');
        } catch (error) {
          console.error('Failed to load pending template:', error);
          localStorage.removeItem('pendingTemplate');
        }
      }
    }, 100);
    
    // Initialize sequencer with current video (if not already loaded from localStorage)
    if (video && video.url) {
      const hasInitialVideo = tracks.some(t => 
        t.clips.some(c => c.name === video.name || c.url === video.url)
      );
      
      if (!hasInitialVideo) {
        // Detect if it's a screenshot or image
        const isScreenshot = video.type === 'screenshot' || video.mimeType === 'image/png' || video.mimeType?.startsWith('image/');
        const clipType = isScreenshot ? 'screenshot' : 'video';
        const clipDuration = isScreenshot ? 5 : (duration || 10);
        
        const initialClip = {
          id: `clip-${Date.now()}`,
          startTime: 0,
          duration: clipDuration,
          file: null,
          name: video.name || (isScreenshot ? 'Screenshot' : 'Main Video'),
          thumbnail: video.thumbnail || null,
          trimStart: 0,
          trimEnd: clipDuration,
          color: '#3b82f6',
          type: clipType,
          url: video.url || video.dataUrl,
          dataUrl: video.dataUrl || video.url,
          // Per-clip transitions
          fadeIn: 0,
          fadeOut: 0,
          fadeInType: 'black',
          fadeOutType: 'black',
        };
        tracks = tracks.map((t, index) => 
          index === 0 ? {...t, clips: [initialClip]} : t
        );
      }
    }
  });

  onDestroy(() => {
    if (videoElement) {
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
    }
    if (playbackInterval) {
      clearInterval(playbackInterval);
    }
  });

  // Check which clip is active at current playhead position
  function getActiveClipAtTime(time) {
    // Check all visible tracks from top to bottom (higher index = on top)
    // This ensures we get the topmost visible clip at the current time
    for (let i = tracks.length - 1; i >= 0; i--) {
      const track = tracks[i];
      if (!track.visible) continue;
      
      for (const clip of track.clips) {
        const clipEnd = clip.startTime + clip.duration;
        if (time >= clip.startTime && time < clipEnd) {
          return clip;
        }
      }
    }
    return null;
  }

  // Update preview based on active clip
  function updatePreview(time) {
    const activeClip = getActiveClipAtTime(time);
    
    if (activeClip) {
      if (activeClip.type === 'image' || activeClip.type === 'screenshot') {
        activeClipType = 'image';
        renderImageToCanvas(activeClip);
      } else {
        activeClipType = 'video';
        // Video playback handled by video element
      }
    }
  }

  // Render image clip to canvas
  function renderImageToCanvas(clip) {
    const imageUrl = clip.url || clip.dataUrl;
    if (!imagePreviewCanvas || !imageUrl) return;
    
    const img = new Image();
    img.onload = () => {
      const ctx = imagePreviewCanvas.getContext('2d');
      imagePreviewCanvas.width = img.width;
      imagePreviewCanvas.height = img.height;
      ctx.drawImage(img, 0, 0);
    };
    img.src = imageUrl;
  }

  function handleLoadedMetadata() {
    // Duration will be reactively calculated from clips and video
    const videoDuration = videoElement.duration;
    
    // Set initial trim to full video duration
    if (trimStart === 0 && trimEnd === 0) {
      trimStart = 0;
      trimEnd = videoDuration;
    }
    
    // If video has existing trim values, use those
    if (video.trimStart !== undefined) {
      trimStart = video.trimStart;
    }
    if (video.trimEnd !== undefined) {
      trimEnd = video.trimEnd;
    }
  }

  function handleTimeUpdate() {
    // Only update currentTime from video if not playing the sequencer
    if (!isPlaying && videoElement) {
      currentTime = videoElement.currentTime;
      
      // Auto-pause at trim end
      if (currentTime >= trimEnd) {
        videoElement.pause();
        isPlaying = false;
        videoElement.currentTime = trimStart;
      }
    }
  }

  function togglePlayPause() {
    if (isPlaying) {
      if (videoElement) {
        videoElement.pause();
      }
      if (playbackInterval) {
        clearInterval(playbackInterval);
        playbackInterval = null;
      }
      isPlaying = false;
    } else {
      // Start playback
      isPlaying = true;
      
      // Start playback loop for sequencer
      playbackInterval = setInterval(() => {
        currentTime += (0.033 * playbackSpeed); // Apply playback speed
        
        // Check for loop region
        if (loopPlayback && loopEnd > loopStart) {
          if (currentTime >= loopEnd) {
            currentTime = loopStart;
          }
        }
        
        // Calculate the actual end time (latest clip end across all tracks)
        const actualEndTime = tracks.length > 0
          ? Math.max(0, ...tracks.flatMap(t => t.clips.map(c => c.startTime + c.duration)))
          : duration;
        
        // Check if we've reached the end of the timeline
        // Use actualEndTime to ensure we play all clips, not just to duration
        if (currentTime >= actualEndTime) {
          currentTime = loopPlayback && loopEnd > loopStart ? loopStart : actualEndTime;
          if (!loopPlayback) {
            isPlaying = false;
            if (playbackInterval) {
              clearInterval(playbackInterval);
              playbackInterval = null;
            }
            if (videoElement) {
              videoElement.pause();
            }
            console.log('⏹️ Playback stopped at end of sequence:', actualEndTime);
            return;
          }
        }
        
        // Auto-scroll timeline with playhead
        if (autoScrollWithPlayhead) {
          const sequencer = document.querySelector('.sequencer-container');
          if (sequencer) {
            const playheadPos = (currentTime / duration) * sequencer.scrollWidth;
            const scrollOffset = sequencer.scrollLeft;
            const viewportWidth = sequencer.clientWidth;
            
            // Scroll if playhead is near the edge
            if (playheadPos > scrollOffset + viewportWidth - 100) {
              sequencer.scrollLeft = playheadPos - viewportWidth + 100;
            } else if (playheadPos < scrollOffset + 100) {
              sequencer.scrollLeft = Math.max(0, playheadPos - 100);
            }
          }
        }
        
        // Get the active clip at current time
        const activeClip = getActiveClipAtTime(currentTime);
        
        if (activeClip) {
          if (activeClip.type === 'image' || activeClip.type === 'screenshot') {
            // Switch to image/screenshot display
            if (activeClipType !== 'image') {
              console.log('🖼️ Switching to image/screenshot at', currentTime);
              activeClipType = 'image';
            }
            // Pause video if it's playing
            if (videoElement && !videoElement.paused) {
              videoElement.pause();
            }
            // Render the image or screenshot
            renderImageToCanvas(activeClip);
          } else if (activeClip.type === 'video') {
            // Switch to video display
            if (activeClipType !== 'video') {
              console.log('🎥 Switching to video at', currentTime);
              activeClipType = 'video';
            }
            // Sync video element with clip timing
            if (videoElement && activeClip.url) {
              const clipLocalTime = currentTime - activeClip.startTime;
              
              // If this is a different video clip or we're out of sync, update video source
              if (videoElement.src !== activeClip.url) {
                console.log('🔄 Loading new video clip:', activeClip.name);
                videoElement.src = activeClip.url;
                videoElement.currentTime = clipLocalTime;
                videoElement.play().catch(() => {});
              } else {
                // Same video, just sync the time
                if (Math.abs(videoElement.currentTime - clipLocalTime) > 0.1) {
                  videoElement.currentTime = clipLocalTime;
                }
                if (videoElement.paused) {
                  videoElement.play().catch(() => {});
                }
              }
            } else if (!activeClip.url) {
              console.warn('⚠️ Video clip missing URL:', activeClip.name);
            }
          }
        } else {
          // No clip at this time - could be a gap between clips
          // Don't stop playback, just pause video display
          if (videoElement && !videoElement.paused) {
            videoElement.pause();
          }
          // Keep activeClipType as is to show last frame
          console.log('⏸️ Gap in timeline at', currentTime);
        }
      }, 33); // ~30fps
    }
  }

  function handleTimelineClick(e) {
    if (isDraggingStart || isDraggingEnd || !timelineElement) return;
    
    const rect = timelineElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = (x / rect.width) * 100;
    const time = (percent / 100) * duration;
    
    // Clamp to trim range
    const clampedTime = Math.max(trimStart, Math.min(trimEnd, time));
    if (videoElement) {
      videoElement.currentTime = clampedTime;
    }
  }

  function handleTrimStartDrag(e) {
    if (!isDraggingStart || !timelineElement) return;
    
    const rect = timelineElement.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    let newTime = (percent / 100) * duration;
    
    // Don't allow crossing the end handle
    newTime = Math.max(0, Math.min(newTime, trimEnd - 0.5));
    trimStart = newTime;
    
    if (videoElement && currentTime < trimStart) {
      videoElement.currentTime = trimStart;
    }
  }

  function handleTrimEndDrag(e) {
    if (!isDraggingEnd || !timelineElement) return;
    
    const rect = timelineElement.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    let newTime = (percent / 100) * duration;
    
    // Don't allow crossing the start handle
    newTime = Math.max(trimStart + 0.5, Math.min(newTime, duration));
    trimEnd = newTime;
    
    if (videoElement && currentTime > trimEnd) {
      videoElement.currentTime = trimEnd;
    }
  }

  function handleMouseMove(e) {
    if (isDraggingStart) {
      handleTrimStartDrag(e);
    } else if (isDraggingEnd) {
      handleTrimEndDrag(e);
    } else if (isDraggingPlayhead) {
      handlePlayheadDrag(e);
    } else if (isDraggingSequencer) {
      handleSequencerDrag(e);
    }
  }

  function handleMouseUp() {
    // Save history if trim handles were being dragged
    if (isDraggingStart || isDraggingEnd) {
      saveToHistory();
    }
    
    isDraggingStart = false;
    isDraggingEnd = false;
    isDraggingPlayhead = false;
    isDraggingSequencer = false;
    document.body.style.cursor = '';
  }

  function startDraggingSequencer(e) {
    e.preventDefault();
    e.stopPropagation();
    isDraggingSequencer = true;
    sequencerDragStartY = e.clientY;
    const sequencerSection = document.querySelector('.sequencer-section');
    if (sequencerSection) {
      sequencerInitialHeight = sequencerSection.offsetHeight;
    }
    document.body.style.cursor = 'ns-resize';
  }

  function handleSequencerDrag(e) {
    if (!isDraggingSequencer) return;
    
    const deltaY = e.clientY - sequencerDragStartY;
    const newHeight = Math.max(300, Math.min(800, sequencerInitialHeight + deltaY));
    
    const sequencerSection = document.querySelector('.sequencer-section');
    if (sequencerSection) {
      sequencerSection.style.height = `${newHeight}px`;
      sequencerSection.style.flex = 'none'; // Override flex to use fixed height
    }
  }

  function startDraggingPlayhead(e) {
    e.stopPropagation();
    isDraggingPlayhead = true;
    // Pause playback while scrubbing
    if (isPlaying) {
      togglePlayPause();
    }
  }

  function handlePlayheadDrag(e) {
    if (!isDraggingPlayhead) return;
    
    // Calculate time based on mouse position
    // Try to find the sequencer container from the target element
    const target = e.target || e.currentTarget;
    const sequencerContainer = target?.closest?.('.sequencer-wrapper') || 
                               target?.closest?.('.sequencer-section') ||
                               document.querySelector('.sequencer-wrapper') ||
                               document.querySelector('.sequencer-section');
    
    if (!sequencerContainer) return;
    
    const rect = sequencerContainer.getBoundingClientRect();
    const x = e.clientX - rect.left - 150; // Subtract track header width
    const newTime = Math.max(0, Math.min(duration, x / effectivePixelsPerSecond));
    
    currentTime = newTime;
    updatePreview(currentTime);
  }

  function handleTimeRulerClick(e) {
    // Calculate time based on click position
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newTime = Math.max(0, Math.min(duration, x / effectivePixelsPerSecond));
    
    currentTime = newTime;
    updatePreview(currentTime);
    
    // Start dragging immediately
    isDraggingPlayhead = true;
  }

  function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  }

  async function handleExport() {
    if (isProcessing) return;
    
    isProcessing = true;
    exportProgress = 0;

    try {
      // Create a canvas to render the processed video
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Match video dimensions
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;

      // Seek to trim start
      videoElement.currentTime = trimStart;
      await new Promise(resolve => {
        videoElement.onseeked = resolve;
      });

      // Build comprehensive filter string for canvas
      const filterParts = [
        `brightness(${filters.brightness + filters.exposure}%)`,
        `contrast(${filters.contrast}%)`,
        `saturate(${filters.saturation}%)`,
        `blur(${filters.blur}px)`,
        `hue-rotate(${filters.hue}deg)`,
        effects.sharpen > 0 ? `contrast(${100 + effects.sharpen * 0.5}%)` : '',
      ].filter(Boolean);
      
      const stream = canvas.captureStream(30); // 30 FPS
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 8000000
      });

      const chunks = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        
        // Use custom path if available, otherwise use callback
        if (outputPath) {
          await downloadBlob(blob, outputFileName, outputPath);
          isProcessing = false;
          exportProgress = 0;
        } else {
          const url = URL.createObjectURL(blob);
          
          const editedVideo = {
            ...video,
            name: videoName,
            url: url,
            blob: blob,
            trimStart,
            trimEnd,
            duration: trimDuration,
            timestamp: Date.now()
          };
          
          onSave(editedVideo);
          isProcessing = false;
          exportProgress = 0;
        }
      };

      mediaRecorder.start();

      // Render frames with all effects
      let currentExportTime = trimStart;
      const frameInterval = 1 / 30; // 30 FPS
      let isSeekingFrame = false;

      const renderFrame = async () => {
        if (currentExportTime >= trimEnd) {
          mediaRecorder.stop();
          return;
        }

        if (isSeekingFrame) {
          // Wait for previous seek to complete
          setTimeout(renderFrame, 10);
          return;
        }

        isSeekingFrame = true;
        videoElement.currentTime = currentExportTime;
        
        // Wait for seek to complete with proper promise handling
        await new Promise((resolve) => {
          const onSeeked = () => {
            videoElement.removeEventListener('seeked', onSeeked);
            resolve();
          };
          videoElement.addEventListener('seeked', onSeeked);
          
          // Fallback timeout in case seeked event doesn't fire
          setTimeout(() => {
            videoElement.removeEventListener('seeked', onSeeked);
            resolve();
          }, 100);
        });
        
        isSeekingFrame = false;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Calculate fade effect from global transitions
        const timeSinceTrimStart = currentExportTime - trimStart;
        const timeUntilTrimEnd = trimEnd - currentExportTime;
        let opacity = 1;
        
        if (transitions.fadeIn > 0 && timeSinceTrimStart < transitions.fadeIn) {
          opacity = timeSinceTrimStart / transitions.fadeIn;
        }
        if (transitions.fadeOut > 0 && timeUntilTrimEnd < transitions.fadeOut) {
          opacity = Math.min(opacity, timeUntilTrimEnd / transitions.fadeOut);
        }
        
        // Check for per-clip transitions
        const activeClip = getActiveClipAtTime(currentExportTime);
        if (activeClip && (activeClip.fadeIn > 0 || activeClip.fadeOut > 0)) {
          const clipLocalTime = currentExportTime - activeClip.startTime;
          const clipTimeRemaining = activeClip.duration - clipLocalTime;
          
          // Apply clip-specific fade in
          if (activeClip.fadeIn > 0 && clipLocalTime < activeClip.fadeIn) {
            opacity = Math.min(opacity, clipLocalTime / activeClip.fadeIn);
          }
          
          // Apply clip-specific fade out
          if (activeClip.fadeOut > 0 && clipTimeRemaining < activeClip.fadeOut) {
            opacity = Math.min(opacity, clipTimeRemaining / activeClip.fadeOut);
          }
        }
        
        // Apply fade background if needed
        if (opacity < 1) {
          const bgColor = transitions.fadeInType === 'white' || transitions.fadeOutType === 'white' ? '#ffffff' : '#000000';
          ctx.fillStyle = bgColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        // Apply filters
        ctx.filter = filterParts.join(' ');
        ctx.globalAlpha = opacity;
        
        // Apply zoom effect
        if (effects.zoom > 1) {
          const scale = effects.zoom;
          const sw = canvas.width / scale;
          const sh = canvas.height / scale;
          const sx = (effects.zoomX / 100) * (canvas.width - sw);
          const sy = (effects.zoomY / 100) * (canvas.height - sh);
          ctx.drawImage(videoElement, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
        } else {
          ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        }
        
        // Apply vignette effect
        if (effects.vignette > 0) {
          const gradient = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 0,
            canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 2
          );
          gradient.addColorStop(0, 'rgba(0,0,0,0)');
          gradient.addColorStop(1, `rgba(0,0,0,${effects.vignette / 100})`);
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        // Apply watermark
        if (watermark.enabled && watermark.text) {
          ctx.filter = 'none';
          ctx.globalAlpha = watermark.opacity / 100;
          ctx.font = `${watermark.size}px Arial`;
          ctx.fillStyle = watermark.color;
          
          const textMetrics = ctx.measureText(watermark.text);
          let x = 10, y = canvas.height - 10;
          
          switch (watermark.position) {
            case 'top-left':
              x = 10;
              y = watermark.size + 10;
              break;
            case 'top-right':
              x = canvas.width - textMetrics.width - 10;
              y = watermark.size + 10;
              break;
            case 'bottom-left':
              x = 10;
              y = canvas.height - 10;
              break;
            case 'bottom-right':
              x = canvas.width - textMetrics.width - 10;
              y = canvas.height - 10;
              break;
            case 'center':
              x = (canvas.width - textMetrics.width) / 2;
              y = canvas.height / 2;
              break;
          }
          
          ctx.fillText(watermark.text, x, y);
        }
        
        ctx.globalAlpha = 1;
        ctx.filter = 'none';
        
        exportProgress = ((currentExportTime - trimStart) / trimDuration) * 100;
        currentExportTime += frameInterval;
        
        // Continue to next frame
        requestAnimationFrame(renderFrame);
      };

      renderFrame();

    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export video: ' + error.message);
      isProcessing = false;
      exportProgress = 0;
    }
  }
  
  // Export as audio only (MP3/WAV)
  async function exportAudio() {
    if (isProcessing) return;
    
    isProcessing = true;
    exportProgress = 0;
    
    try {
      // Create audio context
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaElementSource(videoElement);
      const destination = audioContext.createMediaStreamDestination();
      
      source.connect(destination);
      source.connect(audioContext.destination);
      
      // Determine MIME type
      const mimeType = audioFormat === 'wav' ? 'audio/wav' : 'audio/webm;codecs=opus';
      const mediaRecorder = new MediaRecorder(destination.stream, { mimeType });
      
      const chunks = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: mimeType });
        const filename = outputFileName || `${videoName.replace(/\.[^/.]+$/, '')}.${audioFormat}`;
        
        await downloadBlob(blob, filename, outputPath);
        
        isProcessing = false;
        exportProgress = 0;
      };
      
      videoElement.currentTime = trimStart;
      await new Promise(resolve => videoElement.onseeked = resolve);
      
      mediaRecorder.start();
      videoElement.play();
      
      // Stop when reaching trim end
      const checkProgress = setInterval(() => {
        exportProgress = ((videoElement.currentTime - trimStart) / trimDuration) * 100;
        
        if (videoElement.currentTime >= trimEnd) {
          clearInterval(checkProgress);
          mediaRecorder.stop();
          videoElement.pause();
        }
      }, 100);
      
    } catch (error) {
      console.error('Audio export failed:', error);
      alert('Failed to export audio: ' + error.message);
      isProcessing = false;
      exportProgress = 0;
    }
  }
  
  // Export specific frame as image
  async function exportFrame() {
    if (isProcessing) return;
    
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      
      // Apply filters
      const filterParts = [
        `brightness(${filters.brightness + filters.exposure}%)`,
        `contrast(${filters.contrast}%)`,
        `saturate(${filters.saturation}%)`,
        `blur(${filters.blur}px)`,
        `hue-rotate(${filters.hue}deg)`,
        effects.sharpen > 0 ? `contrast(${100 + effects.sharpen * 0.5}%)` : '',
      ].filter(Boolean);
      
      ctx.filter = filterParts.join(' ');
      
      // Apply zoom
      if (effects.zoom > 1) {
        const scale = effects.zoom;
        const sw = canvas.width / scale;
        const sh = canvas.height / scale;
        const sx = (effects.zoomX / 100) * (canvas.width - sw);
        const sy = (effects.zoomY / 100) * (canvas.height - sh);
        ctx.drawImage(videoElement, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      } else {
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      }
      
      // Apply vignette
      if (effects.vignette > 0) {
        const gradient = ctx.createRadialGradient(
          canvas.width / 2, canvas.height / 2, 0,
          canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 2
        );
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, `rgba(0,0,0,${effects.vignette / 100})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      // Apply watermark
      if (watermark.enabled && watermark.text) {
        ctx.filter = 'none';
        ctx.globalAlpha = watermark.opacity / 100;
        ctx.font = `${watermark.size}px Arial`;
        ctx.fillStyle = watermark.color;
        
        const textMetrics = ctx.measureText(watermark.text);
        let x = 10, y = canvas.height - 10;
        
        switch (watermark.position) {
          case 'top-left': x = 10; y = watermark.size + 10; break;
          case 'top-right': x = canvas.width - textMetrics.width - 10; y = watermark.size + 10; break;
          case 'bottom-left': x = 10; y = canvas.height - 10; break;
          case 'bottom-right': x = canvas.width - textMetrics.width - 10; y = canvas.height - 10; break;
          case 'center': x = (canvas.width - textMetrics.width) / 2; y = canvas.height / 2; break;
        }
        
        ctx.fillText(watermark.text, x, y);
      }
      
      // Download as PNG
      canvas.toBlob(async (blob) => {
        const timeStr = formatTime(currentTime).replace(/:/g, '-');
        const filename = outputFileName || `${videoName.replace(/\.[^/.]+$/, '')}_frame_${timeStr}.png`;
        
        await downloadBlob(blob, filename, outputPath);
      }, 'image/png');
      
    } catch (error) {
      console.error('Frame export failed:', error);
      alert('Failed to export frame: ' + error.message);
    }
  }
  
  // Export as GIF
  async function exportAsGif() {
    if (isProcessing) return;
    
    alert('GIF export is a premium feature. For now, use the video export and convert using a third-party tool.');
    // GIF export would require a library like gif.js
    // This is a placeholder for future implementation
  }
  
  // Helper function to download or save blob
  async function downloadBlob(blob, filename, customPath = null) {
    // If in Electron and custom path is provided, use file system
    if (window.electronAPI && window.electronAPI.isElectron && customPath) {
      try {
        const arrayBuffer = await blob.arrayBuffer();
        const result = await window.electronAPI.writeFile(customPath, arrayBuffer);
        
        if (result.success) {
          console.log('File saved to:', result.filePath);
          alert(`✅ Export successful!\n\nFile saved to:\n${result.filePath}`);
          return true;
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        console.error('Failed to save file:', error);
        alert(`❌ Failed to save file:\n${error.message}\n\nTrying browser download instead...`);
        // Fall through to browser download
      }
    }
    
    // Browser download fallback
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return true;
  }
  
  // Select output path for export
  async function selectOutputPath() {
    if (window.electronAPI && window.electronAPI.isElectron) {
      // Electron app - use native file dialog
      try {
        // Determine the correct extension and filter based on export type
        let extension = exportFormat;
        let filterName = 'Video Files';
        let defaultName = videoName || 'video';
        
        if (exportType === 'audio') {
          extension = audioFormat;
          filterName = 'Audio Files';
          defaultName = videoName ? videoName.replace(/\.[^/.]+$/, '') : 'audio';
        } else if (exportType === 'frame') {
          extension = 'png';
          filterName = 'Image Files';
          const timeStr = formatTime(currentTime).replace(/:/g, '-');
          defaultName = `${videoName ? videoName.replace(/\.[^/.]+$/, '') : 'frame'}_${timeStr}`;
        } else if (exportType === 'gif') {
          extension = 'gif';
          filterName = 'GIF Files';
          defaultName = videoName ? videoName.replace(/\.[^/.]+$/, '') : 'animation';
        }
        
        const result = await window.electronAPI.showSaveDialog({
          title: `Save ${exportType === 'video' ? 'Video' : exportType === 'audio' ? 'Audio' : exportType === 'frame' ? 'Frame' : 'GIF'} As`,
          defaultPath: outputFileName || `${defaultName}.${extension}`,
          filters: [
            { name: filterName, extensions: [extension] },
            { name: 'All Files', extensions: ['*'] }
          ]
        });
        
        if (result && !result.canceled && result.filePath) {
          outputPath = result.filePath;
          // Extract filename from path
          const pathParts = result.filePath.split(/[/\\]/);
          outputFileName = pathParts[pathParts.length - 1];
        }
      } catch (error) {
        console.error('Error selecting output path:', error);
        alert('Could not open file dialog. Using default download location.');
      }
    } else {
      // Web browser - can't select path, will use default downloads
      alert('📁 Output Path Selection\n\nIn web browser mode, files will be saved to your default Downloads folder.\n\nFor custom save locations, use the Desktop app version.');
      outputPath = 'Downloads';
    }
  }
  
  // Main export router
  async function handleExportWithOptions() {
    showExportOptions = false;
    
    switch (exportType) {
      case 'video':
        await handleExport();
        break;
      case 'audio':
        await exportAudio();
        break;
      case 'frame':
        await exportFrame();
        break;
      case 'gif':
        await exportAsGif();
        break;
      default:
        await handleExport();
    }
  }

  function handleSave() {
    const editedVideo = {
      ...video,
      name: videoName,
      trimStart,
      trimEnd,
      duration: trimDuration
    };
    onSave(editedVideo);
    onClose();
  }
  
  // Save editor session to JSON file
  // Auto-save to localStorage (with quota management)
  function autoSaveToLocalStorage() {
    try {
      // Create minimal session data (exclude large thumbnails and file data)
      const sessionData = {
        version: '3.0',
        name: videoName || 'Auto-saved Project',
        timestamp: new Date().toISOString(),
        videoName,
        trimStart,
        trimEnd,
        duration,
        filters,
        effects,
        transitions,
        watermark,
        volume,
        playbackSpeed,
        audioNormalize,
        audioEnhance,
        // Save structure without thumbnails (they're too large for localStorage)
        clips: clips.map(clip => ({
          id: clip.id,
          name: clip.name,
          duration: clip.duration,
          type: clip.type,
          fileName: clip.file?.name,
          fileType: clip.file?.type
        })),
        tracks: tracks.map(track => ({
          ...track,
          clips: track.clips.map(clip => ({
            id: clip.id,
            name: clip.name,
            startTime: clip.startTime,
            duration: clip.duration,
            trimStart: clip.trimStart,
            trimEnd: clip.trimEnd,
            color: clip.color,
            type: clip.type,
            fadeIn: clip.fadeIn,
            fadeOut: clip.fadeOut,
            fadeInType: clip.fadeInType,
            fadeOutType: clip.fadeOutType,
            fileName: clip.file?.name,
            fileType: clip.file?.type
          }))
        })),
        sequencerSettings: {
          horizontalZoom,
          timelineZoom,
          magneticSnapping,
          rippleEdit,
          showFrameNumbers,
          snapToFrames
        }
      };
      
      const dataString = JSON.stringify(sessionData);
      const dataSize = new Blob([dataString]).size;
      
      // Check if data is too large (localStorage limit is ~5-10MB)
      if (dataSize > 4 * 1024 * 1024) { // 4MB threshold
        console.warn(`Auto-save data is large (${(dataSize / 1024 / 1024).toFixed(2)}MB). Saving minimal data only.`);
        
        // Save only essential data
        const minimalData = {
          version: '3.0',
          name: videoName || 'Auto-saved Project',
          timestamp: new Date().toISOString(),
          videoName,
          duration,
          trackCount: tracks.length,
          clipCount: clips.length
        };
        
        localStorage.setItem('nebula_autosave', JSON.stringify(minimalData));
        console.log('Auto-saved (minimal) to localStorage');
      } else {
        localStorage.setItem('nebula_autosave', dataString);
        console.log(`Auto-saved to localStorage (${(dataSize / 1024).toFixed(1)}KB)`);
      }
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded. Clearing old auto-save and retrying with minimal data.');
        
        try {
          // Clear the old auto-save
          localStorage.removeItem('nebula_autosave');
          
          // Save only critical project info
          const criticalData = {
            version: '3.0',
            name: videoName || 'Auto-saved Project',
            timestamp: new Date().toISOString(),
            videoName,
            duration,
            message: 'Project too large for auto-save. Please use manual save.'
          };
          
          localStorage.setItem('nebula_autosave', JSON.stringify(criticalData));
          console.log('Saved minimal project info after quota error');
        } catch (retryError) {
          console.error('Unable to auto-save even minimal data:', retryError);
        }
      } else {
        console.error('Auto-save failed:', error);
      }
    }
  }

  // Debounced auto-save
  let autoSaveTimeout;
  function scheduleAutoSave() {
    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
      autoSaveToLocalStorage();
    }, 2000); // Auto-save after 2 seconds of inactivity
  }

  // Watch for changes and trigger auto-save
  $: if (tracks || clips || filters || effects || transitions) {
    scheduleAutoSave();
  }

  // Save session (quick save to IndexedDB)
  async function saveSession() {
    const sessionName = prompt('Enter session name:', videoName || 'My Project');
    if (!sessionName) return;

    try {
      const sessionData = {
        name: sessionName,
        timestamp: new Date().toISOString(),
        videoName,
        trimStart,
        trimEnd,
        duration,
        filters,
        effects,
        transitions,
        watermark,
        volume,
        playbackSpeed,
        audioNormalize,
        audioEnhance,
        clips: clips.map(clip => ({
          id: clip.id,
          name: clip.name,
          duration: clip.duration,
          type: clip.type,
          thumbnail: clip.thumbnail,
          file: clip.file, // IndexedDB can store File objects directly
          fileName: clip.file?.name,
          fileType: clip.file?.type
        })),
        tracks: tracks.map(track => ({
          ...track,
          clips: track.clips.map(clip => ({
            id: clip.id,
            name: clip.name,
            startTime: clip.startTime,
            duration: clip.duration,
            trimStart: clip.trimStart,
            trimEnd: clip.trimEnd,
            color: clip.color,
            type: clip.type,
            fadeIn: clip.fadeIn,
            fadeOut: clip.fadeOut,
            fadeInType: clip.fadeInType,
            fadeOutType: clip.fadeOutType,
            thumbnail: clip.thumbnail,
            file: clip.file, // IndexedDB can store File objects directly
            fileName: clip.file?.name,
            fileType: clip.file?.type
          }))
        })),
        sequencerSettings: {
          horizontalZoom,
          timelineZoom,
          magneticSnapping,
          rippleEdit,
          showFrameNumbers,
          snapToFrames
        }
      };
      
      await saveSessionToIndexedDB(sessionData);
      alert(`✅ Session "${sessionName}" saved to browser storage!\n\nYou can also export it to a file for backup.`);
    } catch (error) {
      console.error('Failed to save session:', error);
      alert('❌ Failed to save session: ' + error.message);
    }
  }

  // Export session to file (Save Project)
  async function exportSession() {
    try {
      // Prepare project data
      const projectName = videoName || 'Untitled Project';
      const sessionData = {
        version: '3.0',
        type: 'nebula-project',
        name: projectName,
        timestamp: new Date().toISOString(),
        videoName,
        trimStart,
        trimEnd,
        duration,
        filters,
        effects,
        transitions,
        watermark,
        volume,
        playbackSpeed,
        audioNormalize,
        audioEnhance,
        clips: clips.map(clip => ({
          id: clip.id,
          name: clip.name,
          duration: clip.duration,
          type: clip.type,
          thumbnail: clip.thumbnail,
          file: clip.file,
          fileName: clip.file?.name,
          fileType: clip.file?.type
        })),
        tracks: tracks.map(track => ({
          ...track,
          clips: track.clips.map(clip => ({
            id: clip.id,
            name: clip.name,
            startTime: clip.startTime,
            duration: clip.duration,
            trimStart: clip.trimStart,
            trimEnd: clip.trimEnd,
            color: clip.color,
            type: clip.type,
            fadeIn: clip.fadeIn,
            fadeOut: clip.fadeOut,
            fadeInType: clip.fadeInType,
            fadeOutType: clip.fadeOutType,
            thumbnail: clip.thumbnail,
            file: clip.file,
            fileName: clip.file?.name,
            fileType: clip.file?.type
          }))
        })),
        sequencerSettings: {
          horizontalZoom,
          timelineZoom,
          magneticSnapping,
          rippleEdit,
          showFrameNumbers,
          snapToFrames
        }
      };
      
      // Convert files to base64 for export
      const sessionWithBase64 = {
        ...sessionData,
        clips: await Promise.all(sessionData.clips.map(async clip => {
          const fileData = clip.file ? await fileToBase64(clip.file) : null;
          return { ...clip, file: undefined, fileData };
        })),
        tracks: await Promise.all(sessionData.tracks.map(async track => ({
          ...track,
          clips: await Promise.all(track.clips.map(async clip => {
            const fileData = clip.file ? await fileToBase64(clip.file) : null;
            return { ...clip, file: undefined, fileData };
          }))
        })))
      };
      
      const jsonString = JSON.stringify(sessionWithBase64, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      
      // Use Tauri dialog if available
      if (window.tauriAPI && window.tauriAPI.showSaveDialog) {
        const defaultFileName = `${projectName.replace(/[^a-z0-9]/gi, '_')}.nsp`;
        const filePath = await window.tauriAPI.showSaveDialog({
          defaultPath: defaultFileName,
          title: 'Save Nebula Project - Choose Location',
          filters: [{
            name: 'Nebula Project',
            extensions: ['nsp']
          }]
        });
        
        if (filePath) {
          await window.tauriAPI.writeFile(filePath, jsonString);
          const fileName = filePath.split(/[\\/]/).pop();
          const folderPath = filePath.substring(0, filePath.lastIndexOf('\\') || filePath.lastIndexOf('/'));
          alert(`✅ Project saved successfully!\n\nFile: ${fileName}\nLocation: ${folderPath}`);
        }
      } 
      // Use File System Access API (Chrome/Edge) for folder selection
      else if (window.showSaveFilePicker) {
        try {
          const defaultFileName = `${projectName.replace(/[^a-z0-9]/gi, '_')}.nsp`;
          const fileHandle = await window.showSaveFilePicker({
            suggestedName: defaultFileName,
            types: [{
              description: 'Nebula Project',
              accept: {
                'application/json': ['.nsp']
              }
            }]
          });
          
          const writable = await fileHandle.createWritable();
          await writable.write(jsonString);
          await writable.close();
          
          alert(`✅ Project saved successfully!\n\nFile: ${fileHandle.name}`);
        } catch (err) {
          if (err.name !== 'AbortError') {
            console.error('Save failed:', err);
            alert('❌ Failed to save project: ' + err.message);
          }
        }
      } 
      // Fallback to browser download (Safari, Firefox)
      else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${projectName.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.nsp`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert(`✅ Project exported as .nsp file!\n\n(Downloaded to your default Downloads folder)`);
      }
    } catch (error) {
      console.error('Failed to export project:', error);
      alert('❌ Failed to export project: ' + error.message);
    }
  }
  
  // Helper function to convert File to base64
  async function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  
  // Load auto-saved session from localStorage
  function loadAutoSave() {
    try {
      const saved = localStorage.getItem('nebula_autosave');
      if (saved) {
        const sessionData = JSON.parse(saved);
        restoreSessionData(sessionData);
        alert('✅ Auto-saved session restored!');
      } else {
        alert('No auto-saved session found.');
      }
    } catch (error) {
      console.error('Failed to load auto-save:', error);
      alert('❌ Failed to load auto-save: ' + error.message);
    }
  }
  
  // Load session from IndexedDB or file (Open Project)
  async function loadSession() {
    const choice = confirm('Load from browser storage?\n\nOK = Browser Storage (IndexedDB)\nCancel = Open .nsp Project File');
    
    if (choice) {
      // Load from IndexedDB
      try {
        const sessions = await getAllSessions();
        if (sessions.length === 0) {
          alert('No saved sessions found in browser storage.');
          return;
        }
        
        const sessionList = sessions
          .map((s, i) => `${i + 1}. ${s.name} (${new Date(s.timestamp).toLocaleString()})`)
          .join('\n');
        const selection = prompt(`Select a session to load:\n\n${sessionList}\n\nEnter number:`);
        
        if (!selection) return;
        
        const index = parseInt(selection) - 1;
        if (index < 0 || index >= sessions.length) {
          alert('Invalid selection');
          return;
        }
        
        const sessionData = sessions[index];
        restoreSessionData(sessionData);
      } catch (error) {
        console.error('Failed to load session:', error);
        alert('❌ Failed to load session: ' + error.message);
      }
    } else {
      // Load from file using Tauri dialog if available
      if (window.tauriAPI && window.tauriAPI.openFileDialog) {
        try {
          const filePath = await window.tauriAPI.openFileDialog({
            title: 'Open Nebula Project - Choose File',
            filters: [{
              name: 'Nebula Project',
              extensions: ['nsp']
            }, {
              name: 'All Files',
              extensions: ['*']
            }]
          });
          
          if (filePath) {
            const text = await window.tauriAPI.readFile(filePath);
            const sessionData = JSON.parse(text);
            
            if (!sessionData.version || sessionData.type !== 'nebula-project') {
              throw new Error('Invalid Nebula project file format');
            }
            
            // Convert base64 files back to File objects
            if (sessionData.clips) {
              sessionData.clips = sessionData.clips.map(clipData => ({
                ...clipData,
                file: clipData.fileData ? base64ToFile(clipData.fileData, clipData.fileName, clipData.fileType) : null
              }));
            }
            
            if (sessionData.tracks) {
              sessionData.tracks = sessionData.tracks.map(track => ({
                ...track,
                clips: track.clips.map(clipData => ({
                  ...clipData,
                  file: clipData.fileData ? base64ToFile(clipData.fileData, clipData.fileName, clipData.fileType) : null
                }))
              }));
            }
            
            restoreSessionData(sessionData);
          }
        } catch (error) {
          console.error('Failed to open project:', error);
          alert('❌ Failed to open project: ' + error.message);
        }
      } 
      // Use File System Access API (Chrome/Edge) for file picker
      else if (window.showOpenFilePicker) {
        try {
          const [fileHandle] = await window.showOpenFilePicker({
            types: [{
              description: 'Nebula Project',
              accept: {
                'application/json': ['.nsp']
              }
            }],
            multiple: false
          });
          
          const file = await fileHandle.getFile();
          const text = await file.text();
          const sessionData = JSON.parse(text);
          
          if (!sessionData.version || sessionData.type !== 'nebula-project') {
            throw new Error('Invalid Nebula project file format');
          }
          
          // Convert base64 files back to File objects
          if (sessionData.clips) {
            sessionData.clips = sessionData.clips.map(clipData => ({
              ...clipData,
              file: clipData.fileData ? base64ToFile(clipData.fileData, clipData.fileName, clipData.fileType) : null
            }));
          }
          
          if (sessionData.tracks) {
            sessionData.tracks = sessionData.tracks.map(track => ({
              ...track,
              clips: track.clips.map(clipData => ({
                ...clipData,
                file: clipData.fileData ? base64ToFile(clipData.fileData, clipData.fileName, clipData.fileType) : null
              }))
            }));
          }
          
          restoreSessionData(sessionData);
          alert(`✅ Project "${sessionData.name || file.name}" loaded successfully!`);
        } catch (error) {
          if (error.name !== 'AbortError') {
            console.error('Failed to open project:', error);
            alert('❌ Failed to open project: ' + error.message);
          }
        }
      } 
      // Fallback to browser file input (Safari, Firefox)
      else {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.nsp';
        
        input.onchange = async (e) => {
          const file = e.target.files[0];
          if (!file) return;
          
          try {
            if (file.name.endsWith('.nsp')) {
              const text = await file.text();
              const sessionData = JSON.parse(text);
              
              if (!sessionData.version) {
                throw new Error('Invalid Nebula project file format');
              }

              // Convert base64 files back to File objects
              if (sessionData.clips) {
                sessionData.clips = sessionData.clips.map(clipData => ({
                  ...clipData,
                  file: clipData.fileData ? base64ToFile(clipData.fileData, clipData.fileName, clipData.fileType) : null
                }));
              }
              
              if (sessionData.tracks) {
                sessionData.tracks = sessionData.tracks.map(track => ({
                  ...track,
                  clips: track.clips.map(clipData => ({
                    ...clipData,
                    file: clipData.fileData ? base64ToFile(clipData.fileData, clipData.fileName, clipData.fileType) : null
                  }))
                }));
              }
              
              restoreSessionData(sessionData);
            } else {
              alert('⚠️ Please select a Nebula Project (.nsp) file.');
            }
          } catch (error) {
            console.error('Failed to load project from file:', error);
            alert('❌ Failed to load project: ' + error.message);
          }
        };
        
        input.click();
      }
    }
  }

  // Helper function to restore session data
  function restoreSessionData(sessionData) {
    try {
      if (sessionData.videoName !== undefined) videoName = sessionData.videoName;
      if (sessionData.trimStart !== undefined) trimStart = sessionData.trimStart;
      if (sessionData.trimEnd !== undefined) trimEnd = sessionData.trimEnd;
      
      if (sessionData.filters) filters = { ...filters, ...sessionData.filters };
      if (sessionData.effects) effects = { ...effects, ...sessionData.effects };
      if (sessionData.transitions) transitions = { ...transitions, ...sessionData.transitions };
      if (sessionData.watermark) watermark = { ...watermark, ...sessionData.watermark };
      
      if (sessionData.volume !== undefined) volume = sessionData.volume;
      if (sessionData.playbackSpeed !== undefined) playbackSpeed = sessionData.playbackSpeed;
      if (sessionData.audioNormalize !== undefined) audioNormalize = sessionData.audioNormalize;
      if (sessionData.audioEnhance !== undefined) audioEnhance = sessionData.audioEnhance;

      if (sessionData.clips) {
        clips = sessionData.clips.map(clipData => ({
          id: clipData.id,
          name: clipData.name,
          duration: clipData.duration,
          type: clipData.type,
          thumbnail: clipData.thumbnail,
          file: clipData.file,
          url: clipData.file ? URL.createObjectURL(clipData.file) : ''
        }));
      }
      
      if (sessionData.tracks) {
        tracks = sessionData.tracks.map(track => ({
          ...track,
          clips: track.clips.map(clipData => ({
            ...clipData,
            file: clipData.file,
            url: clipData.file ? URL.createObjectURL(clipData.file) : '',
            fadeIn: clipData.fadeIn || 0,
            fadeOut: clipData.fadeOut || 0,
            fadeInType: clipData.fadeInType || 'black',
            fadeOutType: clipData.fadeOutType || 'black'
          }))
        }));
      }
      
      if (sessionData.sequencerSettings) {
        const settings = sessionData.sequencerSettings;
        if (settings.horizontalZoom !== undefined) horizontalZoom = settings.horizontalZoom;
        if (settings.timelineZoom !== undefined) timelineZoom = settings.timelineZoom;
        if (settings.magneticSnapping !== undefined) magneticSnapping = settings.magneticSnapping;
        if (settings.rippleEdit !== undefined) rippleEdit = settings.rippleEdit;
        if (settings.showFrameNumbers !== undefined) showFrameNumbers = settings.showFrameNumbers;
        if (settings.snapToFrames !== undefined) snapToFrames = settings.snapToFrames;
      }
      
      alert(`✅ Session "${sessionData.name || 'Untitled'}" loaded successfully!`);
    } catch (error) {
      console.error('Failed to restore session:', error);
      alert('❌ Failed to restore session: ' + error.message);
    }
  }

  function handleJumpToStart() {
    if (videoElement) {
      videoElement.currentTime = trimStart;
    }
  }

  function handleJumpToEnd() {
    if (videoElement) {
      videoElement.currentTime = trimEnd;
    }
  }

  function jumpToPreviousFrame() {
    if (videoElement) {
      // Pause if playing
      if (isPlaying) {
        togglePlayPause();
      }
      // Calculate frame duration (assuming 30fps, can be adjusted)
      const frameDuration = 1 / 30;
      videoElement.currentTime = Math.max(trimStart, videoElement.currentTime - frameDuration);
    }
  }

  function jumpToNextFrame() {
    if (videoElement) {
      // Pause if playing
      if (isPlaying) {
        togglePlayPause();
      }
      // Calculate frame duration (assuming 30fps, can be adjusted)
      const frameDuration = 1 / 30;
      videoElement.currentTime = Math.min(trimEnd, videoElement.currentTime + frameDuration);
    }
  }
  
  function resetFilters() {
    filters = {
      brightness: 100,
      contrast: 100,
      saturation: 100,
      blur: 0,
      hue: 0,
      temperature: 0,
      tint: 0,
      exposure: 0,
      shadows: 0,
      highlights: 0,
      gamma: 1,
      vibrance: 0,
      clarity: 0,
      filmGrain: 0,
      bleachBypass: 0,
      channelMixer: { red: 100, green: 100, blue: 100 },
      sepia: 0,
      grayscale: 0,
      invert: 0,
      posterize: 0,
    };
    selectedFilterPreset = 'none';
  }
  
  function resetEffects() {
    effects = {
      zoom: 1,
      zoomX: 50,
      zoomY: 50,
      vignette: 0,
      noise: 0,
      sharpen: 0,
      chromaticAberration: 0,
      glitch: 0,
      pixelate: 0,
      kaleidoscope: 0,
      mirror: 'none',
      rotation: 0,
      flip: { horizontal: false, vertical: false },
      fishEye: 0,
      bulge: 0,
      border: { enabled: false, width: 0, color: '#000000', style: 'solid' },
      cornerRadius: 0,
      motionBlur: 0,
      shake: 0,
      duotone: { enabled: false, color1: '#000000', color2: '#ffffff' },
      colorSplash: { enabled: false, hue: 0, tolerance: 30 },
    };
  }
  
  function resetTransitions() {
    transitions = {
      fadeIn: 0,
      fadeOut: 0,
      fadeInType: 'black',
      fadeOutType: 'black',
      slideDirection: 'none',
      slideIn: 0,
      slideOut: 0,
      zoom: { in: 0, out: 0 },
      wipe: { enabled: false, direction: 'left', duration: 1 },
      dissolve: 0,
      circularReveal: 0,
      pageFlip: 0,
      blur: 0,
      pixelate: 0,
      glitch: 0,
      colorFade: { enabled: false, color: '#000000', duration: 1 },
    };
    selectedTransitionPreset = 'none';
  }
  
  // Apply filter preset
  function applyFilterPreset(preset) {
    selectedFilterPreset = preset;
    
    switch(preset) {
      case 'cinematic':
        filters = { ...filters, temperature: 15, tint: -5, contrast: 110, saturation: 90, clarity: 20, shadows: -10, highlights: -15, filmGrain: 15 };
        break;
      case 'vivid':
        filters = { ...filters, saturation: 140, vibrance: 30, contrast: 115, clarity: 25, temperature: 5 };
        break;
      case 'vintage':
        filters = { ...filters, sepia: 40, temperature: 20, contrast: 90, saturation: 80, filmGrain: 30, vignette: 25 };
        break;
      case 'dramatic':
        filters = { ...filters, grayscale: 100, contrast: 140, clarity: 50, shadows: -30, highlights: 20 };
        break;
      case 'warm':
        filters = { ...filters, temperature: 40, tint: 10, saturation: 110, exposure: 5 };
        break;
      case 'cool':
        filters = { ...filters, temperature: -35, tint: -10, saturation: 95, contrast: 105 };
        break;
      case 'dream':
        filters = { ...filters, blur: 1.5, saturation: 120, temperature: 10, exposure: 10, contrast: 85 };
        break;
      case 'noir':
        filters = { ...filters, grayscale: 100, contrast: 150, shadows: -40, highlights: 30, gamma: 0.9 };
        break;
      case 'bleach':
        filters = { ...filters, bleachBypass: 70, contrast: 125, saturation: 70, temperature: -5 };
        break;
      case 'cyberpunk':
        filters = { ...filters, saturation: 150, vibrance: 50, temperature: -20, tint: 20, contrast: 120, shadows: -20 };
        break;
      case 'sunset':
        filters = { ...filters, temperature: 50, tint: 15, saturation: 120, exposure: 5, highlights: 10 };
        break;
      default:
        resetFilters();
    }
    saveToHistory();
  }
  
  // Apply transition preset
  function applyTransitionPreset(preset) {
    selectedTransitionPreset = preset;
    
    switch(preset) {
      case 'crossfade':
        transitions = { ...transitions, dissolve: 1, fadeIn: 0, fadeOut: 0 };
        break;
      case 'fadeBlack':
        transitions = { ...transitions, fadeIn: 1, fadeOut: 1, fadeInType: 'black', fadeOutType: 'black' };
        break;
      case 'fadeWhite':
        transitions = { ...transitions, fadeIn: 1, fadeOut: 1, fadeInType: 'white', fadeOutType: 'white' };
        break;
      case 'slideLeft':
        transitions = { ...transitions, slideDirection: 'left', slideIn: 0.8, slideOut: 0.8 };
        break;
      case 'slideRight':
        transitions = { ...transitions, slideDirection: 'right', slideIn: 0.8, slideOut: 0.8 };
        break;
      case 'slideUp':
        transitions = { ...transitions, slideDirection: 'up', slideIn: 0.8, slideOut: 0.8 };
        break;
      case 'slideDown':
        transitions = { ...transitions, slideDirection: 'down', slideIn: 0.8, slideOut: 0.8 };
        break;
      case 'zoomIn':
        transitions = { ...transitions, zoom: { in: 1.2, out: 0 } };
        break;
      case 'zoomOut':
        transitions = { ...transitions, zoom: { in: 0, out: 1.2 } };
        break;
      case 'wipeLeft':
        transitions = { ...transitions, wipe: { enabled: true, direction: 'left', duration: 1 } };
        break;
      case 'wipeRight':
        transitions = { ...transitions, wipe: { enabled: true, direction: 'right', duration: 1 } };
        break;
      case 'circleReveal':
        transitions = { ...transitions, circularReveal: 1 };
        break;
      case 'pageFlip':
        transitions = { ...transitions, pageFlip: 1.5 };
        break;
      case 'blurTransition':
        transitions = { ...transitions, blur: 1 };
        break;
      case 'glitchTransition':
        transitions = { ...transitions, glitch: 0.5 };
        break;
      default:
        resetTransitions();
    }
    saveToHistory();
  }
  
  function resetAudio() {
    volume = 100;
    playbackSpeed = 1;
    audioNormalize = false;
    audioEnhance = false;
  }
  
  function resetWatermark() {
    watermark = {
      enabled: false,
      text: '',
      position: 'bottom-right',
      size: 24,
      opacity: 80,
      color: '#ffffff',
    };
  }
  
  function resetAll() {
    trimStart = 0;
    trimEnd = duration;
    resetFilters();
    resetEffects();
    resetTransitions();
    resetAudio();
    resetWatermark();
  }
  
  // Save clips and tracks to localStorage (with quota management)
  function saveToLocalStorage() {
    try {
      const dataToSave = {
        clips: clips.map(clip => ({
          id: clip.id,
          name: clip.name,
          url: clip.url,
          // Exclude dataUrl and thumbnail to save space
          duration: clip.duration,
          type: clip.type,
          mimeType: clip.mimeType
        })),
        tracks: tracks.map(track => ({
          ...track,
          clips: track.clips.map(clip => ({
            id: clip.id,
            name: clip.name,
            startTime: clip.startTime,
            duration: clip.duration,
            // Exclude thumbnail to save space
            trimStart: clip.trimStart,
            trimEnd: clip.trimEnd,
            color: clip.color,
            type: clip.type,
            url: clip.url,
            // Exclude dataUrl to save space
            fadeIn: clip.fadeIn,
            fadeOut: clip.fadeOut,
            fadeInType: clip.fadeInType,
            fadeOutType: clip.fadeOutType
          }))
        })),
        textOverlays: textOverlays // Save text overlays
      };
      
      const dataString = JSON.stringify(dataToSave);
      const dataSize = new Blob([dataString]).size;
      
      // Check if data is too large (localStorage limit is ~5-10MB)
      if (dataSize > 4 * 1024 * 1024) { // 4MB threshold
        console.warn(`Clip data is large (${(dataSize / 1024 / 1024).toFixed(2)}MB). Saving minimal structure only.`);
        
        // Save only essential structure
        const minimalData = {
          clips: clips.map(clip => ({
            id: clip.id,
            name: clip.name,
            duration: clip.duration,
            type: clip.type
          })),
          tracks: tracks.map(track => ({
            id: track.id,
            name: track.name,
            type: track.type,
            clipCount: track.clips.length
          }))
        };
        
        localStorage.setItem('videoEditor_clips', JSON.stringify(minimalData));
        console.log('Saved minimal clip structure to localStorage');
      } else {
        localStorage.setItem('videoEditor_clips', dataString);
        console.log(`Saved clips to localStorage (${(dataSize / 1024).toFixed(1)}KB)`);
      }
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded for clips. Clearing and saving minimal data.');
        
        try {
          // Clear the old data
          localStorage.removeItem('videoEditor_clips');
          
          // Save only critical structure
          const criticalData = {
            clipCount: clips.length,
            trackCount: tracks.length,
            message: 'Clip data too large for localStorage. Use manual save/export.'
          };
          
          localStorage.setItem('videoEditor_clips', JSON.stringify(criticalData));
          console.log('Saved minimal clip info after quota error');
        } catch (retryError) {
          console.error('Unable to save even minimal clip data:', retryError);
        }
      } else {
        console.error('Failed to save to localStorage:', e);
      }
    }
  }
  
  // Load clips and tracks from localStorage
  function loadFromLocalStorage() {
    try {
      const savedData = localStorage.getItem('videoEditor_clips');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        
        // Only load clips if they exist and are valid
        if (parsed.clips && parsed.clips.length > 0) {
          // Filter out clips with invalid blob URLs
          const validClips = parsed.clips.filter(clip => {
            // Keep clips that don't use blob URLs or have data URLs
            return !clip.url || !clip.url.startsWith('blob:');
          });
          if (validClips.length > 0) {
            clips = validClips;
          }
        }
        
        // Only load tracks if they exist and have valid clips
        if (parsed.tracks && parsed.tracks.length > 0) {
          // Filter out clips with invalid blob URLs from tracks
          const validTracks = parsed.tracks.map(track => ({
            ...track,
            clips: track.clips.filter(clip => {
              // Keep clips that don't use blob URLs or have data URLs  
              return !clip.url || !clip.url.startsWith('blob:');
            }).map(clip => ({
              // Ensure all clips have transition properties
              fadeIn: 0,
              fadeOut: 0,
              fadeInType: 'black',
              fadeOutType: 'black',
              ...clip
            }))
          }));
          // Only set tracks if we have valid clips
          const hasValidClips = validTracks.some(t => t.clips.length > 0);
          if (hasValidClips) {
            tracks = validTracks;
          }
        }
        
        // Load text overlays
        if (parsed.textOverlays && Array.isArray(parsed.textOverlays)) {
          textOverlays = parsed.textOverlays;
        }
      }
    } catch (e) {
      console.error('Failed to load from localStorage:', e);
    }
  }
  
  // Fix clips in tracks that are missing URLs (migration function)
  function fixMissingClipUrls() {
    let fixed = 0;
    tracks = tracks.map(track => ({
      ...track,
      clips: track.clips.map(clip => {
        // If clip has a file but no URL, create the URL
        if (clip.file && !clip.url) {
          console.log('🔧 Fixing missing URL for clip:', clip.name);
          fixed++;
          return {
            ...clip,
            url: URL.createObjectURL(clip.file)
          };
        }
        // If clip has neither URL nor dataUrl, try to find it in the clips array
        if (!clip.url && !clip.dataUrl) {
          const matchingClip = clips.find(c => c.id === clip.id || c.name === clip.name);
          if (matchingClip && (matchingClip.url || matchingClip.dataUrl)) {
            console.log('🔧 Restoring URL from clips array for:', clip.name);
            fixed++;
            return {
              ...clip,
              url: matchingClip.url,
              dataUrl: matchingClip.dataUrl,
              file: matchingClip.file
            };
          }
        }
        return clip;
      })
    }));
    
    if (fixed > 0) {
      console.log(`✅ Fixed ${fixed} clip(s) with missing URLs`);
      addNotification('info', `Fixed ${fixed} clip(s) that were missing playback URLs`, 3000);
    }
  }
  
  // Load all user assets (videos and screenshots) into media bin
  function loadAllUserAssets() {
    const allAssets = [];
    
    // Add all recorded videos
    const videos = get(recordedVideos) || [];
    console.log('📹 Loading videos:', videos.length);
    videos.forEach(video => {
      // Skip if already in clips
      if (clips.some(c => c.id === video.id)) return;
      
      const videoClip = {
        id: video.id,
        name: video.name,
        url: video.url,
        duration: 0, // Will be set when metadata loads
        thumbnail: video.thumbnail || null,
        type: 'video',
        file: video.blob
      };
      
      // Generate thumbnail for video
      if (video.url && !videoClip.thumbnail) {
        const videoEl = document.createElement('video');
        videoEl.src = video.url;
        videoEl.addEventListener('loadedmetadata', () => {
          videoClip.duration = videoEl.duration;
          videoEl.currentTime = Math.min(1, videoEl.duration / 2);
        });
        videoEl.addEventListener('seeked', () => {
          const canvas = document.createElement('canvas');
          canvas.width = 160;
          canvas.height = 90;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
          videoClip.thumbnail = canvas.toDataURL();
          clips = clips; // trigger reactivity
        });
      }
      
      allAssets.push(videoClip);
    });
    
    // Add all screenshots
    const shots = get(screenshots) || [];
    console.log('📸 Loading screenshots:', shots.length, shots);
    shots.forEach(screenshot => {
      // Skip if already in clips
      if (clips.some(c => c.id === screenshot.id)) {
        console.log('⏭️ Skipping screenshot (already in clips):', screenshot.id);
        return;
      }
      
      const screenshotClip = {
        id: screenshot.id,
        name: screenshot.name,
        url: screenshot.url || screenshot.dataUrl,
        dataUrl: screenshot.dataUrl,
        duration: 5, // Default 5 seconds for screenshots
        thumbnail: null,
        type: 'screenshot'
      };
      
      console.log('✅ Adding screenshot clip:', screenshotClip.name);
      
      // Generate thumbnail for screenshot
      if (screenshot.dataUrl || screenshot.url) {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 160;
          canvas.height = 90;
          const ctx = canvas.getContext('2d');
          
          // Calculate aspect ratio
          const aspectRatio = img.width / img.height;
          const targetAspect = 160 / 90;
          let drawWidth = canvas.width;
          let drawHeight = canvas.height;
          let offsetX = 0;
          let offsetY = 0;
          
          if (aspectRatio > targetAspect) {
            drawWidth = canvas.height * aspectRatio;
            offsetX = (canvas.width - drawWidth) / 2;
          } else {
            drawHeight = canvas.width / aspectRatio;
            offsetY = (canvas.height - drawHeight) / 2;
          }
          
          ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
          screenshotClip.thumbnail = canvas.toDataURL();
          clips = clips; // trigger reactivity
        };
        img.src = screenshot.dataUrl || screenshot.url;
      }
      
      allAssets.push(screenshotClip);
    });
    
    // Add all assets to clips array if we have any
    if (allAssets.length > 0) {
      console.log('📦 Adding', allAssets.length, 'assets to clips panel');
      clips = [...clips, ...allAssets];
      console.log('📦 Total clips now:', clips.length);
    } else {
      console.log('⚠️ No assets to add');
    }
  }
  
  // Auto-save whenever clips or tracks change
  $: if (clips.length > 0 || tracks.some(t => t.clips.length > 0)) {
    saveToLocalStorage();
  }
  
  function handleImportVideo() {
    if (fileInputElement) {
      fileInputElement.click();
    }
  }
  
  function createBlankColorImage() {
    const canvas = document.createElement('canvas');
    canvas.width = colorImageSettings.width;
    canvas.height = colorImageSettings.height;
    const ctx = canvas.getContext('2d');
    
    // Fill with selected color
    ctx.fillStyle = colorImageSettings.color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Convert to blob and create URL
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const colorName = colorImageSettings.color.toUpperCase();
      const newClip = {
        id: Date.now() + Math.random(),
        name: `Color ${colorName} (${colorImageSettings.width}x${colorImageSettings.height})`,
        url: url,
        duration: colorImageSettings.duration,
        thumbnail: canvas.toDataURL(),
        type: 'image',
        isColorImage: true,
        color: colorImageSettings.color,
        file: new File([blob], `color_${colorName}.png`, { type: 'image/png' })
      };
      clips = [...clips, newClip];
      
      // Find an empty video track or create a new one
      let targetTrack = tracks.find(t => t.type === 'video' && t.clips.length === 0);
      if (!targetTrack) {
        const newTrackId = Math.max(...tracks.map(t => t.id), 0) + 1;
        const newTrack = {
          id: newTrackId,
          type: 'video',
          name: `Video ${tracks.filter(t => t.type === 'video').length + 1}`,
          clips: [],
          muted: false,
          solo: false,
          locked: false,
          visible: true,
          height: 80
        };
        tracks = [...tracks, newTrack];
        targetTrack = newTrack;
      }
      
      // Add clip to the target track
      addClipToTrack(targetTrack.id, {
        file: newClip.file,
        name: newClip.name,
        duration: newClip.duration,
        thumbnail: newClip.thumbnail,
        type: 'image',
        url: url,
        isColorImage: true,
        color: colorImageSettings.color
      });
      
      // Close modal
      showColorImageModal = false;
    }, 'image/png');
  }
  
  function handleFileSelect(event) {
    const files = event.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      
      // Check if multiple images might be a sequence
      const imageFiles = fileArray.filter(f => f.type.startsWith('image/'));
      if (imageFiles.length > 1 && detectImageSequence(imageFiles)) {
        // Show dialog for sequence import
        pendingImageSequence = imageFiles;
        showImageSequenceDialog = true;
        return;
      }
      
      const supportedVideoFormats = [
        'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
        'video/x-msvideo', 'video/avi', 'video/x-matroska', 'video/mkv'
      ];
      const supportedAudioFormats = [
        'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg',
        'audio/aac', 'audio/flac', 'audio/m4a', 'audio/webm', 'audio/opus'
      ];
      const supportedImageFormats = [
        'image/png', 'image/jpeg', 'image/jpg', 'image/gif',
        'image/webp', 'image/bmp', 'image/tiff'
      ];
      
      fileArray.forEach(file => {
        // Normalize MIME type and check by extension if MIME is missing/incorrect
        const fileExt = file.name.toLowerCase().split('.').pop();
        const isVideo = file.type.startsWith('video/') || 
          ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'flv', 'm4v'].includes(fileExt);
        const isAudio = file.type.startsWith('audio/') || 
          ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a', 'opus', 'wma'].includes(fileExt);
        const isImage = file.type.startsWith('image/') || 
          ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'tiff', 'tif'].includes(fileExt);
        
        if (isVideo) {
          const url = URL.createObjectURL(file);
          const newClip = {
            id: Date.now() + Math.random(),
            name: file.name,
            url: url,
            duration: 0,
            thumbnail: null,
            type: 'video',
            file: file
          };
          clips = [...clips, newClip];
          
          // Create thumbnail
          const video = document.createElement('video');
          video.src = url;
          video.addEventListener('loadedmetadata', () => {
            newClip.duration = video.duration;
            clips = clips; // trigger reactivity
            
            // Find an empty video track or create a new one
            let targetTrack = tracks.find(t => t.type === 'video' && t.clips.length === 0);
            if (!targetTrack) {
              // Create a new video track
              const newTrackId = Math.max(...tracks.map(t => t.id), 0) + 1;
              const newTrack = {
                id: newTrackId,
                type: 'video',
                name: `Video ${tracks.filter(t => t.type === 'video').length + 1}`,
                clips: [],
                muted: false,
                solo: false,
                locked: false,
                visible: true,
                height: 80
              };
              tracks = [...tracks, newTrack];
              targetTrack = newTrack;
            }
            
            // Add clip to the target track
            addClipToTrack(targetTrack.id, {
              file: file,
              name: file.name,
              duration: video.duration,
              thumbnail: null,
              type: 'video',
              url: url
            });
            
            // Generate thumbnail
            video.currentTime = Math.min(1, video.duration / 2);
          });
          video.addEventListener('seeked', () => {
            const canvas = document.createElement('canvas');
            canvas.width = 160;
            canvas.height = 90;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            newClip.thumbnail = canvas.toDataURL();
            clips = clips; // trigger reactivity
            
            // Update thumbnail in sequencer too
            const videoTrack = tracks.find(t => t.type === 'video');
            if (videoTrack) {
              const sequencerClip = videoTrack.clips.find(c => c.name === file.name);
              if (sequencerClip) {
                sequencerClip.thumbnail = canvas.toDataURL();
                tracks = tracks; // trigger reactivity
              }
            }
          });
        } else if (file.type.startsWith('image/')) {
          const url = URL.createObjectURL(file);
          const newClip = {
            id: Date.now() + Math.random(),
            name: file.name,
            url: url,
            duration: 5, // Default 5 second duration for images
            thumbnail: null,
            type: 'image',
            file: file
          };
          clips = [...clips, newClip];
          
          // Create thumbnail from image
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 160;
            canvas.height = 90;
            const ctx = canvas.getContext('2d');
            
            // Calculate aspect ratio
            const aspectRatio = img.width / img.height;
            const targetAspect = 160 / 90;
            let drawWidth = canvas.width;
            let drawHeight = canvas.height;
            let offsetX = 0;
            let offsetY = 0;
            
            if (aspectRatio > targetAspect) {
              drawWidth = canvas.height * aspectRatio;
              offsetX = (canvas.width - drawWidth) / 2;
            } else {
              drawHeight = canvas.width / aspectRatio;
              offsetY = (canvas.height - drawHeight) / 2;
            }
            
            ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
            newClip.thumbnail = canvas.toDataURL();
            clips = clips; // trigger reactivity
            
            // Find an empty video track or create a new one
            let targetTrack = tracks.find(t => t.type === 'video' && t.clips.length === 0);
            if (!targetTrack) {
              // Create a new video track
              const newTrackId = Math.max(...tracks.map(t => t.id), 0) + 1;
              const newTrack = {
                id: newTrackId,
                type: 'video',
                name: `Video ${tracks.filter(t => t.type === 'video').length + 1}`,
                clips: [],
                muted: false,
                solo: false,
                locked: false,
                visible: true,
                height: 80
              };
              tracks = [...tracks, newTrack];
              targetTrack = newTrack;
            }
            
            // Add clip to the target track
            addClipToTrack(targetTrack.id, {
              file: file,
              name: file.name,
              duration: 5,
              thumbnail: newClip.thumbnail,
              type: 'image',
              url: url
            });
          };
          img.src = url;
        } else if (isAudio) {
          const url = URL.createObjectURL(file);
          const newClip = {
            id: Date.now() + Math.random(),
            name: file.name,
            url: url,
            duration: 0,
            thumbnail: null,
            type: 'audio',
            file: file
          };
          clips = [...clips, newClip];
          
          // Load audio to get duration
          const audio = document.createElement('audio');
          audio.src = url;
          audio.addEventListener('loadedmetadata', () => {
            newClip.duration = audio.duration;
            clips = clips; // trigger reactivity
            
            // Find an audio track or create a new one
            let targetTrack = tracks.find(t => t.type === 'audio');
            if (!targetTrack) {
              // Create a new audio track
              const newTrackId = Math.max(...tracks.map(t => t.id), 0) + 1;
              const newTrack = {
                id: newTrackId,
                type: 'audio',
                name: 'Audio 1',
                clips: [],
                muted: false,
                solo: false,
                locked: false,
                visible: true,
                height: 60
              };
              tracks = [...tracks, newTrack];
              targetTrack = newTrack;
            }
            
            // Add clip to the audio track
            addClipToTrack(targetTrack.id, {
              file: file,
              name: file.name,
              duration: audio.duration,
              thumbnail: null,
              type: 'audio',
              url: url
            });
          });
        } else {
          // Unsupported file format
          addNotification('warning', `⚠️ Unsupported format: ${file.name}. Please use video (MP4, WebM, MOV, AVI, MKV, OGG), audio (MP3, WAV, AAC, FLAC, OGG, M4A), or image (PNG, JPG, GIF, WebP, BMP, TIFF) files.`);
        }
      });
    }
    // Reset file input
    if (fileInputElement) {
      fileInputElement.value = '';
    }
  }
  
  function selectClip(index) {
    if (index >= 0 && index < clips.length) {
      selectedClipIndex = index;
      const clip = clips[index];
      if (videoElement && clip.url !== video.url) {
        videoElement.src = clip.url;
        videoName = clip.name;
        trimStart = 0;
        currentTime = 0;
        isPlaying = false;
      }
    }
  }
  
  function detectImageSequence(files) {
    // Check if filenames have sequential numbers
    const names = files.map(f => f.name);
    const numberPattern = /(\d+)\.\w+$/;
    
    let hasNumbers = 0;
    for (const name of names) {
      if (numberPattern.test(name)) hasNumbers++;
    }
    
    // If more than 50% have numbers, likely a sequence
    return hasNumbers > files.length * 0.5;
  }
  
  async function importImageSequence() {
    if (pendingImageSequence.length === 0) return;
    
    // Sort files by name (assuming numbered sequence)
    const sortedFiles = [...pendingImageSequence].sort((a, b) => 
      a.name.localeCompare(b.name, undefined, { numeric: true })
    );
    
    // Calculate duration based on frame rate
    const duration = sortedFiles.length / sequenceFrameRate;
    
    // Create thumbnails for first frame
    const firstFrame = sortedFiles[0];
    const url = URL.createObjectURL(firstFrame);
    
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 160;
      canvas.height = 90;
      const ctx = canvas.getContext('2d');
      
      const aspectRatio = img.width / img.height;
      const targetAspect = 160 / 90;
      let drawWidth = canvas.width;
      let drawHeight = canvas.height;
      let offsetX = 0;
      let offsetY = 0;
      
      if (aspectRatio > targetAspect) {
        drawWidth = canvas.height * aspectRatio;
        offsetX = (canvas.width - drawWidth) / 2;
      } else {
        drawHeight = canvas.width / aspectRatio;
        offsetY = (canvas.height - drawHeight) / 2;
      }
      
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
      const thumbnail = canvas.toDataURL();
      
      // Create image sequence folder with all frames
      const sequenceClip = {
        id: Date.now() + Math.random(),
        name: sequenceName,
        thumbnail: thumbnail,
        duration: duration,
        type: 'image-sequence',
        frames: sortedFiles,
        frameRate: sequenceFrameRate,
        currentFrame: 0,
        url: url, // First frame URL for preview
        isFolder: true,
        expanded: false,
        children: [] // Frames stored in frames array
      };
      
      clips = [...clips, sequenceClip];
      
      addNotification({
        type: 'success',
        message: `Image sequence "${sequenceName}" imported! ${sortedFiles.length} frames at ${sequenceFrameRate} fps (${duration.toFixed(2)}s)`,
        duration: 5000
      });
      
      // Close dialog and reset
      showImageSequenceDialog = false;
      pendingImageSequence = [];
      sequenceName = 'Image Sequence';
      sequenceFrameRate = 24;
    };
    img.src = url;
  }
  
  function importAsIndividualImages() {
    if (pendingImageSequence.length === 0) return;
    
    // Create a folder to hold all individual images
    const folderClip = {
      id: Date.now() + Math.random(),
      name: sequenceName || 'Image Collection',
      thumbnail: null,
      duration: pendingImageSequence.length * 5, // 5 seconds per image
      type: 'image-folder',
      isFolder: true,
      expanded: false,
      children: []
    };
    
    let processedCount = 0;
    
    // Import each image as a child of the folder
    pendingImageSequence.forEach((file, index) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 160;
        canvas.height = 90;
        const ctx = canvas.getContext('2d');
        
        const aspectRatio = img.width / img.height;
        const targetAspect = 160 / 90;
        let drawWidth = canvas.width;
        let drawHeight = canvas.height;
        let offsetX = 0;
        let offsetY = 0;
        
        if (aspectRatio > targetAspect) {
          drawWidth = canvas.height * aspectRatio;
          offsetX = (canvas.width - drawWidth) / 2;
        } else {
          drawHeight = canvas.width / aspectRatio;
          offsetY = (canvas.height - drawHeight) / 2;
        }
        
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        
        const childClip = {
          id: Date.now() + Math.random() + index,
          name: file.name,
          url: url,
          duration: 5,
          thumbnail: canvas.toDataURL(),
          type: 'image',
          file: file,
          parentId: folderClip.id
        };
        
        folderClip.children.push(childClip);
        
        // Set folder thumbnail to first image
        if (index === 0) {
          folderClip.thumbnail = canvas.toDataURL();
        }
        
        processedCount++;
        
        // Add folder to clips when all images are processed
        if (processedCount === pendingImageSequence.length) {
          clips = [...clips, folderClip];
          
          addNotification({
            type: 'success',
            message: `Imported ${pendingImageSequence.length} images into folder "${folderClip.name}"`,
            duration: 3000
          });
        }
      };
      img.src = url;
    });
    
    // Close dialog and reset
    showImageSequenceDialog = false;
    pendingImageSequence = [];
    sequenceName = 'Image Sequence';
    sequenceFrameRate = 24;
  }
  
  function deleteClip(index) {
    if (clips.length > 1 && confirm('Delete this clip from the outliner?')) {
      clips = clips.filter((_, i) => i !== index);
      if (selectedClipIndex >= clips.length) {
        selectedClipIndex = clips.length - 1;
      }
      selectClip(selectedClipIndex);
    } else if (clips.length === 1) {
      alert('Cannot delete the last clip');
    }
  }
  
  function duplicateClip(index) {
    const clip = clips[index];
    const newClip = {
      ...clip,
      id: Date.now() + Math.random(),
      name: clip.name + ' (Copy)'
    };
    clips = [...clips.slice(0, index + 1), newClip, ...clips.slice(index + 1)];
  }
  
  function toggleOutliner() {
    showOutliner = !showOutliner;
  }
  
  function togglePropertiesPanel() {
    showPropertiesPanel = !showPropertiesPanel;
    console.log('togglePropertiesPanel called - showPropertiesPanel:', showPropertiesPanel);
    
    // Check the panel position after toggle
    setTimeout(() => {
      const panel = document.querySelector('.properties-panel');
      const container = document.querySelector('.editor-content-with-sidebars');
      
      if (container) {
        const containerStyles = window.getComputedStyle(container);
        console.log('Container Info:', {
          display: containerStyles.display,
          flexDirection: containerStyles.flexDirection,
          inlineStyle: container.getAttribute('style'),
          childCount: container.children.length,
          children: Array.from(container.children).map(child => ({
            className: child.className,
            dataPanel: child.getAttribute('data-panel'),
            order: window.getComputedStyle(child).order
          }))
        });
      }
      
      if (panel) {
        const rect = panel.getBoundingClientRect();
        const order = window.getComputedStyle(panel).order;
        console.log('Properties Panel Info:', {
          exists: true,
          position: { left: rect.left, right: rect.right, top: rect.top, width: rect.width },
          cssOrder: order,
          dataPanel: panel.getAttribute('data-panel'),
          dataOrder: panel.getAttribute('data-order')
        });
      } else {
        console.log('Properties panel element not found in DOM');
      }
    }, 100);
  }
  
  // Sequencer functions
  function addTrack(type = 'video', group = null) {
    // Check max track limit
    if (tracks.length >= maxTracks) {
      addNotification('warning', `⚠️ Maximum track limit reached (${maxTracks} tracks)`);
      return;
    }
    
    const newId = Math.max(...tracks.map(t => t.id), 0) + 1;
    const height = type === 'video' ? 80 : type === 'audio' ? 60 : 50;
    const trackName = type === 'video' ? 'Video' : type === 'audio' ? 'Audio' : 'Effects';
    
    // Auto-assign group based on type if not specified
    if (!group) {
      if (type === 'video') {
        group = tracks.filter(t => t.type === 'video').length < 2 ? 'main' : 'overlay';
      } else if (type === 'audio') {
        const audioCount = tracks.filter(t => t.type === 'audio').length;
        group = audioCount === 0 ? 'dialog' : audioCount === 1 ? 'music' : 'sfx';
      } else {
        group = 'fx';
      }
    }
    
    tracks = [...tracks, {
      id: newId,
      type,
      name: `${trackName} ${newId}`,
      clips: [],
      muted: false,
      solo: false,
      locked: false,
      visible: true,
      height,
      group
    }];
    
    saveToHistory();
    
    addNotification('success', `✅ Added ${trackName} track to ${trackGroups.find(g => g.id === group)?.name || group}`);
  }
  
  function toggleTrackGroup(groupId) {
    trackGroups = trackGroups.map(g => 
      g.id === groupId ? {...g, collapsed: !g.collapsed} : g
    );
  }
  
  function duplicateTrack(trackId) {
    const track = tracks.find(t => t.id === trackId);
    if (!track) return;
    
    if (tracks.length >= maxTracks) {
      addNotification('warning', `⚠️ Maximum track limit reached (${maxTracks} tracks)`);
      return;
    }
    
    const newId = Math.max(...tracks.map(t => t.id), 0) + 1;
    const newTrack = {
      ...track,
      id: newId,
      name: `${track.name} (Copy)`,
      clips: track.clips.map(clip => ({
        ...clip,
        id: `${clip.id}-copy-${Date.now()}`
      }))
    };
    
    tracks = [...tracks, newTrack];
    saveToHistory();
    addNotification('success', `✅ Duplicated track: ${track.name}`);
  }
  
  function moveTrack(trackId, direction) {
    const index = tracks.findIndex(t => t.id === trackId);
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= tracks.length) return;
    
    const newTracks = [...tracks];
    [newTracks[index], newTracks[newIndex]] = [newTracks[newIndex], newTracks[index]];
    tracks = newTracks;
    saveToHistory();
  }
  
  function removeTrack(trackId) {
    if (tracks.length <= 1) return;
    tracks = tracks.filter(t => t.id !== trackId);
    saveToHistory();
  }
  
  function toggleTrackMute(trackId) {
    tracks = tracks.map(t => t.id === trackId ? {...t, muted: !t.muted} : t);
  }
  
  function toggleTrackSolo(trackId) {
    tracks = tracks.map(t => t.id === trackId ? {...t, solo: !t.solo} : t);
  }
  
  // Text overlay management
  function addTextOverlay() {
    const overlayId = Date.now();
    const newOverlay = {
      id: overlayId,
      text: 'New Text',
      position: { x: 50, y: 50 },
      style: {
        fontSize: 24,
        fontFamily: 'Arial',
        color: '#ffffff',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textAlign: 'left',
        padding: 10,
        borderRadius: 4,
        textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
        rotation: 0,
        opacity: 1
      },
      // Sequencer properties
      startTime: currentTime, // Start at current playhead position
      duration: 5, // Default 5 seconds duration
      trimStart: 0,
      trimEnd: 5
    };
    textOverlays = [...textOverlays, newOverlay];
    selectedOverlayIndex = textOverlays.length - 1;
    showTextOverlayEditor = true;
    
    // Add text overlay to sequencer as a clip on a text/overlay track
    addTextToSequencer(newOverlay);
    
    saveToHistory();
    saveToLocalStorage();
  }
  
  function updateTextOverlay(index, updates) {
    textOverlays[index] = { ...textOverlays[index], ...updates };
    textOverlays = textOverlays; // Trigger reactivity
    
    // Update the corresponding clip in the sequencer if timing changed
    if (updates.startTime !== undefined || updates.duration !== undefined) {
  function deleteTextOverlay(index) {
    const overlay = textOverlays[index];
    
    // Remove from sequencer
    if (overlay) {
      removeTextClipFromSequencer(overlay.id);
    }
    
    textOverlays = textOverlays.filter((_, i) => i !== index);
    if (selectedOverlayIndex === index) {
      selectedOverlayIndex = null;
      showTextOverlayEditor = false;
    }
    saveToLocalStorage();
  }
  
  function selectTextOverlay(index) {
    selectedOverlayIndex = index;
    showTextOverlayEditor = true;
  }
  
  function closeTextOverlayEditor() {
    showTextOverlayEditor = false;
    selectedOverlayIndex = null;
  }
  
  // Text overlay sequencer integration functions
  function addTextToSequencer(overlay) {
    // Find or create a text/overlay track
    let textTrack = tracks.find(t => t.type === 'effects' && t.name.includes('Text'));
    
    if (!textTrack) {
      // Create a new text track
      const newTrackId = Math.max(...tracks.map(t => t.id), 0) + 1;
      textTrack = {
        id: newTrackId,
        type: 'effects',
        name: 'Text Overlays',
        clips: [],
        muted: false,
        solo: false,
        locked: false,
        visible: true,
        height: 60,
        group: 'overlay'
      };
      tracks = [...tracks, textTrack];
    }
    
    // Create a clip for this text overlay
    const textClip = {
      id: overlay.id,
      textOverlayId: overlay.id, // Reference to the text overlay
      name: overlay.text.substring(0, 20) + (overlay.text.length > 20 ? '...' : ''),
      startTime: overlay.startTime || 0,
      duration: overlay.duration || 5,
      trimStart: overlay.trimStart || 0,
      trimEnd: overlay.trimEnd || (overlay.duration || 5),
      color: '#8b5cf6', // Purple color for text clips
      type: 'effects',
      fadeIn: 0,
      fadeOut: 0,
      fadeInType: 'opacity',
      fadeOutType: 'opacity'
    };
    
    // Add clip to the text track
    textTrack.clips = [...textTrack.clips, textClip];
    tracks = tracks; // Trigger reactivity
  }
  
  function updateTextClipInSequencer(overlay) {
    // Find the text track
    const textTrack = tracks.find(t => 
      t.clips.some(c => c.textOverlayId === overlay.id)
    );
    
    if (textTrack) {
      const clipIndex = textTrack.clips.findIndex(c => c.textOverlayId === overlay.id);
      if (clipIndex !== -1) {
        textTrack.clips[clipIndex] = {
          ...textTrack.clips[clipIndex],
          name: overlay.text.substring(0, 20) + (overlay.text.length > 20 ? '...' : ''),
          startTime: overlay.startTime || textTrack.clips[clipIndex].startTime,
          duration: overlay.duration || textTrack.clips[clipIndex].duration,
          trimStart: overlay.trimStart || 0,
          trimEnd: overlay.trimEnd || (overlay.duration || 5)
        };
        tracks = tracks; // Trigger reactivity
      }
    }
  }
  
  function removeTextClipFromSequencer(overlayId) {
    // Find and remove the text clip from all tracks
    tracks = tracks.map(track => ({
      ...track,
      clips: track.clips.filter(c => c.textOverlayId !== overlayId)
    }));
  }
  
  // Handle when text clips are moved in the sequencer
  function syncTextOverlayFromClip(clipId, updates) {
    const overlayIndex = textOverlays.findIndex(o => o.id === clipId);
    if (overlayIndex !== -1) {
      textOverlays[overlayIndex] = {
        ...textOverlays[overlayIndex],
        startTime: updates.startTime !== undefined ? updates.startTime : textOverlays[overlayIndex].startTime,
        duration: updates.duration !== undefined ? updates.duration : textOverlays[overlayIndex].duration
      };
      textOverlays = textOverlays; // Trigger reactivity
    }
  }
  
  // Creator Tools handlers
  async function handleTemplateSelect(event) {
    const template = event.detail;
    console.log('Template selected:', template);
    
    try {
      // Apply template based on category
      if (template.category === 'intros' || template.category === 'outros') {
        // Create a color clip with the template style
        await applyIntroOutroTemplate(template);
      } else if (template.category === 'lower-thirds') {
        // Add lower third overlay
        applyLowerThirdTemplate(template);
      } else if (template.category === 'transitions') {
        // Apply transition to selected clips or timeline
        applyTransitionTemplate(template);
      } else if (template.category === 'text') {
        // Add text overlay with template style
        applyTextTemplate(template);
      }
      
      addNotification(`✨ Applied template: ${template.name}`, 'success', 2500);
      showCreatorTools = false; // Close creator tools after applying
    } catch (error) {
      console.error('Error applying template:', error);
      addNotification(`❌ Failed to apply template: ${error.message}`, 'error', 3000);
    }
  }
  
  function handleTemplatePreview(event) {
    const template = event.detail;
    console.log('Preview template:', template);
    previewTemplate = template;
    showTemplatePreview = true;
  }
  
  async function applyIntroOutroTemplate(template) {
    // Create a canvas with the template background
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    
    // Apply gradient background
    if (template.style.background.includes('gradient')) {
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      // Parse gradient colors (simplified)
      if (template.style.background.includes('667eea')) {
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
      } else if (template.style.background.includes('1e3c72')) {
        gradient.addColorStop(0, '#1e3c72');
        gradient.addColorStop(1, '#2a5298');
      } else if (template.style.background.includes('0f2027')) {
        gradient.addColorStop(0, '#0f2027');
        gradient.addColorStop(1, '#2c5364');
      } else if (template.style.background.includes('ff6b6b')) {
        gradient.addColorStop(0, '#ff6b6b');
        gradient.addColorStop(1, '#ee5a6f');
      } else if (template.style.background.includes('f093fb')) {
        gradient.addColorStop(0, '#f093fb');
        gradient.addColorStop(1, '#f5576c');
      } else if (template.style.background.includes('4facfe')) {
        gradient.addColorStop(0, '#4facfe');
        gradient.addColorStop(1, '#00f2fe');
      }
      ctx.fillStyle = gradient;
    } else {
      ctx.fillStyle = template.style.background;
    }
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Convert to blob and add to clips
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    const url = URL.createObjectURL(blob);
    
    const newClip = {
      id: Date.now() + Math.random(),
      name: template.name,
      url: url,
      duration: template.duration,
      thumbnail: canvas.toDataURL(),
      type: 'image',
      isTemplate: true,
      templateId: template.id,
      file: new File([blob], `${template.id}.png`, { type: 'image/png' })
    };
    
    // Add to appropriate position
    if (template.category === 'intros') {
      clips = [newClip, ...clips]; // Add to beginning
    } else {
      clips = [...clips, newClip]; // Add to end
    }
    
    // Add text overlay for the template
    const newOverlay = {
      id: Date.now(),
      text: template.name.includes('Subscribe') ? '👍 Subscribe & Like!' : 
            template.name.includes('Thanks') ? 'Thanks for Watching! 🙏' :
            template.name.includes('Social') ? 'Follow Us! 📱' :
            'Your Title Here',
      position: { x: canvas.width / 2 - 200, y: canvas.height / 2 - 50 },
      style: {
        fontSize: 72,
        fontFamily: 'Arial',
        color: template.style.textColor,
        backgroundColor: 'transparent',
        fontWeight: 'bold',
        fontStyle: 'normal',
        textAlign: 'center',
        padding: 20,
        borderRadius: 0,
        textShadow: '4px 4px 8px rgba(0, 0, 0, 0.8)',
        rotation: 0,
        opacity: 100
      }
    };
    textOverlays = [...textOverlays, newOverlay];
    saveToLocalStorage();
  }
  
  function applyLowerThirdTemplate(template) {
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    
    // Position lower third at bottom
    const yPosition = canvas.height - 200;
    
    const newOverlay = {
      id: Date.now(),
      text: 'Your Name\nYour Title',
      position: { x: 50, y: yPosition },
      style: {
        fontSize: 36,
        fontFamily: 'Arial',
        color: '#ffffff',
        backgroundColor: template.style.background || 'rgba(0, 0, 0, 0.8)',
        fontWeight: 'bold',
        fontStyle: 'normal',
        textAlign: 'left',
        padding: 20,
        borderRadius: 8,
        textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
        rotation: 0,
        opacity: 95
      }
    };
    
    textOverlays = [...textOverlays, newOverlay];
    saveToLocalStorage();
  }
  
  function applyTransitionTemplate(template) {
    // Apply transition effect to selected clips or between all clips
    if (selectedClipIds.size > 0) {
      // Apply to selected clips
      tracks = tracks.map(track => ({
        ...track,
        clips: track.clips.map(clip => {
          if (selectedClipIds.has(clip.id)) {
            return {
              ...clip,
              transition: template.effect,
              transitionDuration: template.duration
            };
          }
          return clip;
        })
      }));
    } else {
      // Apply to all clips in first track
      tracks = tracks.map((track, index) => {
        if (index === 0 && track.clips.length > 0) {
          return {
            ...track,
            clips: track.clips.map(clip => ({
              ...clip,
              transition: template.effect,
              transitionDuration: template.duration
            }))
          };
        }
        return track;
      });
    }
    saveToLocalStorage();
  }
  
  function applyTextTemplate(template) {
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    
    const newOverlay = {
      id: Date.now(),
      text: template.id.includes('quote') ? '"Your inspiring quote here"' : 
            template.id.includes('title') ? 'Your Title Here' : 
            'Your Text Here',
      position: { 
        x: canvas.width / 2 - 300, 
        y: template.style.textAlign === 'center' ? canvas.height / 2 - 50 : 100 
      },
      style: {
        fontSize: parseInt(template.style.fontSize) || 56,
        fontFamily: 'Arial',
        color: template.style.textColor || '#ffffff',
        backgroundColor: 'transparent',
        fontWeight: template.style.fontWeight || 'bold',
        fontStyle: template.style.fontStyle || 'normal',
        textAlign: template.style.textAlign || 'center',
        padding: 20,
        borderRadius: 0,
        textShadow: '3px 3px 6px rgba(0, 0, 0, 0.7)',
        rotation: 0,
        opacity: 100
      }
    };
    
    textOverlays = [...textOverlays, newOverlay];
    saveToLocalStorage();
  }
  
  function handleStickerSelect(event) {
    const sticker = event.detail;
    console.log('Sticker selected:', sticker);
    // Add sticker as a text overlay (reusing existing system)
    const newOverlay = {
      id: Date.now(),
      text: sticker.content,
      position: sticker.position,
      style: {
        fontSize: 48,
        fontFamily: 'Arial',
        color: '#ffffff',
        backgroundColor: 'transparent',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textAlign: 'center',
        padding: 0,
        borderRadius: 0,
        textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
        rotation: sticker.rotation || 0,
        opacity: (sticker.opacity || 100) / 100
      }
    };
    textOverlays = [...textOverlays, newOverlay];
    saveToLocalStorage();
  }
  
  function handleAudioSelect(event) {
    const audio = event.detail;
    console.log('Audio selected:', audio);
    // TODO: Add audio track to timeline
    // For now, just log
  }
  
  function toggleTrackLock(trackId) {
    tracks = tracks.map(t => t.id === trackId ? {...t, locked: !t.locked} : t);
  }
  
  function addClipToTrack(trackId, clipData) {
    const clipId = `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newClip = {
      id: clipId,
      startTime: currentTime,
      duration: clipData.duration || 5,
      file: clipData.file,
      name: clipData.name,
      thumbnail: clipData.thumbnail,
      trimStart: 0,
      trimEnd: clipData.duration || 5,
      color: getRandomClipColor(),
      type: clipData.type || 'video',
      url: clipData.url || (clipData.file ? URL.createObjectURL(clipData.file) : ''),
      // Per-clip transitions
      fadeIn: 0,
      fadeOut: 0,
      fadeInType: 'black',
      fadeOutType: 'black',
    };
    
    tracks = tracks.map(t => 
      t.id === trackId ? {...t, clips: [...t.clips, newClip]} : t
    );
    selectedClipId = clipId;
    saveToHistory();
  }
  
  function removeClipFromTrack(trackId, clipId) {
    tracks = tracks.map(t => 
      t.id === trackId ? {...t, clips: t.clips.filter(c => c.id !== clipId)} : t
    );
    if (selectedClipId === clipId) selectedClipId = null;
    saveToHistory();
  }
  
  function startDragClip(trackId, clip, e) {
    const track = tracks.find(t => t.id === trackId);
    if (track?.locked) return;
    
    draggingClip = { trackId, clip };
    const rect = e.currentTarget.getBoundingClientRect();
    dragOffset = e.clientX - rect.left;
  }
  
  function handleClipDrag(e) {
    if (!draggingClip) return;
    
    const sequencerRect = document.querySelector('.sequencer-timeline')?.getBoundingClientRect();
    if (!sequencerRect) return;
    
    const x = e.clientX - sequencerRect.left - dragOffset;
    let newTime = Math.max(0, x / effectivePixelsPerSecond);
    
    // Magnetic snapping with visual guides
    if (magneticSnapping) {
      activeSnapGuides = []; // Reset snap guides
      const allClips = tracks.flatMap(t => t.clips);
      
      for (const clip of allClips) {
        if (clip.id === draggingClip.clip.id) continue;
        
        const clipEnd = clip.startTime + clip.duration;
        if (Math.abs(newTime - clip.startTime) < snapDistance) {
          newTime = clip.startTime;
          if (showMagneticGuides) activeSnapGuides.push({ time: clip.startTime, type: 'clip-start' });
        }
        if (Math.abs(newTime - clipEnd) < snapDistance) {
          newTime = clipEnd;
          if (showMagneticGuides) activeSnapGuides.push({ time: clipEnd, type: 'clip-end' });
        }
      }
      
      // Snap to playhead
      if (Math.abs(newTime - currentTime) < snapDistance) {
        newTime = currentTime;
        if (showMagneticGuides) activeSnapGuides.push({ time: currentTime, type: 'playhead' });
      }
      
      // Snap to markers
      if (clipMarkers[draggingClip.clip.id]) {
        for (const marker of clipMarkers[draggingClip.clip.id]) {
          const markerTime = draggingClip.clip.startTime + marker.time;
          if (Math.abs(newTime - markerTime) < snapDistance) {
            newTime = markerTime;
            if (showMagneticGuides) activeSnapGuides.push({ time: markerTime, type: 'marker' });
          }
        }
      }
    }
    
    // Update clip position
    tracks = tracks.map(t => 
      t.id === draggingClip.trackId ? {
        ...t,
        clips: t.clips.map(c => 
          c.id === draggingClip.clip.id ? {...c, startTime: newTime} : c
        )
      } : t
    );
  }
  
  function endDragClip() {
    if (draggingClip) {
      // If this was a text clip, sync the text overlay timing
      const track = tracks.find(t => t.id === draggingClip.trackId);
      if (track) {
        const clip = track.clips.find(c => c.id === draggingClip.clip.id);
        if (clip && clip.textOverlayId) {
          syncTextOverlayFromClip(clip.textOverlayId, {
            startTime: clip.startTime,
            duration: clip.duration
          });
        }
      }
      saveToHistory();
    }
    draggingClip = null;
  }
  
  function getRandomClipColor() {
    const colors = [
      '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', 
      '#10b981', '#06b6d4', '#6366f1', '#ef4444'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  function selectClipInSequencer(trackId, clipId, multiSelect = false) {
    selectedTrackId = trackId;
    if (multiSelect) {
      if (selectedClipIds.has(clipId)) {
        selectedClipIds.delete(clipId);
        selectedClipIds = selectedClipIds;
      } else {
        selectedClipIds.add(clipId);
        selectedClipIds = selectedClipIds;
      }
    } else {
      selectedClipId = clipId;
      selectedClipIds = new Set([clipId]);
      
      // Preview the selected clip
      previewSelectedClip(trackId, clipId);
    }
  }
  
  // Preview a selected clip in the video player
  async function previewSelectedClip(trackId, clipId) {
    const track = tracks.find(t => t.id === trackId);
    if (!track) {
      console.log('Track not found:', trackId);
      return;
    }
    
    const clip = track.clips.find(c => c.id === clipId);
    if (!clip) {
      console.log('Clip not found:', clipId);
      return;
    }
    
    console.log('Previewing clip:', clip.name, 'Type:', clip.type, 'Has URL:', !!clip.url, 'Has dataUrl:', !!clip.dataUrl);
    
    // Trigger preview animation
    isPreviewingClip = true;
    setTimeout(() => { isPreviewingClip = false; }, 2000);
    
    // Only preview video clips
    if (clip.type === 'video' && videoElement && (clip.url || clip.dataUrl)) {
      activeClipType = 'video';
      const videoUrl = clip.url || clip.dataUrl;
      
      // If it's a different video, load it
      if (videoElement.src !== videoUrl) {
        isPlaying = false;
        videoElement.src = videoUrl;
        
        // Wait for video to load
        await new Promise((resolve) => {
          const onLoaded = () => {
            videoElement.removeEventListener('loadedmetadata', onLoaded);
            resolve();
          };
          videoElement.addEventListener('loadedmetadata', onLoaded);
        });
      }
      
      // Seek to the clip's trim start position
      if (videoElement.duration) {
        const seekTime = Math.max(0, Math.min(clip.trimStart || 0, videoElement.duration - 0.1));
        videoElement.currentTime = seekTime;
        currentTime = seekTime;
        
        // Show notification
        addNotification(`📹 Previewing: ${clip.name}`, 'info', 2000);
      }
    } else if (clip.type === 'image' && imagePreviewCanvas && (clip.url || clip.dataUrl)) {
      // Handle image preview
      activeClipType = 'image';
      const ctx = imagePreviewCanvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        imagePreviewCanvas.width = img.width;
        imagePreviewCanvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        // Show notification
        addNotification(`🖼️ Previewing: ${clip.name}`, 'info', 2000);
      };
      img.src = clip.url || clip.dataUrl;
    }
  }
  
  function addClipMarker(clipId, time, label = '', color = '#f59e0b', type = 'default', note = '') {
    if (!clipMarkers[clipId]) clipMarkers[clipId] = [];
    clipMarkers[clipId].push({ 
      id: Date.now(), 
      time, 
      label, 
      color: color || markerTypes[type]?.color || '#f59e0b',
      type,
      note
    });
    clipMarkers = clipMarkers;
    addNotification(`\ud83d\udccd Marker added: ${label || markerTypes[type]?.name || 'Marker'}`, 'success', 2000);
  }
  
  function deleteMarker(clipId, markerId) {
    if (!clipMarkers[clipId]) return;
    clipMarkers[clipId] = clipMarkers[clipId].filter(m => m.id !== markerId);
    clipMarkers = clipMarkers;
    addNotification('\ud83d\uddd1\ufe0f Marker deleted', 'info', 1500);
  }
  
  function editMarker(clipId, markerId) {
    if (!clipMarkers[clipId]) return;
    const marker = clipMarkers[clipId].find(m => m.id === markerId);
    if (!marker) return;
    editingMarker = { clipId, ...marker };
    showMarkerEditor = true;
  }
  
  function saveMarkerEdit() {
    if (!editingMarker) return;
    const { clipId, id, label, color, type, note } = editingMarker;
    if (!clipMarkers[clipId]) return;
    
    clipMarkers[clipId] = clipMarkers[clipId].map(m => 
      m.id === id ? { ...m, label, color, type, note } : m
    );
    clipMarkers = clipMarkers;
    showMarkerEditor = false;
    editingMarker = null;
    addNotification('\u2705 Marker updated', 'success', 1500);
  }
  
  function showClipContextMenu(event, clip, track) {
    event.preventDefault();
    contextMenuX = event.clientX;
    contextMenuY = event.clientY;
    contextMenuClip = clip;
    contextMenuTrack = track;
    showContextMenu = true;
  }
  
  function hideContextMenu() {
    showContextMenu = false;
    contextMenuClip = null;
    contextMenuTrack = null;
  }
  
  function addMarkerAtPlayhead() {
    if (!contextMenuClip) return;
    const relativeTime = currentTime - contextMenuClip.startTime;
    if (relativeTime >= 0 && relativeTime <= contextMenuClip.duration) {
      addClipMarker(contextMenuClip.id, relativeTime, '', '#f59e0b', 'default', '');
    }
    hideContextMenu();
  }
  
  function setLoopRegion() {
    loopStart = trimStart;
    loopEnd = trimEnd;
    loopPlayback = true;
  }
  
  // Render Queue Functions
  function addToRenderQueue(templateKey) {
    const template = exportTemplates[templateKey];
    if (!template) return;
    
    const queueItem = {
      id: `render-${Date.now()}`,
      name: `${videoName || 'Video'} - ${template.name}`,
      templateKey,
      format: template.format,
      quality: template,
      status: 'pending', // pending, rendering, completed, failed
      progress: 0,
      error: null,
      timestamp: Date.now()
    };
    
    renderQueue = [...renderQueue, queueItem];
    showRenderQueue = true;
    addNotification(`\ud83c\udfa5 Added to render queue: ${template.name}`, 'success', 2500);
  }
  
  function removeFromRenderQueue(id) {
    renderQueue = renderQueue.filter(item => item.id !== id);
    addNotification('\ud83d\uddd1\ufe0f Removed from render queue', 'info', 1500);
  }
  
  function clearRenderQueue() {
    renderQueue = [];
    addNotification('\ud83e\uddf9 Render queue cleared', 'info', 1500);
  }
  
  async function processRenderQueue() {
    const pendingItems = renderQueue.filter(item => item.status === 'pending');
    if (pendingItems.length === 0) {
      addNotification('\u2705 No pending renders in queue', 'info', 2000);
      return;
    }
    
    addNotification(`\ud83d\ude80 Processing ${pendingItems.length} render(s)...`, 'info', 3000);
    
    for (const item of pendingItems) {
      try {
        // Update status to rendering
        renderQueue = renderQueue.map(r => 
          r.id === item.id ? { ...r, status: 'rendering', progress: 0 } : r
        );
        
        // TODO: Implement actual export with progress callback
        // For now, simulate export
        await simulateExport(item);
        
        // Mark as completed
        renderQueue = renderQueue.map(r => 
          r.id === item.id ? { ...r, status: 'completed', progress: 100 } : r
        );
        
        addNotification(`\u2705 Completed: ${item.name}`, 'success', 2500);
      } catch (error) {
        renderQueue = renderQueue.map(r => 
          r.id === item.id ? { ...r, status: 'failed', error: error.message } : r
        );
        addNotification(`\u274c Failed: ${item.name}`, 'error', 3000);
      }
    }
    
    addNotification('\ud83c\udf89 Render queue complete!', 'success', 3000);
  }
  
  async function simulateExport(item) {
    // Simulate export progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      renderQueue = renderQueue.map(r => 
        r.id === item.id ? { ...r, progress: i } : r
      );
    }
  }
  
  // ==================== KEYFRAME ANIMATION ====================
  
  function addKeyframe(clipId, property, time, value) {
    if (!keyframes[clipId]) keyframes[clipId] = {};
    if (!keyframes[clipId][property]) keyframes[clipId][property] = [];
    
    // Remove existing keyframe at this time
    keyframes[clipId][property] = keyframes[clipId][property].filter(kf => kf.time !== time);
    
    // Add new keyframe
    keyframes[clipId][property].push({ 
      time, 
      value, 
      easing: keyframeEasing,
      id: Date.now() 
    });
    
    // Sort by time
    keyframes[clipId][property].sort((a, b) => a.time - b.time);
    keyframes = keyframes;
    
    addNotification(`\u2728 Keyframe added: ${keyframeProperties[property].label}`, 'success', 2000);
  }
  
  function deleteKeyframe(clipId, property, keyframeId) {
    if (!keyframes[clipId]?.[property]) return;
    keyframes[clipId][property] = keyframes[clipId][property].filter(kf => kf.id !== keyframeId);
    keyframes = keyframes;
    addNotification('\ud83d\uddd1\ufe0f Keyframe deleted', 'info', 1500);
  }
  
  function getInterpolatedValue(clipId, property, time) {
    if (!keyframes[clipId]?.[property] || keyframes[clipId][property].length === 0) {
      return keyframeProperties[property].default;
    }
    
    const kfs = keyframes[clipId][property];
    
    // Before first keyframe
    if (time <= kfs[0].time) return kfs[0].value;
    
    // After last keyframe
    if (time >= kfs[kfs.length - 1].time) return kfs[kfs.length - 1].value;
    
    // Find surrounding keyframes
    let prevKf = kfs[0];
    let nextKf = kfs[kfs.length - 1];
    
    for (let i = 0; i < kfs.length - 1; i++) {
      if (time >= kfs[i].time && time <= kfs[i + 1].time) {
        prevKf = kfs[i];
        nextKf = kfs[i + 1];
        break;
      }
    }
    
    // Linear interpolation factor
    const t = (time - prevKf.time) / (nextKf.time - prevKf.time);
    
    // Apply easing
    const easedT = applyEasing(t, prevKf.easing || 'linear');
    
    // Interpolate based on type
    const propType = keyframeProperties[property].type;
    if (propType === 'number') {
      return prevKf.value + (nextKf.value - prevKf.value) * easedT;
    } else if (propType === 'vector2') {
      return {
        x: prevKf.value.x + (nextKf.value.x - prevKf.value.x) * easedT,
        y: prevKf.value.y + (nextKf.value.y - prevKf.value.y) * easedT
      };
    }
    
    return prevKf.value;
  }
  
  function applyEasing(t, easing) {
    switch (easing) {
      case 'easeIn':
        return t * t * t;
      case 'easeOut':
        return 1 - Math.pow(1 - t, 3);
      case 'easeInOut':
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      default:
        return t; // linear
    }
  }
  
  // ==================== LUT SUPPORT ====================
  
  async function loadLUTFile(file) {
    try {
      const text = await file.text();
      const lut = parseCubeLUT(text);
      luts.push({
        id: Date.now(),
        name: file.name.replace('.cube', ''),
        data: lut,
        custom: true
      });
      luts = luts;
      addNotification(`\ud83c\udfa8 LUT loaded: ${file.name}`, 'success', 2500);
    } catch (error) {
      addNotification(`\u274c Failed to load LUT: ${error.message}`, 'error', 3000);
    }
  }
  
  function parseCubeLUT(text) {
    // Simple .cube LUT parser
    const lines = text.split('\\n');
    let size = 33; // Default size
    const data = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip comments and empty lines
      if (trimmed.startsWith('#') || trimmed === '') continue;
      
      // Parse size
      if (trimmed.startsWith('LUT_3D_SIZE')) {
        size = parseInt(trimmed.split(/\\s+/)[1]);
        continue;
      }
      
      // Parse RGB values
      const values = trimmed.split(/\\s+/).map(parseFloat);
      if (values.length === 3 && values.every(v => !isNaN(v))) {
        data.push(values);
      }
    }
    
    return { size, data };
  }
  
  function applyLUT(imageData, lut, intensity = 1) {
    if (!lut || intensity === 0) return imageData;
    
    const { data: lutData, size } = lut;
    const pixels = imageData.data;
    
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i] / 255;
      const g = pixels[i + 1] / 255;
      const b = pixels[i + 2] / 255;
      
      // Map to LUT indices
      const rIdx = Math.floor(r * (size - 1));
      const gIdx = Math.floor(g * (size - 1));
      const bIdx = Math.floor(b * (size - 1));
      
      const lutIdx = rIdx + gIdx * size + bIdx * size * size;
      
      if (lutData[lutIdx]) {
        const [newR, newG, newB] = lutData[lutIdx];
        
        // Blend with original based on intensity
        pixels[i] = pixels[i] * (1 - intensity) + newR * 255 * intensity;
        pixels[i + 1] = pixels[i + 1] * (1 - intensity) + newG * 255 * intensity;
        pixels[i + 2] = pixels[i + 2] * (1 - intensity) + newB * 255 * intensity;
      }
    }
    
    return imageData;
  }
  
  // ==================== MASKS & ROTOSCOPING ====================
  
  function addMask(type = 'rectangle') {
    const mask = {
      id: Date.now(),
      type,
      points: type === 'rectangle' ? [{ x: 100, y: 100 }, { x: 400, y: 300 }] : 
              type === 'ellipse' ? [{ x: 250, y: 200, rx: 150, ry: 100 }] : [],
      feather: maskFeather,
      invert: maskInvert,
      enabled: true,
      clipId: selectedClipId
    };
    
    masks.push(mask);
    masks = masks;
    selectedMaskId = mask.id;
    addNotification(`\ud83c\udfad Mask added: ${maskTypes[type].name}`, 'success', 2000);
  }
  
  function deleteMask(maskId) {
    masks = masks.filter(m => m.id !== maskId);
    if (selectedMaskId === maskId) selectedMaskId = null;
    addNotification('\ud83d\uddd1\ufe0f Mask deleted', 'info', 1500);
  }
  
  function applyMask(ctx, mask, width, height) {
    if (!mask.enabled) return;
    
    ctx.save();
    ctx.beginPath();
    
    if (mask.type === 'rectangle' && mask.points.length >= 2) {
      const [p1, p2] = mask.points;
      ctx.rect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
    } else if (mask.type === 'ellipse' && mask.points.length >= 1) {
      const p = mask.points[0];
      ctx.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, Math.PI * 2);
    } else if (mask.type === 'polygon' && mask.points.length >= 3) {
      ctx.moveTo(mask.points[0].x, mask.points[0].y);
      for (let i = 1; i < mask.points.length; i++) {
        ctx.lineTo(mask.points[i].x, mask.points[i].y);
      }
      ctx.closePath();
    }
    
    // Apply feathering with shadow blur
    if (mask.feather > 0) {
      ctx.shadowBlur = mask.feather;
      ctx.shadowColor = 'black';
    }
    
    if (mask.invert) {
      // Invert mask: clear inside, keep outside
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      // Normal mask: keep inside, clear outside
      ctx.globalCompositeOperation = 'destination-in';
    }
    
    ctx.fill();
    ctx.restore();
  }
  
  // ==================== PROFESSIONAL CINEMATIC FUNCTIONS ====================
  
  // Color Scopes Rendering
  function renderColorScopes(canvas, imageData) {
    if (!canvas || !imageData) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);
    
    switch (activeScopeTab) {
      case 'waveform':
        renderWaveform(ctx, imageData, width, height);
        break;
      case 'vectorscope':
        renderVectorscope(ctx, imageData, width, height);
        break;
      case 'histogram':
        renderHistogram(ctx, imageData, width, height);
        break;
      case 'parade':
        renderParade(ctx, imageData, width, height);
        break;
    }
  }
  
  function renderWaveform(ctx, imageData, width, height) {
    const pixels = imageData.data;
    const sourceWidth = imageData.width;
    const sourceHeight = imageData.height;
    
    // Create brightness map
    const waveformData = new Array(width).fill(null).map(() => new Array(256).fill(0));
    
    for (let y = 0; y < sourceHeight; y++) {
      for (let x = 0; x < sourceWidth; x++) {
        const i = (y * sourceWidth + x) * 4;
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        
        // Calculate luma (brightness)
        const luma = Math.floor(0.299 * r + 0.587 * g + 0.114 * b);
        const xPos = Math.floor(x / sourceWidth * width);
        waveformData[xPos][luma]++;
      }
    }
    
    // Draw waveform
    for (let x = 0; x < width; x++) {
      for (let luma = 0; luma < 256; luma++) {
        if (waveformData[x][luma] > 0) {
          const yPos = height - (luma / 255 * height);
          const intensity = Math.min(waveformData[x][luma] / 10, 1);
          ctx.fillStyle = `rgba(0, 255, 100, ${intensity})`;
          ctx.fillRect(x, yPos, 1, 2);
        }
      }
    }
    
    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const y = (i / 10) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }
  
  function renderVectorscope(ctx, imageData, width, height) {
    const pixels = imageData.data;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 10;
    
    // Draw graticule (circular grid)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    
    // Circles
    for (let r = 0.25; r <= 1; r += 0.25) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * r, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // Radial lines for primary colors
    const colorAngles = {
      R: 0, Mg: 60, B: 120, Cy: 180, G: 240, Yl: 300
    };
    
    Object.entries(colorAngles).forEach(([label, angle]) => {
      const rad = (angle - 90) * Math.PI / 180;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(rad) * radius,
        centerY + Math.sin(rad) * radius
      );
      ctx.stroke();
      
      // Label
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '10px monospace';
      ctx.fillText(
        label,
        centerX + Math.cos(rad) * (radius + 15) - 5,
        centerY + Math.sin(rad) * (radius + 15) + 5
      );
    });
    
    // Plot pixels
    ctx.fillStyle = 'rgba(0, 255, 100, 0.3)';
    for (let i = 0; i < pixels.length; i += 16) { // Sample every 4 pixels for performance
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      
      // Convert RGB to UV coordinates
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      const u = (b - luma) * 0.565;
      const v = (r - luma) * 0.713;
      
      const x = centerX + (u / 128) * radius;
      const y = centerY - (v / 128) * radius;
      
      ctx.fillRect(x, y, 2, 2);
    }
  }
  
  function renderHistogram(ctx, imageData, width, height) {
    const pixels = imageData.data;
    
    // Calculate histograms for R, G, B
    const rHist = new Array(256).fill(0);
    const gHist = new Array(256).fill(0);
    const bHist = new Array(256).fill(0);
    
    for (let i = 0; i < pixels.length; i += 4) {
      rHist[pixels[i]]++;
      gHist[pixels[i + 1]]++;
      bHist[pixels[i + 2]]++;
    }
    
    // Find max for scaling
    const maxCount = Math.max(...rHist, ...gHist, ...bHist);
    
    // Draw histograms
    const barWidth = width / 256;
    
    function drawHistChannel(hist, color) {
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.5;
      for (let i = 0; i < 256; i++) {
        const barHeight = (hist[i] / maxCount) * height;
        ctx.fillRect(i * barWidth, height - barHeight, barWidth, barHeight);
      }
      ctx.globalAlpha = 1;
    }
    
    drawHistChannel(rHist, '#ff0000');
    drawHistChannel(gHist, '#00ff00');
    drawHistChannel(bHist, '#0000ff');
    
    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const x = (i / 10) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
  }
  
  function renderParade(ctx, imageData, width, height) {
    const pixels = imageData.data;
    const channelWidth = width / 3;
    
    // Create RGB parade data
    const rData = new Array(Math.floor(channelWidth)).fill(null).map(() => new Array(256).fill(0));
    const gData = new Array(Math.floor(channelWidth)).fill(null).map(() => new Array(256).fill(0));
    const bData = new Array(Math.floor(channelWidth)).fill(null).map(() => new Array(256).fill(0));
    
    const sourceWidth = imageData.width;
    const sourceHeight = imageData.height;
    
    for (let y = 0; y < sourceHeight; y++) {
      for (let x = 0; x < sourceWidth; x++) {
        const i = (y * sourceWidth + x) * 4;
        const xPos = Math.floor(x / sourceWidth * channelWidth);
        
        rData[xPos][pixels[i]]++;
        gData[xPos][pixels[i + 1]]++;
        bData[xPos][pixels[i + 2]]++;
      }
    }
    
    // Draw RGB channels
    function drawChannel(data, color, offsetX) {
      for (let x = 0; x < data.length; x++) {
        for (let value = 0; value < 256; value++) {
          if (data[x][value] > 0) {
            const yPos = height - (value / 255 * height);
            const intensity = Math.min(data[x][value] / 10, 1);
            ctx.fillStyle = `rgba(${color}, ${intensity})`;
            ctx.fillRect(offsetX + x, yPos, 1, 2);
          }
        }
      }
    }
    
    drawChannel(rData, '255, 0, 0', 0);
    drawChannel(gData, '0, 255, 0', channelWidth);
    drawChannel(bData, '0, 0, 255', channelWidth * 2);
    
    // Draw dividers
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(channelWidth, 0);
    ctx.lineTo(channelWidth, height);
    ctx.moveTo(channelWidth * 2, 0);
    ctx.lineTo(channelWidth * 2, height);
    ctx.stroke();
  }
  
  // Color Wheels Application
  function applyColorWheels(r, g, b) {
    // Apply Lift (Shadows)
    r += colorWheels.lift.r * 255 * (1 - r / 255);
    g += colorWheels.lift.g * 255 * (1 - g / 255);
    b += colorWheels.lift.b * 255 * (1 - b / 255);
    
    // Apply Gamma (Midtones)
    const gamma = 1 + colorWheels.gamma.master;
    r = 255 * Math.pow(r / 255, 1 / gamma);
    g = 255 * Math.pow(g / 255, 1 / gamma);
    b = 255 * Math.pow(b / 255, 1 / gamma);
    
    // Apply Gain (Highlights)
    r *= 1 + colorWheels.gain.r;
    g *= 1 + colorWheels.gain.g;
    b *= 1 + colorWheels.gain.b;
    
    // Apply Offset
    const offset = colorWheels.offset * 2.55;
    r += offset;
    g += offset;
    b += offset;
    
    return {
      r: Math.max(0, Math.min(255, r)),
      g: Math.max(0, Math.min(255, g)),
      b: Math.max(0, Math.min(255, b))
    };
  }
  
  // Speed Ramping
  function getSpeedAtTime(time) {
    if (!speedControl.rampEnabled || speedControl.rampPoints.length < 2) {
      return speedControl.speed;
    }
    
    // Find surrounding ramp points
    const points = [...speedControl.rampPoints].sort((a, b) => a.time - b.time);
    
    if (time <= points[0].time) return points[0].speed;
    if (time >= points[points.length - 1].time) return points[points.length - 1].speed;
    
    // Interpolate between points
    for (let i = 0; i < points.length - 1; i++) {
      if (time >= points[i].time && time <= points[i + 1].time) {
        const t = (time - points[i].time) / (points[i + 1].time - points[i].time);
        
        if (speedControl.interpolation === 'smooth') {
          // Smooth interpolation using ease-in-out
          const smoothT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
          return points[i].speed + (points[i + 1].speed - points[i].speed) * smoothT;
        } else if (speedControl.interpolation === 'hold') {
          return points[i].speed;
        } else {
          // Linear
          return points[i].speed + (points[i + 1].speed - points[i].speed) * t;
        }
      }
    }
    
    return speedControl.speed;
  }
  
  // Advanced Chroma Key
  function applyAdvancedChromaKey(ctx, imageData) {
    if (!advancedChromaKey.enabled) return imageData;
    
    const pixels = imageData.data;
    const keyColor = hexToRgb(advancedChromaKey.keyColor);
    
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      
      // Calculate color distance
      const distance = Math.sqrt(
        Math.pow(r - keyColor.r, 2) +
        Math.pow(g - keyColor.g, 2) +
        Math.pow(b - keyColor.b, 2)
      ) / 441.67; // Normalize to 0-1
      
      // Calculate alpha based on tolerance
      let alpha = 1;
      if (distance < advancedChromaKey.tolerance) {
        alpha = 0;
      } else if (distance < advancedChromaKey.tolerance + advancedChromaKey.softness) {
        // Soft edge
        alpha = (distance - advancedChromaKey.tolerance) / advancedChromaKey.softness;
      }
      
      // Apply despill (remove color cast)
      if (advancedChromaKey.despill > 0) {
        const despillAmount = (1 - distance) * advancedChromaKey.despill;
        if (advancedChromaKey.spillSuppress === 'green') {
          pixels[i + 1] = Math.min(pixels[i], pixels[i + 2]); // Remove green
        } else if (advancedChromaKey.spillSuppress === 'blue') {
          pixels[i + 2] = Math.min(pixels[i], pixels[i + 1]); // Remove blue
        }
      }
      
      pixels[i + 3] = Math.floor(alpha * 255);
    }
    
    return imageData;
  }
  
  // Lens Flare Rendering
  function renderLensFlare(ctx, width, height) {
    if (!lensFlare.enabled) return;
    
    const x = (lensFlare.position.x / 100) * width;
    const y = (lensFlare.position.y / 100) * height;
    
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = lensFlare.intensity / 100;
    
    if (lensFlare.type === 'cinematic' || lensFlare.type === 'sun') {
      // Main glow
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, 100 * lensFlare.scale);
      gradient.addColorStop(0, lensFlare.color);
      gradient.addColorStop(0.5, `${lensFlare.color}33`);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      
      // Additional lens artifacts
      for (let i = 0; i < 5; i++) {
        const offsetX = x + (width / 2 - x) * (i / 5);
        const offsetY = y + (height / 2 - y) * (i / 5);
        const size = 20 - i * 3;
        
        ctx.beginPath();
        ctx.arc(offsetX, offsetY, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 200, 150, ${0.3 - i * 0.05})`;
        ctx.fill();
      }
    } else if (lensFlare.type === 'anamorphic') {
      // Horizontal streak
      ctx.fillStyle = lensFlare.color;
      ctx.fillRect(0, y - 2, width, 4);
      
      // Blue horizontal flares
      ctx.fillStyle = 'rgba(100, 150, 255, 0.5)';
      ctx.fillRect(0, y - 10, width, 2);
      ctx.fillRect(0, y + 10, width, 2);
    }
    
    ctx.restore();
  }
  
  // Film Grain Application
  function applyFilmGrain(ctx, imageData) {
    if (!filmLook.enabled || filmLook.grainIntensity === 0) return imageData;
    
    const pixels = imageData.data;
    const grainStrength = filmLook.grainIntensity / 100;
    
    for (let i = 0; i < pixels.length; i += 4) {
      const grain = (Math.random() - 0.5) * grainStrength * 50;
      pixels[i] = Math.max(0, Math.min(255, pixels[i] + grain));
      pixels[i + 1] = Math.max(0, Math.min(255, pixels[i + 1] + grain));
      pixels[i + 2] = Math.max(0, Math.min(255, pixels[i + 2] + grain));
    }
    
    return imageData;
  }
  
  // Helper: Convert hex color to RGB
  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }
  
  // Apply Cinematic Aspect Ratio
  function applyCinematicAspectRatio(ctx, width, height) {
    if (!aspectRatio.enabled) return;
    
    const preset = aspectRatioPresets[aspectRatio.ratio];
    if (!preset) return;
    
    const targetRatio = preset.width / preset.height;
    const currentRatio = width / height;
    
    let cropHeight, cropWidth;
    
    if (aspectRatio.cropType === 'letterbox') {
      // Add black bars top/bottom
      if (currentRatio > targetRatio) {
        cropHeight = width / targetRatio;
        const barHeight = (height - cropHeight) / 2;
        
        ctx.fillStyle = `rgba(0, 0, 0, ${aspectRatio.overlayOpacity / 100})`;
        ctx.fillRect(0, 0, width, barHeight);
        ctx.fillRect(0, height - barHeight, width, barHeight);
      }
    } else if (aspectRatio.cropType === 'pillarbox') {
      // Add black bars left/right
      if (currentRatio < targetRatio) {
        cropWidth = height * targetRatio;
        const barWidth = (width - cropWidth) / 2;
        
        ctx.fillStyle = `rgba(0, 0, 0, ${aspectRatio.overlayOpacity / 100})`;
        ctx.fillRect(0, 0, barWidth, height);
        ctx.fillRect(width - barWidth, 0, barWidth, height);
      }
    }
  }
  
  // ==================== END CINEMATIC FUNCTIONS ====================
  
  // ==================== ADVANCED AUDIO ====================
  
  function createAudioProcessor(audioContext) {
    const processor = {
      eq: null,
      compressor: null,
      reverb: null,
      delay: null,
      gate: null
    };
    
    // 3-Band EQ
    if (audioEQ.enabled) {
      processor.eq = {
        low: audioContext.createBiquadFilter(),
        mid: audioContext.createBiquadFilter(),
        high: audioContext.createBiquadFilter()
      };
      
      processor.eq.low.type = 'lowshelf';
      processor.eq.low.frequency.value = audioEQ.lowFreq;
      processor.eq.low.gain.value = audioEQ.lowGain;
      
      processor.eq.mid.type = 'peaking';
      processor.eq.mid.frequency.value = audioEQ.midFreq;
      processor.eq.mid.gain.value = audioEQ.midGain;
      processor.eq.mid.Q.value = 1;
      
      processor.eq.high.type = 'highshelf';
      processor.eq.high.frequency.value = audioEQ.highFreq;
      processor.eq.high.gain.value = audioEQ.highGain;
    }
    
    // Compressor
    if (audioCompressor.enabled) {
      processor.compressor = audioContext.createDynamicsCompressor();
      processor.compressor.threshold.value = audioCompressor.threshold;
      processor.compressor.ratio.value = audioCompressor.ratio;
      processor.compressor.attack.value = audioCompressor.attack / 1000;
      processor.compressor.release.value = audioCompressor.release / 1000;
      processor.compressor.knee.value = audioCompressor.knee;
    }
    
    return processor;
  }
  
  function connectAudioChain(source, processor, destination) {
    let current = source;
    
    // Connect EQ chain
    if (processor.eq) {
      current.connect(processor.eq.low);
      processor.eq.low.connect(processor.eq.mid);
      processor.eq.mid.connect(processor.eq.high);
      current = processor.eq.high;
    }
    
    // Connect compressor
    if (processor.compressor) {
      current.connect(processor.compressor);
      current = processor.compressor;
    }
    
    // Connect to destination
    current.connect(destination);
  }
  
  // Get the currently selected clip object
  function getSelectedClip() {
    if (!selectedClipId) return null;
    const track = tracks.find(t => t.id === selectedTrackId);
    if (!track) return null;
    return track.clips.find(c => c.id === selectedClipId);
  }
  
  // Update selected clip transitions
  function updateClipTransition(property, value) {
    if (!selectedClipId) return;
    tracks = tracks.map(t => 
      t.id === selectedTrackId ? {
        ...t,
        clips: t.clips.map(c => 
          c.id === selectedClipId ? {...c, [property]: value} : c
        )
      } : t
    );
  }
  
  function splitClipAtPlayhead(trackId, clipId) {
    const track = tracks.find(t => t.id === trackId);
    if (!track) return;
    
    const clip = track.clips.find(c => c.id === clipId);
    if (!clip || currentTime < clip.startTime || currentTime > clip.startTime + clip.duration) return;
    
    const splitPoint = currentTime - clip.startTime;
    const newClipId = `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const clip1 = {
      ...clip,
      duration: splitPoint,
      trimEnd: clip.trimStart + splitPoint,
    };
    
    const clip2 = {
      ...clip,
      id: newClipId,
      startTime: currentTime,
      duration: clip.duration - splitPoint,
      trimStart: clip.trimStart + splitPoint,
    };
    
    tracks = tracks.map(t => 
      t.id === trackId ? {
        ...t,
        clips: [...t.clips.filter(c => c.id !== clipId), clip1, clip2]
      } : t
    );
  }
  
  // Outliner to Sequencer drag-and-drop
  function startDragFromOutliner(clip, e) {
    draggingFromOutliner = clip;
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', clip.name);
  }
  
  function handleDragOverTrack(trackId, e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    dropTargetTrackId = trackId;
  }
  
  function handleDragLeaveTrack() {
    dropTargetTrackId = null;
  }
  
  function handleDropOnTrack(trackId, e) {
    e.preventDefault();
    dropTargetTrackId = null;
    
    if (!draggingFromOutliner) return;
    
    const track = tracks.find(t => t.id === trackId);
    if (!track || track.locked) return;
    
    // Calculate drop position based on mouse X
    const trackElement = e.currentTarget;
    const rect = trackElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const dropTime = Math.max(0, x / effectivePixelsPerSecond);
    
    // Add clip to track at drop position
    const clipId = `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newClip = {
      id: clipId,
      startTime: dropTime,
      duration: draggingFromOutliner.duration || 5,
      file: draggingFromOutliner.file,
      name: draggingFromOutliner.name,
      thumbnail: draggingFromOutliner.thumbnail,
      trimStart: 0,
      trimEnd: draggingFromOutliner.duration || 5,
      color: getRandomClipColor(),
      type: draggingFromOutliner.type || 'video',
      url: draggingFromOutliner.url || (draggingFromOutliner.file ? URL.createObjectURL(draggingFromOutliner.file) : ''),
      dataUrl: draggingFromOutliner.dataUrl,
      // Per-clip transitions
      fadeIn: 0,
      fadeOut: 0,
      fadeInType: 'black',
      fadeOutType: 'black',
    };
    
    tracks = tracks.map(t => 
      t.id === trackId ? {...t, clips: [...t.clips, newClip]} : t
    );
    selectedClipId = clipId;
    
    draggingFromOutliner = null;
  }
  
  function endDragFromOutliner() {
    draggingFromOutliner = null;
    dropTargetTrackId = null;
  }

  // Save current state to history
  function saveToHistory() {
    const state = {
      tracks: JSON.parse(JSON.stringify(tracks)),
      trimStart,
      trimEnd,
      effects: JSON.parse(JSON.stringify(effects)),
      filters: JSON.parse(JSON.stringify(filters)),
      textOverlays: JSON.parse(JSON.stringify(textOverlays)),
      transitions: JSON.parse(JSON.stringify(transitions)),
      timestamp: Date.now()
    };
    
    // Remove any history after current index (when making new changes after undo)
    if (historyIndex < history.length - 1) {
      history = history.slice(0, historyIndex + 1);
    }
    
    // Add new state
    history.push(state);
    
    // Limit history size
    if (history.length > MAX_HISTORY) {
      history = history.slice(history.length - MAX_HISTORY);
    }
    
    historyIndex = history.length - 1;
    console.log(`📝 State saved to history (${historyIndex + 1}/${history.length})`);
  }
  
  // Undo to previous state
  function undo() {
    // Need at least 2 states (current + previous) to undo
    if (history.length < 2 || historyIndex <= 0) {
      addNotification('info', 'Nothing to undo');
      console.log('⚠️ Cannot undo: historyIndex=' + historyIndex + ', history.length=' + history.length);
      return;
    }
    
    historyIndex--;
    const state = history[historyIndex];
    
    // Restore state
    tracks = JSON.parse(JSON.stringify(state.tracks));
    trimStart = state.trimStart;
    trimEnd = state.trimEnd;
    effects = JSON.parse(JSON.stringify(state.effects));
    filters = JSON.parse(JSON.stringify(state.filters));
    textOverlays = JSON.parse(JSON.stringify(state.textOverlays));
    transitions = JSON.parse(JSON.stringify(state.transitions));
    
    addNotification('success', `↩️ Undo (${historyIndex + 1}/${history.length})`);
    console.log(`↩️ Undo to state ${historyIndex + 1}/${history.length}`);
  }
  
  // Redo to next state
  function redo() {
    if (historyIndex >= history.length - 1) {
      addNotification('info', 'Nothing to redo');
      return;
    }
    
    historyIndex++;
    const state = history[historyIndex];
    
    // Restore state
    tracks = JSON.parse(JSON.stringify(state.tracks));
    trimStart = state.trimStart;
    trimEnd = state.trimEnd;
    effects = JSON.parse(JSON.stringify(state.effects));
    filters = JSON.parse(JSON.stringify(state.filters));
    textOverlays = JSON.parse(JSON.stringify(state.textOverlays));
    transitions = JSON.parse(JSON.stringify(state.transitions));
    
    addNotification('success', `↪️ Redo (${historyIndex + 1}/${history.length})`);
    console.log(`↪️ Redo to state ${historyIndex + 1}/${history.length}`);
  }
  
  function handleKeydown(e) {
    // Skip if user is typing in input/textarea
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return;
    }
    
    // Undo with Ctrl+Z or Cmd+Z
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      console.log('\u23f1\ufe0f Ctrl+Z pressed, calling undo()');
      undo();
      return;
    }
    
    // Redo with Ctrl+Shift+Z or Cmd+Shift+Z
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
      e.preventDefault();
      console.log('\u23f1\ufe0f Ctrl+Shift+Z pressed, calling redo()');
      redo();
      return;
    }
    
    // Show keyboard shortcuts with ? key
    if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
      e.preventDefault();
      showKeyboardShortcuts = !showKeyboardShortcuts;
      return;
    }
    
    if (e.key === 'Escape') {
      // Close shortcuts modal first if open
      if (showKeyboardShortcuts) {
        showKeyboardShortcuts = false;
        return;
      }
      onClose();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (e.shiftKey) {
        // Shift + Left Arrow: Jump 1 second back
        if (videoElement) {
          videoElement.currentTime = Math.max(trimStart, currentTime - 1);
        }
      } else {
        // Left Arrow: Previous frame
        jumpToPreviousFrame();
      }
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (e.shiftKey) {
        // Shift + Right Arrow: Jump 1 second forward
        if (videoElement) {
          videoElement.currentTime = Math.min(trimEnd, currentTime + 1);
        }
      } else {
        // Right Arrow: Next frame
        jumpToNextFrame();
      }
    } else if (e.key === '=' || e.key === '+') {
      // Zoom in horizontally (Ctrl/Cmd + = or +)
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        horizontalZoom = Math.min(4, horizontalZoom + 0.25);
      }
    } else if (e.key === '-' || e.key === '_') {
      // Zoom out horizontally (Ctrl/Cmd + -)
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        horizontalZoom = Math.max(0.25, horizontalZoom - 0.25);
      }
    } else if (e.key === '0') {
      // Reset horizontal zoom (Ctrl/Cmd + 0)
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        horizontalZoom = 1;
      }
    }
  }
