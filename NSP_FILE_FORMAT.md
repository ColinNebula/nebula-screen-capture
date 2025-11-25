# Nebula Project File Format (.nsp)

## Overview

The `.nsp` (Nebula Screen capture Project) file format is Nebula's proprietary project file format for saving and loading video editing projects. It stores all project data including clips, tracks, effects, transitions, and settings in a structured JSON format.

## File Extension

- **Extension**: `.nsp`
- **MIME Type**: `application/json`
- **Format**: JSON (human-readable text)

## File Structure

```json
{
  "version": "3.0",
  "type": "nebula-project",
  "name": "Project Name",
  "timestamp": "2025-11-01T12:00:00.000Z",
  "videoName": "My Video",
  "trimStart": 0,
  "trimEnd": 10.5,
  "duration": 10.5,
  
  "filters": {
    "brightness": 100,
    "contrast": 100,
    "saturation": 100,
    "blur": 0,
    "hue": 0
  },
  
  "effects": {
    "vignette": 0,
    "grain": 0,
    "sharpen": 0
  },
  
  "transitions": {
    "fadeIn": 0,
    "fadeOut": 0,
    "type": "none"
  },
  
  "watermark": {
    "enabled": false,
    "text": "",
    "position": "bottom-right",
    "opacity": 0.7
  },
  
  "volume": 1.0,
  "playbackSpeed": 1.0,
  "audioNormalize": false,
  "audioEnhance": false,
  
  "clips": [
    {
      "id": "clip-1",
      "name": "Recording 1",
      "duration": 10.5,
      "type": "video",
      "thumbnail": "data:image/png;base64,...",
      "fileName": "recording.webm",
      "fileType": "video/webm",
      "fileData": "data:video/webm;base64,..."
    }
  ],
  
  "tracks": [
    {
      "id": "track-1",
      "name": "Video Track 1",
      "type": "video",
      "locked": false,
      "visible": true,
      "clips": [
        {
          "id": "track-clip-1",
          "name": "Recording 1",
          "startTime": 0,
          "duration": 10.5,
          "trimStart": 0,
          "trimEnd": 10.5,
          "color": "#667eea",
          "type": "video",
          "fadeIn": 0,
          "fadeOut": 0,
          "fadeInType": "black",
          "fadeOutType": "black",
          "thumbnail": "data:image/png;base64,...",
          "fileName": "recording.webm",
          "fileType": "video/webm",
          "fileData": "data:video/webm;base64,..."
        }
      ]
    }
  ],
  
  "sequencerSettings": {
    "horizontalZoom": 10,
    "timelineZoom": 1,
    "magneticSnapping": true,
    "rippleEdit": false,
    "showFrameNumbers": false,
    "snapToFrames": false
  }
}
```

## Key Features

### 1. **Version Control**
- `version`: Format version (currently "3.0")
- `type`: Always "nebula-project" for validation
- Ensures compatibility between different Nebula versions

### 2. **Project Metadata**
- `name`: Project name
- `timestamp`: Creation/modification time (ISO 8601)
- `videoName`: Output video name

### 3. **Media Files**
- Files are embedded as Base64-encoded data URLs
- Supports video, audio, and image files
- Preserves original file names and MIME types
- Includes thumbnail previews

### 4. **Timeline Data**
- **Clips**: Media bin items
- **Tracks**: Timeline tracks with clip arrangements
- Full timing information (start, duration, trim points)
- Visual metadata (colors, thumbnails)

### 5. **Effects & Filters**
- Color correction (brightness, contrast, saturation)
- Visual effects (vignette, grain, sharpen)
- Audio settings (volume, normalization, enhancement)
- Transitions (fade in/out with types)

### 6. **Sequencer Settings**
- Zoom levels
- Snapping preferences
- Display options
- Edit modes (ripple, magnetic)

## Saving Projects

### Using the UI

1. **Quick Save** (Browser Storage):
   - Click "Save ▼" button
   - Select "Quick Save"
   - Saves to browser's IndexedDB
   - Fast but local to browser

2. **Save Project** (.nsp File):
   - Click "Save ▼" button
   - Select "Save Project"
   - Choose location and filename
   - Creates portable .nsp file

### File Naming

- Auto-generated format: `ProjectName_timestamp.nsp`
- Example: `My_Video_1730462400000.nsp`
- Special characters removed for compatibility

## Opening Projects

### Using the UI

1. **Open Button**:
   - Click green "Open" button in toolbar
   - Select .nsp file from dialog
   - Project loads with all settings

2. **From Save Menu**:
   - Click "Save ▼" button
   - Select "Open Project"
   - Choose browser storage or file

### Loading Process

1. File is read and parsed as JSON
2. Project metadata validated
3. Base64 media files decoded to Blobs
4. Timeline and tracks reconstructed
5. All settings applied
6. Ready for editing

## Platform Support

### Browser Mode
- Uses standard file input/download
- No native file dialogs
- Works in any modern browser

### Tauri Desktop App
- Native file dialogs (Open/Save)
- Direct file system access
- Better performance for large projects
- File associations (double-click .nsp to open)

## Best Practices

### File Size
- Projects can be large due to embedded media
- Typical sizes: 10-500 MB depending on media
- Consider file size when sharing projects

### Backup & Sharing
- .nsp files are fully portable
- Include all media (no broken links)
- Share via cloud storage, email, etc.
- Keep backups of important projects

### Compatibility
- Forward compatible (newer versions read older files)
- Version field ensures safe loading
- Invalid files show error messages

### Organization
- Use descriptive project names
- Store in dedicated projects folder
- Include dates in filenames
- Tag or categorize by content type

## Technical Details

### Encoding
- UTF-8 text encoding
- Pretty-printed JSON (2-space indent)
- Minification not required

### Media Encoding
- Base64 encoding for binary data
- Data URL format: `data:[mimetype];base64,[data]`
- Preserves original codec and quality
- No re-encoding or quality loss

### Validation
- Required fields: `version`, `type`, `name`
- Type must be "nebula-project"
- Media files validated on load
- Graceful error handling

## Future Enhancements

Planned improvements for the .nsp format:

- **Compression**: Optional GZIP compression for smaller files
- **External Media**: Reference external files instead of embedding
- **Collaboration**: Multi-user editing metadata
- **Asset Library**: Reusable effects and presets
- **Version History**: Track project changes over time
- **Cloud Sync**: Auto-save to cloud storage
- **Format Conversion**: Import/export to other formats (Premiere, Final Cut)

## Support

For issues with .nsp files:
- Ensure file is not corrupted
- Check version compatibility
- Verify JSON structure
- Report bugs with sample files

---

**File Format Version**: 3.0  
**Last Updated**: November 2025  
**Nebula Screen Capture** - Professional Screen Recording & Video Editing
