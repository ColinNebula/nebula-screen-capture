# 🎨 App Graphics Creation Guide

## 📋 Required Graphics for Google Play

### 1. App Icon (Required)
- **Size**: 512 x 512 pixels
- **Format**: 32-bit PNG with alpha channel
- **File size**: Max 1024 KB
- **No transparency**: Must have opaque background
- **Guidelines**: 
  - Simple, recognizable design
  - Avoid text (hard to read at small sizes)
  - Use vibrant colors
  - Match your brand

### 2. Feature Graphic (Required)
- **Size**: 1024 x 500 pixels
- **Format**: PNG or JPEG
- **File size**: Max 1024 KB
- **Used for**: Store listing banner, promotional material
- **Guidelines**:
  - Include app name/logo
  - Showcase key features
  - Eye-catching visuals
  - No pricing info or time-sensitive content

### 3. Phone Screenshots (Required)
- **Minimum**: 2 screenshots
- **Maximum**: 8 screenshots
- **Aspect Ratios**: 
  - 16:9 (1920 x 1080)
  - 9:16 (1080 x 1920) - Recommended
- **Format**: PNG or JPEG
- **File size**: Max 8 MB each
- **Guidelines**:
  - Show actual app interface
  - Highlight key features
  - Add text overlays for context
  - First 2 screenshots are most important

### 4. Tablet Screenshots (Optional but Recommended)
- **7-inch**: 1024 x 600 or 600 x 1024
- **10-inch**: 1920 x 1200 or 1200 x 1920
- **Same file size/format rules as phone**

### 5. TV Banner (Optional - if supporting Android TV)
- **Size**: 1280 x 720 pixels
- **Format**: PNG or JPEG

### 6. Promo Video (Optional but Highly Recommended)
- **YouTube URL**: 30 seconds to 2 minutes
- **Shows**: App in action, key features
- **Increases**: Conversion rate by 20-35%

---

## 🎨 Design Tools & Resources

### Free Design Tools

**1. Canva (Easiest)**
- URL: https://www.canva.com
- Templates available for app icons and graphics
- Drag-and-drop interface
- Free tier available

**2. Figma (Professional)**
- URL: https://www.figma.com
- Industry-standard design tool
- Free for individuals
- Collaborative features

**3. GIMP (Advanced)**
- URL: https://www.gimp.org
- Free Photoshop alternative
- Full image editing capabilities
- Steeper learning curve

**4. Photopea (Browser-based)**
- URL: https://www.photopea.com
- Photoshop-like interface
- Works in browser
- No installation needed

### Icon Generation Tools

**1. App Icon Generator**
- URL: https://appicon.co
- Generates all required sizes
- Upload one 1024x1024 image
- Downloads zip with all sizes

**2. Icon Kitchen**
- URL: https://icon.kitchen
- Material Design icons
- Adaptive icon support
- Preview on different devices

**3. Android Asset Studio**
- URL: https://romannurik.github.io/AndroidAssetStudio/
- Official Android resource
- Multiple icon types
- Professional results

### Screenshot Tools

**1. Screely (Quick & Beautiful)**
- URL: https://www.screely.com
- Add browser/phone frames
- Gradient backgrounds
- Instant download

**2. Screenshot Creator**
- URL: https://mockuphone.com
- Device mockups
- Multiple phone models
- Professional presentation

**3. Previewed**
- URL: https://previewed.app
- Marketing screenshots
- Text overlays
- Templates available

---

## 📱 Creating Your Nebula Screen Capture Graphics

### Step 1: App Icon (512x512)

**Concept Ideas:**
1. **Camera/Screen Icon**: Combine camera shutter with screen/monitor
2. **Recording Symbol**: Circle with dot (like recording indicator)
3. **Nebula Theme**: Space/cosmic theme with capture elements
4. **Letter "N"**: Stylized "N" with screen capture visual

**Design Process:**

**Option A: Using Canva**
```
1. Go to Canva.com
2. Create custom size: 512 x 512 px
3. Search templates: "app icon"
4. Customize with your colors:
   - Primary: #6366f1 (indigo)
   - Secondary: #8b5cf6 (purple)
   - Accent: #ec4899 (pink)
5. Add screen/camera elements
6. Download as PNG (highest quality)
7. Ensure no transparency in background
```

**Option B: Using Figma**
```
1. Create new file in Figma
2. Create frame: 512 x 512
3. Design your icon:
   - Background: Gradient (indigo to purple)
   - Icon: White screen with corner brackets
   - Add subtle shadow/depth
4. Export as PNG 2x (1024x1024)
5. Resize to 512x512 if needed
```

**Quick Template:**
```
Background: Rounded square with gradient
Foreground: Screen outline + camera shutter icon
Colors: Your brand colors from app
Style: Modern, minimal, recognizable
```

### Step 2: Feature Graphic (1024x500)

**Content to Include:**
- App name: "Nebula Screen Capture"
- Tagline: "Capture, Record, Share - Effortlessly"
- Key visual: Screenshot of app in action
- Background: Brand gradient or cosmic theme

**Design Layout:**
```
┌─────────────────────────────────────────┐
│                                         │
│  NEBULA SCREEN CAPTURE                  │
│  Capture, Record, Share                 │
│                                         │
│  [App Screenshot Preview]               │
│                                         │
└─────────────────────────────────────────┘
```

**Using Canva:**
```
1. Custom size: 1024 x 500 px
2. Add background gradient
3. Add app name (large, bold font)
4. Add tagline (smaller, subtitle)
5. Insert screenshot of your app
6. Add subtle effects (shadows, glows)
7. Download as PNG
```

### Step 3: Phone Screenshots (1080x1920)

**Recommended Screenshots Order:**

**Screenshot 1: Hero/Main Screen**
- Show the main capture interface
- Highlight the "Capture" button
- Add text overlay: "Capture Your Screen in One Click"

**Screenshot 2: Recording Interface**
- Show active recording
- Timer visible
- Text: "Record Screen with Audio"

**Screenshot 3: Screenshot Gallery**
- Display grid of captured screenshots
- Text: "Organize & Manage Your Captures"

**Screenshot 4: Editing Features**
- Show annotation/editing tools
- Text: "Edit & Annotate Screenshots"

**Screenshot 5: Sharing Options**
- Display share menu
- Text: "Share Anywhere, Instantly"

**Screenshot 6: Settings/Features**
- Show premium features
- Text: "Unlock Premium Features"

**Screenshot 7: Analytics (if available)**
- Usage stats or history
- Text: "Track Your Capture History"

**Screenshot 8: Testimonials/Ratings**
- User reviews or 5-star rating
- Text: "Loved by Thousands of Users"

**How to Capture Screenshots:**

**Method 1: From Your App**
```bash
1. Run your app: npm run android:run
2. Navigate to each screen
3. Take screenshots with device
4. Transfer to computer
5. Resize to 1080x1920 if needed
```

**Method 2: Using Android Emulator**
```
1. Open Android Studio
2. Run app on emulator
3. Use emulator's screenshot button
4. Or: Ctrl + S to save screenshot
5. Screenshots save to desktop
```

**Method 3: Using Browser (for PWA)**
```
1. Open app in browser
2. F12 > Device Toolbar
3. Set to mobile size (360x800)
4. Capture each screen state
5. Add device frame using mockup tool
```

**Adding Text Overlays:**

Use Canva or Figma:
```
1. Upload your screenshot
2. Add text box at top or bottom
3. Font: Bold, sans-serif (Montserrat, Roboto)
4. Size: 48-72px
5. Color: White with subtle shadow
6. Keep text concise (5-8 words max)
7. Export as PNG
```

---

## 🎬 Creating a Promo Video (Optional)

### Quick Video Ideas

**30-Second Structure:**
```
0-5s:   Show app icon + name
5-15s:  Capture screenshot demo
15-25s: Record screen demo
25-30s: Share & organize features
30s:    End with app name + "Download Now"
```

**Tools for Video Creation:**

**1. Screen Recording**
- Windows: Xbox Game Bar (Win + G)
- OBS Studio (free, powerful)
- Camtasia (paid, professional)

**2. Video Editing**
- DaVinci Resolve (free, professional)
- CapCut (free, easy to use)
- OpenShot (free, open-source)

**3. Upload to YouTube**
- Create unlisted video
- Use URL in Play Store listing
- Keep it under 2 minutes

---

## ✅ Graphics Checklist

### Before Creating Graphics:

- [ ] Review your app's color scheme
- [ ] Screenshot all key app screens
- [ ] Choose design tool (Canva recommended)
- [ ] Gather inspiration from top apps in category

### Required Graphics:

- [ ] App Icon (512x512 PNG, no transparency)
- [ ] Feature Graphic (1024x500 PNG/JPEG)
- [ ] Phone Screenshot 1 (Hero screen)
- [ ] Phone Screenshot 2 (Key feature)
- [ ] Additional screenshots (up to 8 total)

### Optional but Recommended:

- [ ] Tablet screenshots (7" and 10")
- [ ] Promo video (YouTube URL)
- [ ] App icon variations for adaptive icons

### Quality Checks:

- [ ] All images are high resolution
- [ ] No pixelation or blur
- [ ] Text is readable at small sizes
- [ ] Colors match your brand
- [ ] Screenshots show actual app (not mockups)
- [ ] File sizes under limits
- [ ] Correct dimensions for each asset

---

## 🎨 Nebula Screen Capture - Suggested Design System

### Colors (from your app)
```css
Primary:    #6366f1 (Indigo)
Secondary:  #8b5cf6 (Purple)
Accent:     #ec4899 (Pink)
Dark:       #1e293b (Slate)
Light:      #f1f5f9 (Light Gray)
```

### Typography
- Headings: Montserrat Bold or Roboto Bold
- Body: Inter or Roboto Regular
- Sizes: 
  - App name on graphics: 48-72px
  - Taglines: 24-36px
  - Screenshot overlays: 32-48px

### Icon Style
- Modern, minimal
- Rounded corners (8-16px radius)
- Flat design with subtle depth
- 2-3 colors maximum

### Screenshot Style
- Clean, uncluttered UI
- Show one main action per screenshot
- Text overlays at top or bottom
- Consistent device frame (if using mockups)
- Light mode recommended (better visibility)

---

## 📁 Organizing Your Graphics

### Folder Structure
```
graphics/
├── icon/
│   ├── icon-512.png (for Play Store)
│   ├── icon-1024.png (master file)
│   └── adaptive-icon/ (if needed)
├── feature-graphic/
│   └── feature-1024x500.png
├── screenshots/
│   ├── phone/
│   │   ├── 01-hero.png
│   │   ├── 02-record.png
│   │   ├── 03-gallery.png
│   │   └── ...
│   └── tablet/ (optional)
│       ├── 7-inch/
│       └── 10-inch/
└── promo-video/
    └── youtube-url.txt
```

### Naming Convention
```
icon-512.png
feature-graphic-1024x500.png
screenshot-phone-01-hero.png
screenshot-phone-02-record.png
screenshot-tablet-7inch-01.png
```

---

## 🚀 Quick Start Templates

### Download Ready-Made Templates

**Canva Templates for App Store Graphics:**
1. Search: "app store screenshots"
2. Filter: Free templates
3. Customize with your brand
4. Export in correct sizes

**Figma Community:**
1. Browse: figma.com/community
2. Search: "google play store"
3. Duplicate template
4. Customize for your app

---

## 💡 Pro Tips

### Icon Design
✅ Keep it simple - complex icons don't scale well
✅ Test at 48x48px to ensure it's recognizable
✅ Avoid text in icons
✅ Use contrasting colors for visibility
✅ Make it unique and memorable

### Feature Graphic
✅ Test on mobile - many users browse on phones
✅ Keep text large and readable
✅ Use high-contrast colors
✅ Show actual app, not just logo
✅ Update seasonally for freshness

### Screenshots
✅ First 2 screenshots get 80% of views
✅ Show value proposition immediately
✅ Use captions to explain features
✅ Keep UI clean and uncluttered
✅ Show different features in each shot
✅ Avoid text-heavy screens
✅ Use real data, not Lorem Ipsum

### Video
✅ First 5 seconds are critical
✅ Show results, not just features
✅ Add background music (royalty-free)
✅ Use text overlays for sound-off viewers
✅ Keep it under 60 seconds if possible

---

## 🎯 Timeline

**Total Time Estimate: 4-8 hours**

- App Icon: 1-2 hours
- Feature Graphic: 1-2 hours
- Screenshots (8): 2-3 hours
- Text overlays: 1 hour
- Promo Video: 2-4 hours (optional)
- Review & export: 30 minutes

**Recommended Schedule:**
- Day 1: Icon + Feature Graphic
- Day 2: Capture screenshots
- Day 3: Add text overlays, create video
- Day 4: Review, finalize, export all

---

## 📤 Export Settings

### For All Graphics:

**PNG Format:**
- Bit depth: 32-bit (24-bit RGB + 8-bit alpha)
- Compression: Lossless
- Color profile: sRGB

**JPEG Format:**
- Quality: 90-100%
- Color profile: sRGB
- No progressive encoding

**File Naming:**
- Use lowercase
- No spaces (use hyphens)
- Descriptive names
- Include dimensions

---

## 🎉 Ready to Create!

Once you have all your graphics:
1. Organize in the `graphics/` folder
2. Check all file sizes and dimensions
3. Review on mobile device (test visibility)
4. Get feedback from friends/colleagues
5. Proceed to Google Play Console upload

**Next Step**: See `GOOGLE_PLAY_CONSOLE_GUIDE.md` for upload instructions!

---

**Prepared by**: GitHub Copilot  
**Date**: October 8, 2025  
**For**: Nebula Screen Capture - Google Play Launch
