# Real-Time Pose Measurement System

## Overview

A mobile-first Next.js application that uses MediaPipe Pose detection in the browser to capture body landmarks in real-time and streams them to a Flask backend for accurate body measurements.

## Features

- ✅ Real-time pose detection with MediaPipe PoseLandmarker
- ✅ Live pose skeleton overlay on camera feed
- ✅ Exponential smoothing for stable landmark tracking
- ✅ Throttled API calls (10 requests/second)
- ✅ Validation feedback for pose quality
- ✅ Comprehensive measurements display
- ✅ Confidence and accuracy indicators
- ✅ User height and gender inputs
- ✅ Blur glass UI (mobile-first)
- ✅ Full Arabic RTL support
- ✅ Camera toggle (front/back)
- ✅ Graceful error handling

## Architecture

### Frontend (Next.js)
- **Page**: `/app/measure/page.tsx` - Main flow controller
- **Component**: `/components/RealTimePoseCamera.tsx` - Real-time camera and pose detection
- **Component**: `/components/MeasurementResults.tsx` - Results display
- **Component**: `/components/InstructionScreen.tsx` - User onboarding
- **API Route**: `/app/api/measure/realtime/route.ts` - Proxy to Flask backend

### Backend (Flask)
Base URL configured via `NEXT_PUBLIC_API_BASE_URL` environment variable (default: `http://localhost:8001`)

## API Contract

### 1. Health Check
```http
GET {API_BASE_URL}/api/health
```

### 2. Validate Pose Quality
```http
POST {API_BASE_URL}/api/validate
Content-Type: application/json

{
  "landmarks": [
    { "x": 0.5, "y": 0.2, "z": -0.1, "visibility": 0.98 },
    // ... 33 landmarks total
  ],
  "frame_width": 720,
  "frame_height": 1280,
  "user_height_cm": 175,
  "gender": "male",
  "calibration": { "mode": "height" },
  "timestamp": 1730000000.0
}
```

**Response:**
```json
{
  "valid": true,
  "message": "Perfect! Hold still...",
  "confidence": 0.95
}
```

### 3. Get Measurements
```http
POST {API_BASE_URL}/api/measurements
Content-Type: application/json

{
  "landmarks": [...],
  "frame_width": 720,
  "frame_height": 1280,
  "user_height_cm": 175,
  "gender": "male",
  "calibration": { "mode": "height" },
  "timestamp": 1730000000.0
}
```

**Response:**
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
    "visibility_score": 0.95
  },
  "accuracy_tips": [
    "Great pose! Keep it up.",
    "Try to keep arms relaxed."
  ]
}
```

### 4. Anthropometric Ranges
```http
GET {API_BASE_URL}/api/anthropometric-ranges?gender=male&height=170
```

**Response:**
```json
{
  "gender": "male",
  "height": 170,
  "ranges": {
    "chest": { "min": 85, "max": 110 },
    "waist": { "min": 70, "max": 95 }
  }
}
```

## Installation

### Prerequisites
- Node.js 18+ and pnpm
- Flask backend running on port 8001 (or configured port)

### Setup

1. Install dependencies:
```bash
cd y
pnpm install
```

2. Configure environment (optional):
```bash
# Create .env.local file
echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:8001" > .env.local
```

3. Start development server:
```bash
pnpm dev
```

4. Navigate to `/measure` in your browser

## Technical Details

### MediaPipe Configuration
- **Model**: `pose_landmarker_lite.task` (Float16)
- **Running Mode**: VIDEO
- **Confidence Thresholds**: 0.5 for detection, presence, and tracking
- **GPU Acceleration**: Enabled
- **Number of Poses**: 1 (single person detection)

### Landmark Smoothing
Uses exponential smoothing with alpha = 0.7:
```typescript
smoothed = alpha * new_value + (1 - alpha) * old_value
```

### Throttling Strategy
- **Pose Detection**: Runs every animation frame (~30-60 FPS)
- **API Calls**: Throttled to every 100ms (10 requests/second)
- **Concurrent Requests**: Prevented via `isProcessing` flag

### Pose Skeleton Drawing
Draws 33 landmarks connected by standard MediaPipe pose connections:
- **Keypoints**: White circles with glow effect
- **Connections**: White lines (3px width)
- **Visibility Filter**: Only draws landmarks with visibility > 0.5

## UI Components

### Settings Panel
- User height input (100-250 cm)
- Gender selector (male/female)
- Collapsible blur glass design

### Live Measurements Display
Compact 3x2 grid showing:
- Shoulder width (عرض الكتف)
- Chest (الصدر)
- Waist (الخصر)
- Hip (الورك)
- Arm length (طول الذراع)
- Inseam (طول الساق)

### Status Indicators
- **Pose Status**: Active (green pulse) / Searching (yellow)
- **Confidence**: Percentage with icon
- **Accuracy Level**: Text badge
- **API Status**: Offline warning if disconnected

### Accuracy Tips
Shows up to 2 tips in a compact info box with suggestions to improve measurement accuracy.

## Error Handling

### Camera Errors
- Permission denied → Shows Arabic error message with instructions
- Camera unavailable → Graceful error state
- Multiple camera switches → Properly stops old streams

### API Errors
- Connection refused → "API offline" warning
- Invalid response → Error logging, graceful degradation
- Timeout → Skip request, retry on next interval

### Pose Errors
- No person detected → "We can't see you" message
- Low visibility → "Step back to show full body"
- Invalid landmarks → Skip frame, continue detection

## Browser Compatibility

### Tested
- ✅ Chrome on Android
- ✅ Safari on iOS
- ✅ Chrome on Desktop

### Requirements
- WebRTC/getUserMedia support
- WebGL support (for GPU acceleration)
- Modern JavaScript (ES6+)

## Performance

### Optimization Strategies
1. **Canvas Matching**: Only resizes canvas when video dimensions change
2. **Request Animation Frame**: Uses browser's optimal frame rate
3. **Landmark Smoothing**: Reduces jitter without heavy computation
4. **Conditional Rendering**: Only updates UI when data changes
5. **Throttled API**: Prevents overwhelming the backend

### Expected Performance
- **FPS**: 30-60 (depends on device)
- **API Latency**: ~50-200ms (depends on backend)
- **Battery Impact**: Moderate (camera + GPU usage)

## Development Notes

### Adding New Measurements
To add new measurements:

1. Update the `Measurements` interface in `RealTimePoseCamera.tsx`
2. Add the measurement to the grid display
3. Ensure the backend returns the new measurement

### Customizing UI
- **Colors**: Update Tailwind classes in components
- **Layout**: Modify grid columns in bottom panel
- **Language**: Replace Arabic text as needed

### Debugging
Enable console logging for:
- Landmark coordinates
- API request/response timing
- Pose confidence scores
- Frame rate monitoring

```typescript
console.log('Landmarks:', landmarks);
console.log('API latency:', Date.now() - requestTime);
```

## Troubleshooting

### Camera Not Working
1. Check browser permissions
2. Ensure HTTPS or localhost
3. Try different facing modes

### API Calls Failing
1. Verify Flask backend is running
2. Check CORS configuration
3. Validate `NEXT_PUBLIC_API_BASE_URL`

### Poor Accuracy
1. Ensure good lighting
2. Stand 2-3 meters from camera
3. Show full body in frame
4. Verify user height is correct

## Future Enhancements

- [ ] Multi-person detection support
- [ ] Pose history/trend tracking
- [ ] Custom measurement presets
- [ ] Offline mode with cached measurements
- [ ] AR try-on integration
- [ ] Size recommendation AI

## License

Part of the Brova mobile-first fashion platform.
