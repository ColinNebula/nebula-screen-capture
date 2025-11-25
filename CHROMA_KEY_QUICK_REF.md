# 🟢 Chroma Key Quick Reference Card

## 30-Second Setup

```
1. Effects Tab → Check "🟢 Chroma Key"
2. Click color picker → Select green screen
3. Similarity: 45%
4. Smoothness: 12%
5. Spill Suppression: 15%
6. Done! ✨
```

---

## 🎯 Settings at a Glance

| Control | Sweet Spot | Purpose |
|---------|-----------|---------|
| **Similarity** | 40-50% | How much color to key out |
| **Smoothness** | 10-20% | Edge softness |
| **Spill Suppression** | 10-30% | Remove green reflection |
| **Edge Refinement** | 50-70% | Cleaner edges |
| **Light Wrap** | 5-15% | Realistic blending |
| **Despill** | 50-60% | Remove color cast |
| **Core Matte** | 80-100% | Subject opacity |

---

## 🔧 Quick Fixes

### Holes in Subject?
- ⬇️ Lower Similarity to 35-40%
- ⬆️ Increase Core Matte to 95%

### Green Edges/Halo?
- ⬆️ Spill Suppression to 25-30%
- ⬆️ Despill to 65-70%

### Rough/Jagged Edges?
- ⬆️ Edge Refinement to 70-80%
- ⬆️ Smoothness to 18-22%

### Looks "Pasted On"?
- ⬆️ Light Wrap to 12-18%
- Add slight vignette (Effects tab)

### Background Not Removed?
- ⬆️ Increase Similarity to 55-65%
- Verify color picker matches screen

---

## 📋 Preset Recipes

### **Perfect Studio**
```
Similarity: 45%
Smoothness: 12%
Spill: 15%
Edge Refinement: 50%
Despill: 50%
Light Wrap: 10%
Core Matte: 90%
```

### **Wrinkled Screen**
```
Similarity: 60%
Smoothness: 22%
Spill: 25%
Edge Refinement: 70%
Despill: 60%
Light Wrap: 5%
Core Matte: 85%
```

### **Fine Hair/Details**
```
Similarity: 42%
Smoothness: 8%
Spill: 30%
Edge Refinement: 75%
Despill: 70%
Light Wrap: 5%
Core Matte: 95%
```

### **Webcam/Low Quality**
```
Similarity: 58%
Smoothness: 25%
Spill: 20%
Edge Refinement: 60%
Despill: 50%
Light Wrap: 0%
Core Matte: 80%
```

### **Blue Screen**
```
Color: #0000ff
Similarity: 40%
Smoothness: 10%
Spill: 20%
Edge Refinement: 50%
Despill: 55%
Light Wrap: 10%
Core Matte: 90%
```

---

## 🎬 Workflow Order

```
1. ENABLE → Check Chroma Key box
   ↓
2. COLOR → Pick screen color
   ↓
3. BASIC → Similarity + Smoothness
   ↓
4. SPILL → Remove green reflection
   ↓
5. REFINE → Edge Refinement
   ↓
6. CORRECT → Despill color cast
   ↓
7. BLEND → Light Wrap for realism
   ↓
8. DONE! 🎉
```

---

## 💡 Pro Tips

✅ **DO**:
- Even lighting on screen
- 3-6 feet from backdrop
- Use eyedropper tool
- Light subject separately
- Start conservative, then increase

❌ **DON'T**:
- Wear key color clothing
- Have wrinkled backdrop
- Overlap subject with screen
- Max out all sliders
- Skip spill suppression

---

## 🎯 Common Mistakes

| Mistake | Fix |
|---------|-----|
| Similarity too high | Subject becomes transparent |
| Similarity too low | Background not removed |
| No spill suppression | Green edges on subject |
| Too much light wrap | Glowing edges |
| Uneven lighting | Use higher Similarity + Edge Refinement |

---

## 🚀 Advanced Tips

**Multi-Pass Keying**:
```
1st pass: Conservative key (Similarity: 35%)
2nd pass: Mask + aggressive key (Similarity: 60%)
```

**Garbage Matte**:
```
Masks Tab → Add rectangle
→ Exclude areas that don't need keying
→ Better performance + cleaner key
```

**Color Match**:
```
After keying:
Filters → Adjust Temperature/Tint
→ Match subject to new background
```

---

## 📊 Slider Values

```
0% ═══════════════════════════ 100%
    Low                      High

Similarity:
├─ 20-30%: Very selective (clean screen only)
├─ 40-50%: Standard (most scenarios) ⭐
└─ 60-70%: Aggressive (uneven/wrinkled)

Smoothness:
├─ 0-10%: Sharp edges (detailed work)
├─ 10-20%: Natural blend (standard) ⭐
└─ 20-40%: Soft edges (artistic)

Edge Refinement:
├─ 30-50%: Minimal cleanup
├─ 50-70%: Standard refinement ⭐
└─ 70-90%: Maximum quality (fine details)

Light Wrap:
├─ 0-5%: Subtle (dark backgrounds)
├─ 5-15%: Natural (standard) ⭐
└─ 15-30%: Strong (bright backgrounds)
```

---

## 🎓 Learn More

📖 **Full Guide**: `CHROMA_KEY_GUIDE.md`
📖 **All Features**: `ADVANCED_MOTION_GRAPHICS_FEATURES.md`

---

**Quick Access**: Effects Tab → Professional Effects → 🟢 Chroma Key (Green Screen)

**Perfect results in under 2 minutes! 🎬✨**
