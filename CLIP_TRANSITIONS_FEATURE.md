# Per-Clip Transitions Feature

## Overview
The video editor now supports adding fade in and fade out transitions to individual video and image clips in the timeline sequencer. This allows for more precise control over transitions compared to global video transitions.

## Features

### Per-Clip Transitions
- **Fade In**: Each clip can have its own fade in effect at the beginning
- **Fade Out**: Each clip can have its own fade out effect at the end
- **Fade Types**: Choose from black, white, or transparent fade effects
- **Visual Indicators**: Timeline clips show colored overlays indicating transition regions
  - Blue gradient on the left = Fade In
  - Red gradient on the right = Fade Out

### How to Use

1. **Select a Clip**: Click on any video or image clip in the timeline sequencer
2. **Open Properties Panel**: The properties panel on the right will show clip-specific controls
3. **Adjust Transitions**: Use the sliders under "🎬 Clip Transitions" section to:
   - Set fade in duration (0-5 seconds or half the clip duration, whichever is smaller)
   - Choose fade in type (from black, white, or transparent)
   - Set fade out duration (0-5 seconds or half the clip duration)
   - Choose fade out type (to black, white, or transparent)
4. **Preview**: The transitions are applied in real-time during playback
5. **Export**: Transitions are included in the final exported video

### Technical Details

#### Clip Properties
Each clip now includes the following transition properties:
```javascript
{
  fadeIn: 0,           // Duration in seconds
  fadeOut: 0,          // Duration in seconds
  fadeInType: 'black', // 'black', 'white', or 'transparent'
  fadeOutType: 'black' // 'black', 'white', or 'transparent'
}
```

#### Visual Indicators
- Fade in regions show a blue-tinted gradient from left edge
- Fade out regions show a red-tinted gradient from right edge
- Indicator width is proportional to transition duration (capped at 50% of clip width)

#### Export Behavior
- Per-clip transitions are combined with global video transitions
- The most restrictive opacity is applied (minimum of global and clip-specific)
- Transitions are rendered during the export process for smooth results

### Compatibility
- Works with both video and image clips
- Persists in localStorage (saved with project)
- Backward compatible with existing clips (defaults to no transitions)

## UI Updates

### Properties Panel
New section added: **🎬 Clip Transitions**
- Only visible when a clip is selected
- Includes sliders and dropdowns for fade in/out control
- Reset button to clear all clip transitions

### Timeline Visual Feedback
- Hover over transition indicators to see duration tooltip
- Color-coded overlays for easy identification
- Smooth gradients indicate transition regions

## Benefits

1. **Precision**: Apply transitions only where needed
2. **Flexibility**: Different transitions for each clip
3. **Visual Feedback**: See transition regions at a glance
4. **Professional Results**: Create smooth scene transitions
5. **Easy to Use**: Intuitive controls in properties panel

## Future Enhancements

Possible future additions:
- More transition types (wipe, slide, dissolve, etc.)
- Transition presets
- Keyframe-based custom transitions
- Between-clip transitions (overlap effects)
