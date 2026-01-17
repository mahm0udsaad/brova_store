# Real-Time Pose Measurement Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER'S BROWSER                          │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                    /measure Page                          │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │ │
│  │  │Instruction  │→ │RealTimeCamera│→ │Measurement  │      │ │
│  │  │Screen       │  │              │  │Results      │      │ │
│  │  └─────────────┘  └──────┬───────┘  └─────────────┘      │ │
│  └────────────────────────────┼──────────────────────────────┘ │
│                               │                                 │
│  ┌────────────────────────────▼──────────────────────────────┐ │
│  │              MediaPipe Pose Detection                     │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │ │
│  │  │ Camera   │→ │ Video    │→ │ Pose     │→ │ Canvas   │ │ │
│  │  │ Stream   │  │ Element  │  │ Model    │  │ Overlay  │ │ │
│  │  └──────────┘  └──────────┘  └────┬─────┘  └──────────┘ │ │
│  └──────────────────────────────────────┼────────────────────┘ │
│                                         │                       │
│                                         │ Landmarks (33 points) │
│                                         │                       │
│  ┌──────────────────────────────────────▼────────────────────┐ │
│  │              Client-Side Processing                       │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │ │
│  │  │ Exponential  │→ │ Coordinate   │→ │ Canvas       │   │ │
│  │  │ Smoothing    │  │ Transform    │  │ Drawing      │   │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │ │
│  └──────────────────────────────────────┬────────────────────┘ │
│                                         │                       │
│                                         │ Throttled (10/sec)    │
└─────────────────────────────────────────┼───────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js API Route                            │
│                  /api/measure/realtime                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  • Validate landmarks (33 points)                        │  │
│  │  • Add user height & gender                              │  │
│  │  • Forward to Flask backend                              │  │
│  │  • Handle errors & offline state                         │  │
│  └──────────────────────┬───────────────────────────────────┘  │
└─────────────────────────┼───────────────────────────────────────┘
                          │
                          │ HTTP POST
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                    Flask Backend API                            │
│                  (http://localhost:8001)                        │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │ /api/validate    │  │ /api/measurements│  │ /api/health  │ │
│  │                  │  │                  │  │              │ │
│  │ Check pose       │  │ Calculate body   │  │ Status check │ │
│  │ quality          │  │ measurements     │  │              │ │
│  └──────────────────┘  └──────────────────┘  └──────────────┘ │
│                                                                 │
│  Returns:                                                       │
│  • Validation feedback                                          │
│  • Measurements (chest, waist, hip, etc.)                       │
│  • Confidence scores                                            │
│  • Accuracy tips                                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### 1. Camera → Pose Detection (30-60 FPS)

```
Camera Stream
    ↓
Video Element (1280x720)
    ↓
MediaPipe PoseLandmarker.detectForVideo()
    ↓
Raw Landmarks (33 points, normalized 0..1)
    ↓
Exponential Smoothing (alpha=0.7)
    ↓
Smoothed Landmarks
```

### 2. Landmarks → Canvas Drawing (30-60 FPS)

```
Smoothed Landmarks
    ↓
Convert to Pixel Coords (x * width, y * height)
    ↓
Apply Mirroring (if front camera)
    ↓
Draw Keypoints (circles)
    ↓
Draw Connections (lines)
    ↓
Canvas Overlay
```

### 3. Landmarks → API (10 FPS, throttled)

```
Smoothed Landmarks
    ↓
Throttle Check (100ms interval)
    ↓
Add Metadata (height, gender, timestamp)
    ↓
POST /api/measure/realtime
    ↓
Next.js API Route
    ↓
POST Flask Backend
    ↓
Response (measurements, confidence, tips)
    ↓
Update UI State
```

---

## Component Hierarchy

```
MeasurePage (page.tsx)
│
├── InstructionScreen
│   ├── Tips List
│   ├── Visual Examples
│   └── Start Button
│
├── RealTimePoseCamera
│   ├── Video Element
│   │   └── Camera Stream
│   │
│   ├── Canvas Element
│   │   ├── Pose Skeleton
│   │   └── Keypoints
│   │
│   ├── Header
│   │   ├── Back Button
│   │   ├── Title Badge
│   │   └── Camera Toggle
│   │
│   ├── Feedback Overlay
│   │   ├── Loading State
│   │   ├── Error Messages
│   │   └── Pose Quality Feedback
│   │
│   ├── Settings Panel (collapsible)
│   │   ├── Height Input
│   │   └── Gender Selector
│   │
│   └── Bottom Panel
│       ├── Status Indicators
│       ├── Measurement Grid (3x2)
│       ├── Accuracy Tips
│       └── Done Button
│
└── MeasurementResults
    ├── Success Header
    ├── Confidence Badge
    ├── Measurement Cards (2x3)
    ├── Info Box
    └── Action Buttons
```

---

## State Management

### Component State (RealTimePoseCamera)

```typescript
// Camera
const [cameraState, setCameraState] = useState<"loading" | "ready" | "error" | "denied">();
const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

// Pose Detection
const [poseLandmarker, setPoseLandmarker] = useState<PoseLandmarker | null>(null);
const smoothedLandmarks = useRef<NormalizedLandmark[] | null>(null);

// User Inputs
const [userHeight, setUserHeight] = useState<number>(175);
const [gender, setGender] = useState<"male" | "female">("male");
const [showSettings, setShowSettings] = useState(false);

// Measurements & Feedback
const [measurements, setMeasurements] = useState<Measurements | null>(null);
const [isValidPose, setIsValidPose] = useState(false);
const [feedbackMessage, setFeedbackMessage] = useState<string>("");
const [confidence, setConfidence] = useState<number>(0);
const [accuracyLevel, setAccuracyLevel] = useState<string>("");
const [accuracyTips, setAccuracyTips] = useState<string[]>([]);
const [poseInfo, setPoseInfo] = useState<any>(null);
const [isApiOnline, setIsApiOnline] = useState(true);

// Refs
const videoRef = useRef<HTMLVideoElement>(null);
const canvasRef = useRef<HTMLCanvasElement>(null);
const lastSentTime = useRef<number>(0);
const requestRef = useRef<number>(0);
const isProcessing = useRef(false);
```

---

## Coordinate Systems

### MediaPipe Normalized Coordinates (0..1)

```
(0,0) ────────────────────────── (1,0)
  │                                │
  │     Nose: (0.5, 0.1)          │
  │                                │
  │  Left Shoulder  Right Shoulder│
  │    (0.4, 0.3)    (0.6, 0.3)   │
  │                                │
  │     Left Hip    Right Hip     │
  │    (0.4, 0.6)    (0.6, 0.6)   │
  │                                │
(0,1) ────────────────────────── (1,1)
```

### Canvas Pixel Coordinates

```
(0,0) ──────────────────────── (1280,0)
  │                                │
  │     Nose: (640, 72)           │
  │                                │
  │  Left Shoulder  Right Shoulder│
  │   (512, 216)    (768, 216)    │
  │                                │
  │     Left Hip    Right Hip     │
  │   (512, 432)    (768, 432)    │
  │                                │
(0,720) ────────────────────── (1280,720)
```

**Conversion:**
```typescript
pixelX = normalizedX * canvas.width;
pixelY = normalizedY * canvas.height;
```

---

## MediaPipe Landmark Indices

```
Face:
  0: Nose
  1-10: Face contour

Torso:
  11: Left shoulder
  12: Right shoulder
  23: Left hip
  24: Right hip

Left Arm:
  13: Left elbow
  15: Left wrist
  17, 19, 21: Left hand

Right Arm:
  14: Right elbow
  16: Right wrist
  18, 20, 22: Right hand

Left Leg:
  25: Left knee
  27: Left ankle
  29, 31: Left foot

Right Leg:
  26: Right knee
  28: Right ankle
  30, 32: Right foot
```

---

## API Request/Response Format

### Request to /api/measure/realtime

```json
{
  "landmarks": [
    { "x": 0.5, "y": 0.1, "z": -0.05, "visibility": 0.99 },
    { "x": 0.4, "y": 0.3, "z": -0.02, "visibility": 0.98 },
    // ... 31 more landmarks
  ],
  "frame_width": 1280,
  "frame_height": 720,
  "user_height_cm": 175,
  "gender": "male",
  "action": "measure" // or "validate"
}
```

### Response from Flask Backend

```json
{
  "measurements": {
    "height": 175,
    "chest": 98,
    "waist": 82,
    "hip": 95,
    "shoulder_width": 45,
    "arm_length": 60,
    "inseam": 78
  },
  "overall_confidence": 0.92,
  "accuracy_level": "High",
  "pose_info": {
    "distance_rating": "optimal",
    "visibility_score": 0.95,
    "pose_quality": "excellent"
  },
  "accuracy_tips": [
    "Great pose! Keep it up.",
    "Try to keep arms relaxed."
  ]
}
```

---

## Performance Optimization Strategy

### 1. Throttling Layer

```
Pose Detection: 60 FPS ─┐
                        ├─→ Throttle (100ms) ─→ API: 10 FPS
Canvas Drawing: 60 FPS ─┘
```

### 2. Smoothing Layer

```
Raw Landmarks (jittery)
    ↓
Exponential Smoothing (alpha=0.7)
    ↓
Smooth Landmarks (stable)
```

### 3. Conditional Updates

```
if (canvas.width !== video.videoWidth) {
  // Only resize when needed
  canvas.width = video.videoWidth;
}

if (Date.now() - lastSentTime > THROTTLE_MS) {
  // Only send when throttle allows
  sendToBackend();
}

if (!isProcessing) {
  // Only send if previous request completed
  sendToBackend();
}
```

---

## Error Handling Flow

```
Try Camera Access
    ↓
  Success? ──No──→ Permission Denied ─→ Show Error Message
    │
   Yes
    ↓
Load Pose Model
    ↓
  Success? ──No──→ Model Load Failed ─→ Show Error Message
    │
   Yes
    ↓
Start Pose Detection
    ↓
Landmarks Detected? ──No──→ No Person ─→ Show Feedback
    │
   Yes
    ↓
Send to API
    ↓
  Success? ──No──→ API Offline ─→ Show Warning (continue locally)
    │
   Yes
    ↓
Update Measurements ─→ Display Results
```

---

## Browser Compatibility

| Feature | Chrome | Safari | Firefox | Edge |
|---------|--------|--------|---------|------|
| getUserMedia | ✅ | ✅ | ✅ | ✅ |
| WebGL (GPU) | ✅ | ✅ | ✅ | ✅ |
| Canvas API | ✅ | ✅ | ✅ | ✅ |
| MediaPipe | ✅ | ✅ | ⚠️ | ✅ |
| Mobile Support | ✅ | ✅ | ⚠️ | ✅ |

**Legend:**
- ✅ Fully supported
- ⚠️ Partial support or slower performance

---

## Security Considerations

1. **Camera Access:** Requires user permission, HTTPS or localhost
2. **Data Privacy:** Landmarks processed client-side, not images
3. **API Security:** Backend should validate requests
4. **CORS:** Next.js API route acts as proxy
5. **Rate Limiting:** Client-side throttling prevents abuse

---

## Deployment Checklist

- [ ] Set `NEXT_PUBLIC_API_BASE_URL` for production
- [ ] Enable HTTPS for camera access
- [ ] Configure CORS on Flask backend
- [ ] Test on target mobile devices
- [ ] Monitor API rate limits
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Optimize bundle size
- [ ] Enable CDN for MediaPipe assets
- [ ] Add analytics for usage tracking
- [ ] Document API versioning

---

**Architecture Version:** 1.0  
**Last Updated:** January 16, 2026  
**Maintainer:** Brova Development Team
