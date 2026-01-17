# Pose Detection Debugging Guide

This guide helps you troubleshoot common issues with real-time pose detection and canvas overlay.

## Common Issues & Solutions

### 1. ❌ No Landmarks Produced

**Symptoms:**
- Pose skeleton not showing on screen
- No measurements updating
- Console shows no pose detection

**Possible Causes & Fixes:**

#### A) Pose Model Not Loaded
```javascript
// ✅ Check console for model loading
console.log('PoseLandmarker loaded:', poseLandmarker);

// ✅ Ensure FilesetResolver completes
const vision = await FilesetResolver.forVisionTasks(
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
);
```

**Solution:** Wait for model to load before starting camera
```typescript
useEffect(() => {
  if (poseLandmarker) {
    startCamera(); // Only start after model loads
  }
}, [poseLandmarker]);
```

#### B) Model Not Called Per Frame
```javascript
// ❌ BAD: Not calling detectForVideo
const result = poseLandmarker.detect(video);

// ✅ GOOD: Call on every frame
const predictWebcam = () => {
  const result = poseLandmarker.detectForVideo(video, performance.now());
  requestAnimationFrame(predictWebcam);
};
```

#### C) Camera Permissions Blocked
```javascript
// ✅ Handle permission errors
try {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "user" }
  });
} catch (err) {
  if (err.name === "NotAllowedError") {
    console.error("Camera permission denied");
  }
}
```

#### D) Video Frame Not Passed Correctly
```javascript
// ❌ BAD: Video not ready
if (video.videoWidth === 0) {
  return; // Skip this frame
}

// ✅ GOOD: Wait for video metadata
video.addEventListener("loadedmetadata", () => {
  console.log(`Video ready: ${video.videoWidth}x${video.videoHeight}`);
  startPoseDetection();
});
```

---

### 2. ❌ Canvas Not Overlaying Video

**Symptoms:**
- Canvas appears in wrong location
- Canvas hidden behind video
- Can't see pose skeleton

**Fixes:**

#### A) Missing `position: absolute`
```jsx
// ✅ Both video and canvas need position: absolute
<div className="relative"> {/* Parent must be relative */}
  <video className="absolute inset-0" style={{ zIndex: 1 }} />
  <canvas className="absolute inset-0" style={{ zIndex: 2 }} />
</div>
```

#### B) Wrong z-index
```jsx
// ❌ BAD: Canvas behind video
<video style={{ zIndex: 10 }} />
<canvas style={{ zIndex: 1 }} />

// ✅ GOOD: Canvas in front
<video style={{ zIndex: 1 }} />
<canvas style={{ zIndex: 2 }} />
```

#### C) Canvas Has `pointer-events`
```jsx
// ✅ Canvas should not intercept clicks
<canvas className="pointer-events-none" />
```

---

### 3. ❌ Canvas Size Mismatch (VERY COMMON!)

**Symptoms:**
- Pose points in wrong positions
- Skeleton appears compressed/stretched
- Points don't align with body

**The Problem:**
Canvas has TWO sizes:
1. **CSS size** (display size) - set via className or style
2. **Pixel size** (internal buffer) - set via width/height attributes

**Common Mistake:**
```jsx
// ❌ BAD: Only CSS size set
<canvas className="w-full h-full" />
// Canvas displays full size but internal buffer is 300x150 (default)
```

**Solution:**
```javascript
// ✅ GOOD: Set BOTH CSS and pixel dimensions
const canvas = canvasRef.current;
const video = videoRef.current;

// 1. CSS size (for display)
canvas.style.width = "100%";
canvas.style.height = "100%";

// 2. Pixel size (for drawing) - CRITICAL!
canvas.width = video.videoWidth;   // e.g., 1280
canvas.height = video.videoHeight; // e.g., 720
```

**In React:**
```typescript
if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  console.log(`Canvas resized to: ${canvas.width}x${canvas.height}`);
}
```

---

### 4. ❌ Wrong Coordinate Space

**Symptoms:**
- All points appear in top-left corner
- Skeleton is tiny
- Nothing visible

**The Problem:**
MediaPipe returns **normalized coordinates** (0.0 to 1.0), but you must draw in **pixel coordinates**.

```javascript
// ❌ BAD: Drawing with normalized coords
const x = landmark.x; // e.g., 0.5
const y = landmark.y; // e.g., 0.3
ctx.arc(x, y, 5, 0, 2*Math.PI); // Draws near origin!

// ✅ GOOD: Convert to pixel coords
const x = landmark.x * canvas.width;  // e.g., 0.5 * 1280 = 640
const y = landmark.y * canvas.height; // e.g., 0.3 * 720 = 216
ctx.arc(x, y, 5, 0, 2*Math.PI); // Draws in correct position!
```

**Full Example:**
```typescript
POSE_CONNECTIONS.forEach(([startIdx, endIdx]) => {
  const start = landmarks[startIdx];
  const end = landmarks[endIdx];
  
  // Convert normalized to pixels
  const x1 = start.x * canvas.width;
  const y1 = start.y * canvas.height;
  const x2 = end.x * canvas.width;
  const y2 = end.y * canvas.height;
  
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
});
```

---

### 5. ❌ Mirroring Mismatch

**Symptoms:**
- Front camera: pose points appear mirrored/flipped
- Left hand tracked as right hand
- Skeleton appears backwards

**The Problem:**
Front camera video (`facingMode: 'user'`) is typically mirrored for a "mirror effect", but MediaPipe landmarks are NOT mirrored.

**Solution: Mirror the Canvas Drawing**
```javascript
// ✅ Mirror canvas for front camera
if (facingMode === "user") {
  ctx.save();
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1); // Flip horizontally
  
  // Draw skeleton...
  
  ctx.restore();
}
```

**Alternative: Mirror the Video (CSS)**
```jsx
<video 
  style={{ 
    transform: facingMode === "user" ? "scaleX(-1)" : "none" 
  }} 
/>
```

---

### 6. ❌ Drawing Before Video Has Dimensions

**Symptoms:**
- `canvas.width` and `canvas.height` are 0
- Console warning: "Canvas has zero dimensions"
- Pose detection starts but nothing appears

**The Problem:**
`video.videoWidth` is `0` until the `loadedmetadata` event fires.

**Solution:**
```javascript
// ✅ Wait for metadata before drawing
video.addEventListener("loadedmetadata", () => {
  console.log(`Video dimensions: ${video.videoWidth}x${video.videoHeight}`);
  startPoseDetection();
});

// ✅ Guard in prediction loop
const predictWebcam = () => {
  if (!video.videoWidth || video.videoWidth === 0) {
    requestAnimationFrame(predictWebcam);
    return; // Skip this frame
  }
  
  // Now safe to set canvas size and draw
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  // ...
};
```

---

## Debugging Checklist

Use this checklist to systematically debug pose detection issues:

### ✅ Model Loading
- [ ] `FilesetResolver` completed successfully
- [ ] `PoseLandmarker.createFromOptions` resolved
- [ ] Model URL is accessible (check Network tab)
- [ ] `runningMode` is set to `"VIDEO"`

### ✅ Camera Setup
- [ ] `getUserMedia` succeeded
- [ ] Video element has `srcObject` set
- [ ] Video is playing (`video.paused === false`)
- [ ] Video has dimensions (`video.videoWidth > 0`)
- [ ] `loadedmetadata` event fired

### ✅ Canvas Overlay
- [ ] Parent container has `position: relative`
- [ ] Canvas has `position: absolute`
- [ ] Canvas has higher `z-index` than video
- [ ] Canvas has `pointer-events: none`
- [ ] Canvas is same size as video container

### ✅ Canvas Sizing
- [ ] `canvas.width === video.videoWidth` (pixel size)
- [ ] `canvas.height === video.videoHeight` (pixel size)
- [ ] CSS size covers video area
- [ ] Canvas resizes when video dimensions change

### ✅ Pose Detection Loop
- [ ] `detectForVideo` called every frame
- [ ] `requestAnimationFrame` creates continuous loop
- [ ] Timestamp passed to `detectForVideo`
- [ ] Result contains landmarks array

### ✅ Drawing
- [ ] Normalized coords multiplied by canvas dimensions
- [ ] Mirroring applied for front camera
- [ ] Visibility check filters low-confidence landmarks
- [ ] `ctx.clearRect()` called before drawing

---

## Console Debugging Commands

Add these to your component for debugging:

```typescript
// Log video state
console.log("Video state:", {
  width: videoRef.current?.videoWidth,
  height: videoRef.current?.videoHeight,
  paused: videoRef.current?.paused,
  readyState: videoRef.current?.readyState,
  currentTime: videoRef.current?.currentTime,
});

// Log canvas state
console.log("Canvas state:", {
  width: canvasRef.current?.width,
  height: canvasRef.current?.height,
  cssWidth: canvasRef.current?.style.width,
  cssHeight: canvasRef.current?.style.height,
});

// Log pose results
console.log("Pose result:", {
  landmarkCount: result.landmarks?.[0]?.length,
  firstLandmark: result.landmarks?.[0]?.[0],
  avgVisibility:
    result.landmarks?.[0]?.reduce((sum, lm) => sum + (lm.visibility ?? 0), 0) /
    33,
});

// Log drawing coordinates
const testLandmark = landmarks[0]; // Nose
console.log("Drawing nose at:", {
  normalized: { x: testLandmark.x, y: testLandmark.y },
  pixels: {
    x: testLandmark.x * canvas.width,
    y: testLandmark.y * canvas.height,
  },
});
```

---

## Performance Optimization

Once everything works, optimize:

### Throttle API Calls
```typescript
const THROTTLE_MS = 100; // 10 req/sec
const lastSentTime = useRef(0);

if (Date.now() - lastSentTime.current > THROTTLE_MS) {
  sendToBackend(landmarks);
  lastSentTime.current = Date.now();
}
```

### Smooth Landmarks
```typescript
const ALPHA = 0.7;
smoothed[i].x = ALPHA * new_x + (1 - ALPHA) * old_x;
```

### Conditional Canvas Resize
```typescript
// Only resize when dimensions change
if (canvas.width !== video.videoWidth) {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
}
```

---

## Browser DevTools Tips

### Check Canvas Drawing
1. Open DevTools → Elements
2. Find `<canvas>` element
3. Right-click → "Capture node screenshot"
4. If blank, drawing isn't happening

### Check Video Stream
1. Open DevTools → Console
2. Type: `document.querySelector('video').srcObject`
3. Should show `MediaStream` object

### Check MediaPipe Model
1. Open DevTools → Network
2. Filter by `.wasm` or `.task`
3. Ensure model files loaded (not 404)

### Check Frame Rate
```typescript
let frameCount = 0;
let lastTime = Date.now();

const predictWebcam = () => {
  frameCount++;
  if (Date.now() - lastTime > 1000) {
    console.log(`FPS: ${frameCount}`);
    frameCount = 0;
    lastTime = Date.now();
  }
  // ... pose detection
};
```

---

## Quick Test Snippet

Paste this in your component to verify basics:

```typescript
useEffect(() => {
  const interval = setInterval(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    console.log("Health check:", {
      video: video ? "exists" : "null",
      videoWidth: video?.videoWidth,
      canvas: canvas ? "exists" : "null",
      canvasWidth: canvas?.width,
      poseLandmarker: poseLandmarker ? "loaded" : "null",
    });
  }, 2000);
  
  return () => clearInterval(interval);
}, [poseLandmarker]);
```

Good luck debugging! 🐛
