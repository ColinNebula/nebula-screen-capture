# Nebula Screen Capture

A professional, feature-rich screen recording application built with React. Capture your screen with high-quality video and audio, customize recording settings, and manage your recordings with an intuitive interface.

![Nebula Screen Capture](https://img.shields.io/badge/version-1.0.0-blue) ![React](https://img.shields.io/badge/React-18+-green) ![License](https://img.shields.io/badge/license-MIT-purple)

## ✨ Features

### 🎬 Core Recording
- **High-Quality Recording**: Support for 720p, 1080p, 1440p, and 4K video quality
- **Flexible Frame Rates**: 15, 24, 30, and 60 FPS options
- **Multiple Capture Modes**: Full screen, specific window, browser tab, or custom area
- **Pause/Resume**: Seamlessly pause and resume recordings
- **Real-time Timer**: Track recording duration with precision

### 🎵 Advanced Audio
- **Multiple Audio Sources**: System audio, microphone, or both
- **Audio Enhancement**: Noise suppression, echo cancellation, auto gain control
- **Quality Settings**: From 32 kbps to 192 kbps audio quality
- **Device Selection**: Choose specific microphones from available devices
- **Volume Control**: Adjust microphone volume levels

### 🎯 Smart Area Selection
- **Custom Recording Areas**: Select specific regions of your screen
- **Visual Feedback**: Interactive selection with real-time dimensions
- **Precise Control**: Pixel-perfect area selection

### 📁 File Management
- **Organized Library**: View all recordings in a searchable, sortable list
- **Video Previews**: Thumbnail previews with play overlays
- **Bulk Operations**: Download or delete multiple recordings
- **Smart Search**: Find recordings by filename
- **Multiple Sort Options**: Sort by date, size, duration, or name
- **Storage Info**: View total storage usage and file statistics

### ⌨️ Keyboard Shortcuts
- **Ctrl/Cmd + R**: Start/Stop recording
- **Space**: Pause/Resume recording
- **Escape**: Cancel recording or area selection
- **Ctrl/Cmd + D**: Download current recording

### 🛡️ Enhanced User Experience
- **Error Handling**: Graceful error recovery with user feedback
- **Browser Compatibility**: Automatic feature detection and optimization
- **Performance Monitoring**: Smart quality adjustment based on device capabilities
- **Real-time Notifications**: Status updates and helpful tips
- **Responsive Design**: Works perfectly on desktop and tablet devices
- **Help System**: Comprehensive help modal with shortcuts and tips

## 🚀 Getting Started

### Prerequisites
- Node.js 14+ and npm/yarn
- Modern web browser (Chrome 72+, Firefox 66+, Edge 79+)
- HTTPS connection (required for screen capture APIs)

### Installation

1. **Start the development server**
```bash
npm start
```

2. **Open your browser**
Navigate to `http://localhost:3001` 

### Building for Production

```bash
npm run build
```

## 🎮 How to Use

### Basic Recording
1. Click "Start Recording" or press `Ctrl+R`
2. Grant screen capture permissions when prompted
3. Select the screen/window you want to record
4. Use pause/resume controls as needed
5. Click "Stop" or press `Ctrl+R` again to finish

### Custom Area Recording
1. In Recording Options, select "Custom Area" from Capture Area
2. Click "Select Recording Area"
3. Click and drag to select your desired area
4. Click "Use This Area" to start recording

### Audio Configuration
1. Expand the Audio Settings panel
2. Choose your audio source (system, microphone, or both)
3. Select specific microphone if needed
4. Adjust quality and enhancement settings

### File Management
1. View all recordings in the sidebar
2. Use search to find specific recordings
3. Sort by date, size, duration, or name
4. Click thumbnails to preview recordings
5. Use download/delete buttons for individual files

## 🛠️ Technical Details

### Architecture
- **React 18+**: Modern React with hooks and functional components
- **MediaRecorder API**: Native browser recording capabilities
- **Screen Capture API**: Direct access to screen content
- **Web Audio API**: Advanced audio processing and mixing
- **CSS Grid/Flexbox**: Responsive, modern layouts
- **Error Boundaries**: Graceful error handling

### Browser Support
| Browser | Version | Features |
|---------|---------|----------|
| Chrome | 72+ | ✅ Full support |
| Firefox | 66+ | ✅ Full support |
| Edge | 79+ | ✅ Full support |
| Safari | 13+ | ⚠️ Limited support |

---

**Made with ❤️ for professional screen recording**

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
