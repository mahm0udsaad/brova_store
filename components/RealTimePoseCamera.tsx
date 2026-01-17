"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import {
  FilesetResolver,
  PoseLandmarker,
  DrawingUtils,
  PoseLandmarkerResult,
  NormalizedLandmark,
} from "@mediapipe/tasks-vision";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  SwitchCamera,
  X,
  AlertCircle,
  Check,
  Settings2,
  Activity,
  TrendingUp,
  Zap,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { triggerHaptic } from "@/lib/haptics";

// --- Types ---

interface RealTimePoseCameraProps {
  onBack: () => void;
  onMeasurementsReceived: (data: any) => void;
}

type CameraState = "loading" | "ready" | "error" | "denied";

interface Measurements {
  height?: number;
  height_cm?: number;
  estimated_height_cm?: number;
  chest?: number;
  chest_cm?: number;
  chest_circumference?: number;
  chest_circumference_cm?: number;
  waist?: number;
  waist_cm?: number;
  waist_circumference?: number;
  waist_circumference_cm?: number;
  hip?: number;
  hip_cm?: number;
  hip_circumference?: number;
  hip_circumference_cm?: number;
  shoulder_width?: number;
  shoulder_width_cm?: number;
  arm_length?: number;
  arm_length_cm?: number;
  inseam?: number;
  inseam_cm?: number;
  [key: string]: number | undefined;
}

interface ValidationResponse {
  valid: boolean;
  message?: string;
  confidence?: number;
}

interface MeasurementResponse {
  measurements?: Measurements;
  overall_confidence?: number;
  accuracy_level?: string;
  confidence_scores?: Record<string, number>;
  metadata?: Record<string, unknown>;
  pose_info?: {
    distance_rating?: string;
    visibility_score?: number;
    [key: string]: any;
  };
  accuracy_tips?: string[];
}

// --- Constants ---

const THROTTLE_MS = 100; // 10 req/sec
const SMOOTHING_ALPHA = 0.7;

// Pose connection lines (MediaPipe standard)
const POSE_CONNECTIONS = [
  // Face
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 7],
  [0, 4],
  [4, 5],
  [5, 6],
  [6, 8],
  [9, 10],
  // Torso
  [11, 12],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
  [11, 23],
  [12, 24],
  [23, 24],
  // Left arm
  [15, 17],
  [17, 19],
  [19, 21],
  [15, 21],
  // Right arm
  [16, 18],
  [18, 20],
  [20, 22],
  [16, 22],
  // Left leg
  [23, 25],
  [25, 27],
  [27, 29],
  [29, 31],
  [27, 31],
  // Right leg
  [24, 26],
  [26, 28],
  [28, 30],
  [30, 32],
  [28, 32],
];

// --- Component ---

export function RealTimePoseCamera({
  onBack,
  onMeasurementsReceived,
}: RealTimePoseCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraState, setCameraState] = useState<CameraState>("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [poseLandmarker, setPoseLandmarker] = useState<PoseLandmarker | null>(
    null
  );

  // User inputs
  const [userHeight, setUserHeight] = useState<number>(175);
  const [gender, setGender] = useState<"male" | "female">("male");
  const [showSettings, setShowSettings] = useState(false);

  // Pose data
  const [measurements, setMeasurements] = useState<Measurements | null>(null);
  const [isValidPose, setIsValidPose] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string>(
    "قف أمام الكاميرا"
  );
  const [confidence, setConfidence] = useState<number>(0);
  const [accuracyLevel, setAccuracyLevel] = useState<string>("");
  const [accuracyTips, setAccuracyTips] = useState<string[]>([]);
  const [poseInfo, setPoseInfo] = useState<any>(null);
  const [isApiOnline, setIsApiOnline] = useState(true);

  // Smoothing buffer
  const smoothedLandmarks = useRef<NormalizedLandmark[] | null>(null);
  const lastSentTime = useRef<number>(0);
  const requestRef = useRef<number>(0);
  const isProcessing = useRef(false);

  const normalizeMeasurements = useCallback(
    (raw: Measurements | null | undefined): Measurements | null => {
      if (!raw) return null;
      const normalized: Measurements = { ...raw };

      // Map backend naming → UI-friendly keys used in realtime cards.
      if (normalized.shoulder_width == null && normalized.shoulder_width_cm != null) {
        normalized.shoulder_width = normalized.shoulder_width_cm;
      }
      if (normalized.chest == null) {
        normalized.chest =
          normalized.chest_cm ??
          normalized.chest_circumference_cm ??
          normalized.chest_circumference;
      }
      if (normalized.waist == null) {
        normalized.waist =
          normalized.waist_cm ??
          normalized.waist_circumference_cm ??
          normalized.waist_circumference;
      }
      if (normalized.hip == null) {
        normalized.hip =
          normalized.hip_cm ??
          normalized.hip_circumference_cm ??
          normalized.hip_circumference;
      }
      if (normalized.arm_length == null && normalized.arm_length_cm != null) {
        normalized.arm_length = normalized.arm_length_cm;
      }
      if (normalized.inseam == null && normalized.inseam_cm != null) {
        normalized.inseam = normalized.inseam_cm;
      }

      return normalized;
    },
    []
  );

  // --- Initialize Pose Landmarker ---

  useEffect(() => {
    async function initPose() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
        );

        const landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        setPoseLandmarker(landmarker);
      } catch (err) {
        console.error("Failed to init pose landmarker:", err);
        setErrorMsg("فشل تحميل نموذج AI. يرجى إعادة التحميل.");
        setCameraState("error");
      }
    }

    initPose();
  }, []);

  // --- Camera Setup ---

  const startCamera = useCallback(async () => {
    try {
      setCameraState("loading");
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((t) => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // CRITICAL: Wait for video metadata (dimensions) before starting
        const handleLoadedMetadata = () => {
          console.log(
            `Video ready: ${videoRef.current?.videoWidth}x${videoRef.current?.videoHeight}`
          );
          setCameraState("ready");
          predictWebcam();
        };

        videoRef.current.addEventListener("loadedmetadata", handleLoadedMetadata);
        
        // Fallback: also listen to loadeddata
        videoRef.current.addEventListener("loadeddata", handleLoadedMetadata, {
          once: true,
        });
      }
    } catch (err: any) {
      console.error("Camera error:", err);
      if (
        err.name === "NotAllowedError" ||
        err.name === "PermissionDeniedError"
      ) {
        setCameraState("denied");
        setErrorMsg("تم رفض إذن الكاميرا. يرجى السماح بالوصول في الإعدادات.");
      } else {
        setCameraState("error");
        setErrorMsg("فشل الوصول إلى الكاميرا.");
      }
    }
  }, [facingMode]);

  useEffect(() => {
    if (poseLandmarker) {
      startCamera();
    }
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((t) => t.stop());
      }
    };
  }, [poseLandmarker, startCamera]);

  // --- Exponential Smoothing ---

  const smoothLandmarks = useCallback(
    (newLandmarks: NormalizedLandmark[]): NormalizedLandmark[] => {
      if (!smoothedLandmarks.current) {
        smoothedLandmarks.current = newLandmarks;
        return newLandmarks;
      }

      const smoothed = newLandmarks.map((newLm, idx) => {
        const oldLm = smoothedLandmarks.current![idx];
        return {
          x: SMOOTHING_ALPHA * newLm.x + (1 - SMOOTHING_ALPHA) * oldLm.x,
          y: SMOOTHING_ALPHA * newLm.y + (1 - SMOOTHING_ALPHA) * oldLm.y,
          z: SMOOTHING_ALPHA * newLm.z + (1 - SMOOTHING_ALPHA) * oldLm.z,
          visibility: newLm.visibility,
        };
      });

      smoothedLandmarks.current = smoothed;
      return smoothed;
    },
    []
  );

  // --- Prediction Loop ---

  const predictWebcam = useCallback(() => {
    if (!poseLandmarker || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    // CRITICAL: Wait for video to have dimensions (after loadedmetadata)
    if (!video.videoWidth || !video.videoHeight || video.videoWidth === 0) {
      requestRef.current = requestAnimationFrame(predictWebcam);
      return;
    }

    // CRITICAL: Set canvas pixel dimensions to match video (not just CSS)
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      console.log(`Canvas resized to: ${canvas.width}x${canvas.height}`);
    }

    // CRITICAL: Only detect if video is playing
    if (video.readyState < 2 || video.paused) {
      requestRef.current = requestAnimationFrame(predictWebcam);
      return;
    }

    let startTimeMs = performance.now();

    try {
      // CRITICAL: Pass video element and timestamp to model
      const result = poseLandmarker.detectForVideo(video, startTimeMs);

      // Clear canvas before drawing
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (result.landmarks && result.landmarks.length > 0) {
        const rawLandmarks = result.landmarks[0];

        // Apply smoothing
        const landmarks = smoothLandmarks(rawLandmarks);

        // Draw skeleton with custom style
        drawPoseSkeleton(ctx, landmarks, canvas);

        // Send data to backend (throttled)
        const now = Date.now();
        if (now - lastSentTime.current > THROTTLE_MS && !isProcessing.current) {
          sendLandmarksToBackend(
            landmarks,
            video.videoWidth,
            video.videoHeight
          );
          lastSentTime.current = now;
        }
      } else {
        setFeedbackMessage("لا نستطيع رؤيتك. ادخل في الإطار.");
        setIsValidPose(false);
      }
    } catch (error) {
      console.error("Pose detection error:", error);
    }

    requestRef.current = requestAnimationFrame(predictWebcam);
  }, [poseLandmarker, smoothLandmarks]);

  // --- Draw Pose Skeleton ---

  const drawPoseSkeleton = (
    ctx: CanvasRenderingContext2D,
    landmarks: NormalizedLandmark[],
    canvas: HTMLCanvasElement
  ) => {
    const width = canvas.width;
    const height = canvas.height;

    // CRITICAL: Check if we have valid canvas dimensions
    if (width === 0 || height === 0) {
      console.warn("Canvas has zero dimensions, skipping draw");
      return;
    }

    // Save context state
    ctx.save();

    // CRITICAL: Handle mirroring for front camera
    // Front camera (facingMode: 'user') is typically mirrored
    if (facingMode === "user") {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    // Draw connections (skeleton lines)
    ctx.strokeStyle = "rgba(0, 255, 255, 0.9)"; // Bright cyan for better visibility
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    POSE_CONNECTIONS.forEach(([startIdx, endIdx]) => {
      const start = landmarks[startIdx];
      const end = landmarks[endIdx];

      if (
        start &&
        end &&
        (start.visibility ?? 0) > 0.3 && // Lower threshold for better detection
        (end.visibility ?? 0) > 0.3
      ) {
        // CRITICAL: Convert normalized coords (0..1) to pixel coords
        const startX = start.x * width;
        const startY = start.y * height;
        const endX = end.x * width;
        const endY = end.y * height;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }
    });

    // Draw keypoints (circles)
    landmarks.forEach((lm, idx) => {
      if ((lm.visibility ?? 0) > 0.3) { // Lower threshold
        // CRITICAL: Convert normalized coords to pixel coords
        const x = lm.x * width;
        const y = lm.y * height;

        // Outer glow (bright yellow)
        ctx.fillStyle = "rgba(255, 255, 0, 0.5)";
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, 2 * Math.PI);
        ctx.fill();

        // Inner circle (bright cyan)
        ctx.fillStyle = "#00FFFF";
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fill();

        // Border (black for contrast)
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.stroke();
      }
    });

    // Restore context state (removes mirroring)
    ctx.restore();
  };

  // --- Send Landmarks to Backend ---

  const sendLandmarksToBackend = async (
    landmarks: NormalizedLandmark[],
    width: number,
    height: number
  ) => {
    isProcessing.current = true;

    // CRITICAL: Validate we have exactly 33 landmarks
    if (landmarks.length !== 33) {
      console.warn(`Invalid landmarks count: ${landmarks.length}, expected 33`);
      isProcessing.current = false;
      return;
    }

    // CRITICAL: Ensure all landmarks have valid values
    const validLandmarks = landmarks.every(
      (lm) =>
        typeof lm.x === "number" &&
        typeof lm.y === "number" &&
        typeof lm.z === "number" &&
        !isNaN(lm.x) &&
        !isNaN(lm.y) &&
        !isNaN(lm.z)
    );

    if (!validLandmarks) {
      console.warn("Invalid landmark data detected, skipping frame");
      isProcessing.current = false;
      return;
    }

    try {
      // First validate the pose
      const validateResponse = await fetch("/api/measure/realtime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          landmarks: landmarks.map((lm) => ({
            x: lm.x,
            y: lm.y,
            z: lm.z,
            visibility: lm.visibility ?? 1.0,
          })),
          frame_width: width,
          frame_height: height,
          user_height_cm: userHeight,
          gender: gender,
          action: "validate",
        }),
      });

      if (validateResponse.ok) {
        const validationData: ValidationResponse = await validateResponse.json();
        setIsValidPose(validationData.valid);
        if (validationData.message) {
          setFeedbackMessage(validationData.message);
        }
        setIsApiOnline(true);
      }

      // Then get measurements (if valid or regardless)
      const measureResponse = await fetch("/api/measure/realtime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          landmarks: landmarks.map((lm) => ({
            x: lm.x,
            y: lm.y,
            z: lm.z,
            visibility: lm.visibility ?? 1.0,
          })),
          frame_width: width,
          frame_height: height,
          user_height_cm: userHeight,
          gender: gender,
          action: "measure",
        }),
      });

      if (measureResponse.ok) {
        const data: MeasurementResponse = await measureResponse.json();

        if (data.measurements) {
          console.log("📊 Raw measurements:", data.measurements);
          const normalized = normalizeMeasurements(data.measurements);
          console.log("✅ Normalized measurements:", normalized);
          if (normalized) {
            setMeasurements(normalized);
          }
        }

        if (data.overall_confidence !== undefined) {
          setConfidence(data.overall_confidence);
        }

        if (data.accuracy_level) {
          setAccuracyLevel(data.accuracy_level);
        }

        if (data.accuracy_tips) {
          setAccuracyTips(data.accuracy_tips);
        }

        if (data.pose_info) {
          setPoseInfo(data.pose_info);
        }

        setIsApiOnline(true);
      } else {
        const errorData = await measureResponse.json().catch(() => ({}));
        console.error("❌ Measurements API error:", {
          status: measureResponse.status,
          error: errorData,
        });
        if (errorData.error === "API_OFFLINE") {
          setIsApiOnline(false);
        }
      }
    } catch (e) {
      console.error("Backend sync error", e);
      setIsApiOnline(false);
    } finally {
      isProcessing.current = false;
    }
  };

  const toggleCamera = () => {
    triggerHaptic("light");
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  const toggleSettings = () => {
    triggerHaptic("light");
    setShowSettings((prev) => !prev);
  };

  const handleDone = () => {
    if (measurements) {
      triggerHaptic("success");
      onMeasurementsReceived({
        ...measurements,
        overall_confidence: confidence,
        accuracy_level: accuracyLevel,
      });
    }
  };

  // --- Render ---

  return (
    <div className="fixed inset-0 bg-black text-white z-50 flex flex-col" dir="rtl">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-3 z-20 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCamera}
          className="text-white hover:bg-white/20 rounded-full w-10 h-10"
        >
          <SwitchCamera className="w-5 h-5" />
        </Button>
        <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
          <span className="text-xs font-medium tracking-wide text-white/90">
            قياس بالذكاء الاصطناعي
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="text-white hover:bg-white/20 rounded-full w-10 h-10"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Main Viewport - CRITICAL: position relative for absolute children */}
      <div className="flex-1 relative overflow-hidden bg-black">
        {/* Video Layer - CRITICAL: z-index lower than canvas */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-contain"
          style={{ zIndex: 1 }}
          playsInline
          muted
          autoPlay
        />

        {/* Canvas Layer (Overlays) - CRITICAL: position absolute, higher z-index, pointer-events-none */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          style={{ zIndex: 2 }}
        />

        {/* Feedback Overlay */}
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
          {cameraState === "loading" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-3 bg-black/70 p-6 rounded-2xl backdrop-blur-md"
            >
              <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              <p className="text-sm font-medium">جاري تشغيل الكاميرا...</p>
            </motion.div>
          )}

          {cameraState === "denied" && (
            <div className="bg-red-500/90 p-6 rounded-2xl max-w-xs text-center mx-4">
              <AlertCircle className="w-10 h-10 mx-auto mb-3" />
              <p className="font-bold mb-2">تم رفض الوصول للكاميرا</p>
              <p className="text-sm opacity-90">{errorMsg}</p>
            </div>
          )}

          {/* API Offline Warning */}
          {!isApiOnline && cameraState === "ready" && (
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="absolute top-20 bg-red-500/90 px-4 py-2 rounded-full backdrop-blur-md"
            >
              <p className="text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                الـ API غير متصل
              </p>
            </motion.div>
          )}

          {/* Real-time Feedback */}
          {cameraState === "ready" && (
            <motion.div
              key={feedbackMessage}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className={`mt-auto mb-48 px-5 py-2.5 rounded-full backdrop-blur-md border text-center ${
                isValidPose
                  ? "bg-green-500/20 border-green-500/50 text-green-100"
                  : "bg-black/50 border-white/20 text-white"
              }`}
            >
              <p className="text-xs font-semibold tracking-wide flex items-center gap-2 justify-center">
                {isValidPose && <Check className="w-3.5 h-3.5" />}
                {feedbackMessage}
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="absolute left-0 right-0 bg-black/80 backdrop-blur-xl border-t border-white/10 p-4 z-30"
            style={{ bottom: "180px" }}
          >
            <div className="space-y-3">
              <div>
                <label className="text-xs text-white/70 mb-1 block">
                  الطول (سم)
                </label>
                <input
                  type="number"
                  value={userHeight}
                  onChange={(e) => setUserHeight(Number(e.target.value))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white"
                  min="100"
                  max="250"
                />
              </div>
              <div>
                <label className="text-xs text-white/70 mb-1 block">
                  الجنس
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setGender("male")}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                      gender === "male"
                        ? "bg-white text-black"
                        : "bg-white/10 text-white"
                    }`}
                  >
                    ذكر
                  </button>
                  <button
                    onClick={() => setGender("female")}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                      gender === "female"
                        ? "bg-white text-black"
                        : "bg-white/10 text-white"
                    }`}
                  >
                    أنثى
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Panel - Compact & Blur Glass */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/30 backdrop-blur-xl border-t border-white/10 p-3 z-30">
        {/* Settings Toggle */}
        <button
          onClick={toggleSettings}
          className="w-full flex items-center justify-between mb-2 bg-white/5 hover:bg-white/10 rounded-lg px-3 py-2 transition"
        >
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-white/70" />
            <span className="text-xs text-white/70">
              الطول: {userHeight} سم | {gender === "male" ? "ذكر" : "أنثى"}
            </span>
          </div>
          {showSettings ? (
            <ChevronDown className="w-4 h-4 text-white/70" />
          ) : (
            <ChevronUp className="w-4 h-4 text-white/70" />
          )}
        </button>

        {/* Status Bar */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                isValidPose ? "bg-green-400 animate-pulse" : "bg-yellow-400"
              }`}
            />
            <span className="text-[10px] font-medium text-white/70">
              {isValidPose ? "نشط" : "بحث..."}
            </span>
          </div>

          {/* Confidence */}
          {confidence > 0 && (
            <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-full">
              <Activity className="w-3 h-3 text-green-400" />
              <span className="text-[10px] font-mono text-white">
                {Math.round(confidence * 100)}%
              </span>
            </div>
          )}

          {/* Accuracy Level */}
          {accuracyLevel && (
            <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-full">
              <TrendingUp className="w-3 h-3 text-blue-400" />
              <span className="text-[10px] text-white">{accuracyLevel}</span>
            </div>
          )}
        </div>

        {/* Measurements Grid - Compact */}
        <div className="grid grid-cols-3 gap-1.5 mb-2">
          {[
            { label: "الكتف", value: measurements?.shoulder_width, unit: "سم" },
            { label: "الصدر", value: measurements?.chest, unit: "سم" },
            { label: "الخصر", value: measurements?.waist, unit: "سم" },
            { label: "الورك", value: measurements?.hip, unit: "سم" },
            { label: "الذراع", value: measurements?.arm_length, unit: "سم" },
            { label: "الساق", value: measurements?.inseam, unit: "سم" },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-white/10 rounded-lg p-2 border border-white/5"
            >
              <p className="text-[9px] text-white/60 mb-0.5">{item.label}</p>
              <p className="text-sm font-mono font-semibold text-white">
                {item.value != null ? `${Math.round(item.value)}` : "--"}
                {item.value != null && (
                  <span className="text-[9px] text-white/50 mr-0.5">
                    {item.unit}
                  </span>
                )}
              </p>
            </div>
          ))}
        </div>

        {/* Accuracy Tips - Compact */}
        {accuracyTips && accuracyTips.length > 0 && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2 mb-2">
            <div className="flex items-start gap-2">
              <Info className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-[9px] text-blue-300 font-medium mb-1">
                  نصائح للدقة:
                </p>
                <ul className="text-[9px] text-blue-200 space-y-0.5">
                  {accuracyTips.slice(0, 2).map((tip, idx) => (
                    <li key={idx}>• {tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Done Button */}
        <Button
          className="w-full h-10 rounded-lg bg-white text-black font-semibold hover:bg-white/90 shadow-lg text-sm"
          disabled={!measurements}
          onClick={handleDone}
        >
          تم
        </Button>
      </div>
    </div>
  );
}
