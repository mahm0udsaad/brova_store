# Quick Start Guide - Real-Time Pose Measurement

## 🚀 Get Started in 3 Minutes

### Prerequisites
- Node.js 18+ installed
- pnpm installed (`npm install -g pnpm`)
- Flask backend running on port 8001

---

## Step 1: Install Dependencies

```bash
cd y
pnpm install
```

This will install:
- `@mediapipe/tasks-vision` - Pose detection library
- All other Next.js dependencies

---

## Step 2: Configure Backend URL (Optional)

If your Flask backend is NOT on `http://localhost:8001`, create `.env.local`:

```bash
echo "NEXT_PUBLIC_API_BASE_URL=http://your-backend-url:port" > .env.local
```

**Default:** `http://localhost:8001` (no config needed)

---

## Step 3: Start Development Server

```bash
pnpm dev
```

Server starts at: `http://localhost:3000`

---

## Step 4: Test the Feature

1. Open browser: `http://localhost:3000/measure`
2. Click "Start Camera" (بدء الكاميرا)
3. Allow camera permission
4. Stand 2-3 meters back from camera
5. Wait for pose skeleton to appear
6. Enter your height in settings (tap gear icon)
7. Watch measurements update in real-time
8. Click "Done" (تم) when satisfied

---

## 🎥 What You Should See

### Instruction Screen
- Tips for taking measurements
- "Start Camera" button

### Camera Screen
- Live video feed
- White skeleton overlay on your body
- 33 keypoints (circles) connected by lines
- Bottom panel with:
  - Settings (height, gender)
  - Live measurements (6 cards)
  - Confidence indicator
  - Status (Active/Searching)
  - Done button

### Results Screen
- All measurements displayed
- Confidence percentage
- Re-measure option

---

## 🔍 Verify It's Working

### Check 1: Model Loaded
Open browser console (F12), you should see:
```
Canvas resized to: 1280x720
Video ready: 1280x720
```

### Check 2: Pose Detected
You should see:
- White circles on your body joints
- White lines connecting joints
- Measurements updating every second

### Check 3: API Connected
Bottom panel should show:
- Green "Active" indicator
- Confidence percentage
- Measurement values (not "--")

---

## ❌ Troubleshooting

### Camera Not Working
```
Error: Camera permission denied
```
**Fix:** Allow camera in browser settings, refresh page

### No Skeleton Appearing
```
Console: Video ready: 0x0
```
**Fix:** Wait for video to load, check console for errors

### API Offline Warning
```
Red banner: "الـ API غير متصل"
```
**Fix:** Start Flask backend on port 8001

### Skeleton Misaligned
**Fix:** Ensure you're standing 2-3 meters back, full body visible

---

## 📱 Mobile Testing

### iOS (Safari)
1. Connect iPhone to Mac
2. Enable Web Inspector on iPhone
3. Open Safari on Mac → Develop → iPhone → localhost
4. Grant camera permission
5. Use back camera for best results

### Android (Chrome)
1. Enable USB debugging
2. Connect phone to computer
3. Chrome → `chrome://inspect`
4. Open `localhost:3000/measure`
5. Grant camera permission

---

## 🎯 Best Practices

### For Accurate Measurements
1. **Lighting:** Bright, even lighting
2. **Distance:** 2-3 meters from camera
3. **Pose:** Stand straight, arms at sides
4. **Clothing:** Fitted clothing (not baggy)
5. **Background:** Plain, uncluttered
6. **Height:** Enter accurate height in settings

### For Performance
1. **Close other tabs** to free GPU
2. **Use back camera** (less processing)
3. **Good WiFi** for API calls
4. **Modern device** (2020+)

---

## 📊 Expected Performance

| Metric | Value |
|--------|-------|
| Pose Detection FPS | 30-60 |
| API Calls per Second | 10 |
| API Response Time | 50-200ms |
| Model Load Time | 2-5 seconds |
| Camera Start Time | 1-3 seconds |

---

## 🧪 Test Different Scenarios

### Scenario 1: Front Camera
1. Toggle camera (top-right button)
2. Verify skeleton mirrors correctly
3. Check measurements still accurate

### Scenario 2: Different Heights
1. Open settings
2. Change height (150cm → 200cm)
3. Verify measurements adjust

### Scenario 3: Different Genders
1. Open settings
2. Toggle male/female
3. Verify measurements adjust

### Scenario 4: API Offline
1. Stop Flask backend
2. Verify "API offline" warning appears
3. Verify skeleton still works
4. Restart backend
5. Verify warning disappears

---

## 📚 Next Steps

Once basic functionality works:

1. **Read Full Docs:** `MEASUREMENT_API_README.md`
2. **Debug Issues:** `POSE_DEBUGGING_GUIDE.md`
3. **Review Implementation:** `IMPLEMENTATION_SUMMARY.md`
4. **Customize UI:** Edit `RealTimePoseCamera.tsx`
5. **Add Features:** See "Future Enhancements" in summary

---

## 🆘 Still Having Issues?

### Check These Files
1. Console logs (F12)
2. Network tab (API calls)
3. Elements tab (canvas/video)

### Common Console Errors

**"Failed to load model"**
```
Fix: Check internet connection, CDN accessible
```

**"getUserMedia is not defined"**
```
Fix: Use HTTPS or localhost, not HTTP
```

**"Canvas has zero dimensions"**
```
Fix: Wait for video.loadedmetadata event
```

**"CORS error"**
```
Fix: Configure Flask backend CORS headers
```

---

## ✅ Success Checklist

- [ ] Dependencies installed
- [ ] Dev server running
- [ ] Camera permission granted
- [ ] Skeleton visible on body
- [ ] Measurements updating
- [ ] Settings panel works
- [ ] Done button saves results
- [ ] No console errors

---

## 🎉 You're Ready!

If all checks pass, the real-time pose measurement system is working correctly!

**Next:** Integrate with your product pages, size recommendations, and virtual try-on features.

---

**Need Help?** Check the debugging guide or review console logs.
