# 🎬 Praxifi Loading Animation - Video Generation Prompt

## For AI Video Tools: Runway ML, Pika Labs, Luma AI, or ChatGPT Video

---

## Master Video Prompt

```
Create a 2-second professional loading animation for a financial analytics platform called "Praxifi".

LOGO STRUCTURE (Reference image provided):
- Three vertical bar charts (increasing height: short, medium, tall) on the left
- A swooping growth arrow rising from the bars
- The letter "P" integrated into the design
- All elements are white/light colored on the original logo

BACKGROUND:
- Pure black (#000000) background
- No gradients on background, keep it solid black

COLOR SCHEME:
- Primary: Emerald green (#10B981) and mint green (#6EE7B7)
- Accent: Bright white (#FFFFFF)
- Glow effects: Soft green luminescence

ANIMATION SEQUENCE (2 seconds, 60fps):

[0.0s - 0.3s] WIREFRAME FOUNDATION
- All logo elements fade in as thin gray wireframe outlines
- Elements appear centered on black background
- Slight scale animation from 95% to 100%

[0.3s - 0.9s] DATA BARS FILLING
- Left bar (shortest) fills bottom-to-top with emerald to mint green gradient (0.3s-0.5s)
- Middle bar fills bottom-to-top with same gradient (0.5s-0.7s)
- Right bar (tallest) fills bottom-to-top with same gradient (0.7s-0.9s)
- Add liquid/fluid filling effect with subtle shimmer
- Small glowing particles (3-5 per bar) rise upward as each bar fills
- Particles are bright white with green glow trails

[0.9s - 1.3s] ARROW ENERGY CHARGE
- Growth arrow charges with flowing energy
- 8-12 bright green particles flow smoothly along the arrow path from tail to tip
- Arrow progressively brightens to bright white (#FFFFFF)
- Particles leave glowing green trails that fade
- Energy pulse effect travels along arrow curve

[1.3s - 1.6s] "P" MATERIALIZATION
- Multiple thin data streams (8-10 glowing green lines) converge toward center
- Streams come from different angles, moving smoothly
- Streams merge and solidify into the letter "P"
- "P" becomes bright white with subtle green glow halo
- Digital/holographic materialization effect

[1.6s - 2.0s] COMPLETION PULSE
- Complete logo gently pulses: scale from 100% to 103% back to 100%
- Soft radial green glow emanates outward from logo center
- Text "PRAXIFI" fades in below logo in white
- Optional: Smaller text "Financial Intelligence" appears in muted green below
- Everything settles into final static state

STYLE REQUIREMENTS:
- Sleek, professional, modern fintech aesthetic
- Smooth 60fps motion (no jittery movements)
- Cinematic quality with subtle motion blur on fast movements
- Particles should have natural physics (slight ease, not linear)
- Glow effects should be soft, not harsh or overpowering
- All green tones should be in the emerald/mint family (not neon lime)

TECHNICAL SPECS:
- Duration: Exactly 2.0 seconds
- Resolution: 1920x1080 (Full HD) or 1080x1080 (Square)
- Frame rate: 60fps
- Format: MP4 (H.264 codec)
- Background: Solid black, no transparency needed
- Audio: None (silent animation)

MOOD:
- Sophisticated and trustworthy (like Stripe or Plaid)
- Data coming to life
- Intelligent and precise
- Fast and responsive, not sluggish
- Professional, not playful

AVOID:
- Harsh neon colors (keep greens natural/emerald)
- Overly busy or chaotic movement
- Cheap/cheesy effects
- Slow or laggy feeling
- Rainbow or multi-color schemes

REFERENCE MOOD:
- Think: Premium fintech dashboard loading
- Similar to: Modern data visualization coming alive
- Quality level: Apple product launch video
```

---

## Alternative Shorter Prompt (For tools with character limits)

```
Create a 2-second loading animation: Financial data logo assembles on black background. 
Three bar charts fill bottom-to-top with emerald green gradient (0.3-0.9s), particles 
rise within bars. Growth arrow charges with flowing green energy particles (0.9-1.3s). 
Letter "P" materializes from converging data streams (1.3-1.6s). Logo pulses gently, 
"PRAXIFI" text appears below (1.6-2.0s). Colors: emerald green (#10B981), mint green 
(#6EE7B7), white (#FFFFFF) on black background. Style: Professional fintech, smooth 
60fps, soft glows. Reference logo image provided.
```

---

## Tool-Specific Instructions

### For Runway ML (Gen-3 Alpha):
1. Upload the Praxifi logo as reference image
2. Use the Master Video Prompt above
3. Set duration to 4 seconds (will generate 2s usable content)
4. Motion settings: Medium motion, smooth transitions
5. Optional: Use "Extend Video" to perfect the ending

### For Pika Labs:
1. Upload logo as first frame reference
2. Use Master Video Prompt
3. Add: "60fps, cinematic motion, professional quality"
4. Camera motion: Static (no camera movement)
5. Motion strength: 2-3 (moderate)

### For Luma AI (Dream Machine):
1. Start with logo image
2. Paste the Master Video Prompt
3. Duration: 2 seconds
4. Style: "Professional, cinematic"
5. Add negative prompt: "blur, distortion, low quality, choppy"

### For ChatGPT/DALL-E Video:
1. Provide the Master Video Prompt
2. Upload reference logo
3. Specify: "Generate as smooth 60fps video"
4. Request: "Keep background solid black throughout"

### For Adobe Firefly Video:
1. Upload logo as reference
2. Use Master Video Prompt
3. Style reference: "Professional financial technology"
4. Motion type: "Controlled animation"
5. Duration: 2 seconds

---

## Post-Generation Checklist

After generating, verify:
- [ ] Exactly 2 seconds duration
- [ ] Black background (not gray or transparent)
- [ ] Green colors are emerald/mint (not neon)
- [ ] All 5 animation phases visible
- [ ] Smooth 60fps motion (no stuttering)
- [ ] Logo elements are clear and sharp
- [ ] Particles flow naturally
- [ ] Text is readable (if included)
- [ ] Final frame holds steady (good loop point)
- [ ] File size reasonable (< 5MB for web)

---

## If Video Generation Doesn't Work Well

Common issues and fixes:

**Issue: Colors look wrong**
- Re-generate with: "Emerald green (#10B981), NOT neon or lime green"

**Issue: Animation too slow/fast**
- Adjust with video editing: Speed up/slow down to exactly 2.0s

**Issue: Background not pure black**
- Post-process: Use video editor to replace background with #000000

**Issue: Logo elements unclear**
- Provide higher quality reference image
- Add: "Sharp, crisp edges, no blur on logo elements"

**Issue: Particles too chaotic**
- Add to prompt: "Controlled particle flow, 5-8 particles maximum"

**Issue: Glow effects too strong**
- Add: "Subtle soft glow, professional not gaming aesthetic"

---

## Fallback: Use React Component

If video generation doesn't achieve desired quality, the React/Framer Motion 
approach will give you:
- Perfect timing control
- Crisp vector graphics
- Small file size
- Easy to modify colors/timing
- Better performance on all devices

The React version can be generated from the LOADING_ANIMATION_PROMPT.md file 
in this repository.

---

## Video File Specifications

**Output Format:**
- File: `praxifi-loading.mp4`
- Codec: H.264
- Resolution: 1920x1080 (or 1080x1080 for square)
- Frame rate: 60fps
- Bitrate: 5-10 Mbps (high quality)
- Duration: 2.000 seconds exactly
- Audio: None

**For Web Optimization:**
- Create WebM version for modern browsers
- Create fallback GIF (lower quality, wider support)
- Recommended: Use HTML5 video with multiple sources

**Implementation:**
```html
<video autoplay muted loop playsinline>
  <source src="/praxifi-loading.webm" type="video/webm">
  <source src="/praxifi-loading.mp4" type="video/mp4">
  <!-- Fallback image -->
  <img src="/praxifi-logo.png" alt="Loading">
</video>
```

---

## Additional Enhancement Ideas

If the basic video works well, consider asking for:

1. **Progress bar integration**
   - Add thin green progress bar below logo
   - Syncs with actual loading (0-100%)

2. **Percentage counter**
   - White text showing "0%" → "100%"
   - Positioned below logo, counts up smoothly

3. **Extended idle loop**
   - After 2s, gentle breathing animation
   - Subtle particle occasionally floats by
   - Shows app is still loading, not frozen

4. **Sound effects** (optional)
   - Soft "whoosh" for each element
   - Gentle "ping" at completion
   - Keep very subtle, under 1 second duration

---

**Created for:** Praxifi CFO Platform  
**Purpose:** AI Video Generation  
**Tools:** Runway, Pika, Luma, ChatGPT Video  
**Date:** January 2026  
**Version:** 1.0
