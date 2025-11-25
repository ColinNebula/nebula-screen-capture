# 🚀 Motion Graphics Quick Start Guide

## 30-Second Setup

### 🌟 Keyframe Animation
1. Select clip → **Keyframes** tab
2. Choose property (Position/Scale/Rotation/Opacity)
3. Click **Add Keyframe** at start time
4. Move playhead → change value → **Add Keyframe**
5. Play to see smooth animation!

### 🎨 LUT Color Grading
1. **Filters** tab → Check "Enable LUT"
2. Select preset (Cinematic, Teal & Orange, etc.)
3. Adjust intensity slider (50-100%)
4. Done!

### ✂️ Masks
1. Select clip → **Masks** tab
2. Choose mask type
3. Click **Add Mask**
4. Adjust feather for soft edges
5. Check "Invert" to reverse

### 🎛️ Advanced Audio
1. **Audio** tab → Scroll down
2. Enable **3-Band Equalizer**
3. Enable **Compressor** (use Ratio: 4:1, Threshold: -20dB)
4. Tweak to taste

---

## 🎬 Common Workflows

### Title Animation
```
1. Add text overlay
2. Keyframes tab → Position
3. Start: Bottom (y=600)
4. End: Center (y=300)
5. Easing: Ease Out
```

### Cinematic Look
```
1. Filters → Enable LUT
2. Select "🎬 Cinematic"
3. Intensity: 70%
4. Add slight vignette (Effects tab)
```

### Privacy Blur
```
1. Add clip with sensitive info
2. Masks tab → Rectangle
3. Position over area to hide
4. Effects → Blur: 8px
```

### Voice Enhancement
```
1. Audio tab
2. EQ: Boost High (+3dB) for clarity
3. Compressor: Ratio 3:1, Threshold -18dB
4. Makeup Gain: +6dB
```

---

## ⚡ Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Add Keyframe | `K` (when property selected) |
| Delete Keyframe | `Delete` (when selected) |
| Jump to Next Keyframe | `Shift + →` |
| Jump to Previous Keyframe | `Shift + ←` |
| Toggle Mask | `M` |
| Toggle Audio FX | `A` |

---

## 💡 Pro Tips

### Keyframes
- **Less is more**: Don't keyframe every frame
- **Easing matters**: Ease In-Out looks most natural
- **Combine properties**: Position + Scale = zoom effect

### LUTs
- **Intensity sweet spot**: 60-80% for most looks
- **Bleach Bypass**: Great for desaturated, gritty looks
- **Vintage**: Perfect for retro vibes

### Masks
- **Feather generously**: 10-30px for natural edges
- **Multiple masks**: Combine for complex shapes
- **Invert trick**: Hide unwanted areas instead

### Audio
- **EQ before compress**: Clean up frequencies first
- **Attack fast, release slow**: 5ms / 200ms for voice
- **Makeup gain**: Match pre/post compression volume

---

## 🎯 Preset Recipes

### **Hollywood Blockbuster**
```
LUT: Teal & Orange (75%)
Vignette: 30%
Saturation: +10%
Clarity: +15%
```

### **Music Video**
```
LUT: Bleach Bypass (60%)
Contrast: +20%
Sharpen: 40%
Motion Blur: 10%
```

### **Documentary**
```
LUT: None
Temperature: +5
Exposure: +10
Saturation: -10% (realistic)
```

### **Podcast Audio**
```
EQ: Low -2dB, Mid 0dB, High +4dB
Compressor: 4:1, -18dB threshold
Gate: -45dB (remove background)
Makeup Gain: +8dB
```

### **Animated Lower Third**
```
Text Overlay positioned bottom
Keyframe 0s: opacity=0, x=-200
Keyframe 0.5s: opacity=1, x=50
Keyframe 5s: (hold)
Keyframe 5.5s: opacity=0, x=300
Easing: Ease In-Out
```

---

## 🐛 Troubleshooting

### Keyframes not animating?
- Check easing type (Linear = constant speed)
- Ensure keyframes are on same property
- Verify time range includes both keyframes

### LUT not visible?
- Check "Enable LUT" is checked
- Increase intensity above 50%
- Ensure LUT file loaded correctly (.cube format)

### Mask not showing?
- Check mask is enabled (checkbox)
- Try inverting mask
- Increase feather if too harsh
- Ensure points are within frame

### Audio effects muted?
- Check track not muted
- Verify effect is enabled
- Audio processing only applies during export preview

---

## 📚 Learn More

- **Full Documentation**: `ADVANCED_MOTION_GRAPHICS_FEATURES.md`
- **Video Editor Features**: `VIDEO_EDITOR_FEATURES.md`
- **Professional Enhancements**: `VIDEO_EDITOR_PROFESSIONAL_ENHANCEMENTS.md`

---

**Happy creating! 🎬✨**
