"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  RotateCw,
  X,
  AlertCircle,
  Check,
  SwitchCamera,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { triggerHaptic } from "@/lib/haptics";
import { captureImageFromVideo } from "@/lib/measurements";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface CameraCaptureSideProps {
  onCapture: (file: File | null) => void; // null means skipped
  onBack?: () => void;
}

function getCameraErrorMessage(err: any, t: ReturnType<typeof useTranslations>): string {
  if (typeof window !== "undefined" && !window.isSecureContext) {
    return t("errors.httpsRequired");
  }

  if (
    typeof navigator === "undefined" ||
    !navigator.mediaDevices ||
    !navigator.mediaDevices.getUserMedia
  ) {
    return t("errors.browserUnsupported");
  }

  const name = err?.name as string | undefined;
  const message = (err?.message as string | undefined) ?? "";

  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return t("errors.permissionBlocked");
  }

  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return t("errors.noCamera");
  }

  if (name === "NotReadableError") {
    return t("errors.cameraInUse");
  }

  if (message.toLowerCase().includes("secure") || message.toLowerCase().includes("https")) {
    return t("errors.httpsRequired");
  }

  return t("errors.startFailed");
}

export function CameraCaptureSide({
  onCapture,
  onBack,
}: CameraCaptureSideProps) {
  const locale = useLocale();
  const t = useTranslations("camera");
  const isRtl = locale === "ar";
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [isLandscape, setIsLandscape] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment"
  );
  const [canSwitchCamera, setCanSwitchCamera] = useState(false);

  // Check orientation
  const checkOrientation = useCallback(() => {
    const isLandscapeMode = window.matchMedia(
      "(orientation: landscape)"
    ).matches;
    setIsLandscape(isLandscapeMode);
  }, []);

  // Start camera stream
  const startCamera = useCallback(
    async (facing: "user" | "environment" = facingMode) => {
      try {
        setIsLoading(true);
        setError(null);

        if (!window.isSecureContext) {
          setIsLoading(false);
          setError(getCameraErrorMessage({ message: "Insecure context" }, t));
          return;
        }

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setIsLoading(false);
          setError(getCameraErrorMessage({ message: "mediaDevices unsupported" }, t));
          return;
        }

        // Stop existing stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }

        // Request camera access
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Check if we can switch cameras
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(
          (device) => device.kind === "videoinput"
        );
        setCanSwitchCamera(videoDevices.length > 1);

        setIsLoading(false);
      } catch (err: any) {
        console.error("Camera error:", err);
        setIsLoading(false);
        setError(getCameraErrorMessage(err, t));
      }
    },
    [facingMode, t]
  );

  // Switch camera
  const handleSwitchCamera = useCallback(() => {
    triggerHaptic("light");
    const newFacingMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newFacingMode);
    startCamera(newFacingMode);
  }, [facingMode, startCamera]);

  // Capture photo
  const handleCapture = useCallback(async () => {
    if (!videoRef.current) return;

    try {
      triggerHaptic("medium");
      const file = await captureImageFromVideo(
        videoRef.current,
        "side-capture.jpg"
      );

      // Create preview URL
      const previewURL = URL.createObjectURL(file);
      setCapturedImage(previewURL);
      setCapturedFile(file);

      // Stop camera stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    } catch (err) {
      console.error("Capture error:", err);
      setError(t("errors.captureFailed"));
    }
  }, [t]);

  // Retake photo
  const handleRetake = useCallback(() => {
    triggerHaptic("light");
    setCapturedImage(null);
    setCapturedFile(null);
    startCamera();
  }, [startCamera]);

  // Continue with captured image
  const handleContinue = useCallback(() => {
    if (capturedFile) {
      triggerHaptic("success");
      onCapture(capturedFile);
    }
  }, [capturedFile, onCapture]);

  // Skip side photo
  const handleSkip = useCallback(() => {
    triggerHaptic("light");
    
    // Stop camera if running
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    
    onCapture(null); // null indicates skip
  }, [onCapture]);

  // Handle file upload fallback
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        triggerHaptic("light");

        // Validate file type
        const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
        if (!allowedTypes.includes(file.type)) {
          setError(t("errors.invalidFileType"));
          return;
        }

        // Create preview
        const previewURL = URL.createObjectURL(file);
        setCapturedImage(previewURL);
        setCapturedFile(file);

        // Stop camera if running
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }
      }
    },
    [t]
  );

  // Initialize
  useEffect(() => {
    checkOrientation();
    startCamera();

    // Listen for orientation changes
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);

    // Cleanup
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
    };
  }, [startCamera, checkOrientation]);

  return (
    <div className="min-h-screen bg-black flex flex-col relative">
      {/* Header */}
      <div className="absolute top-0 inset-x-0 z-20 px-4 py-6 bg-gradient-to-b from-black/60 to-transparent">
        <div className={cn("max-w-md mx-auto flex items-center justify-between", isRtl && "flex-row-reverse")}>
          {onBack && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                triggerHaptic("light");
                if (streamRef.current) {
                  streamRef.current.getTracks().forEach((track) => track.stop());
                }
                onBack();
              }}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
            >
              <X className="w-5 h-5 text-white" />
            </motion.button>
          )}
          <div className={cn("flex-1 text-center", isRtl && "text-right")}>
            <h2 className="text-white font-semibold">{t("sideTitle")}</h2>
            <p className="text-white/70 text-sm">{t("sideSubtitle")}</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleSkip}
            className="text-white/80 text-sm font-medium hover:text-white"
          >
            {t("skip")}
          </motion.button>
        </div>
      </div>

      {/* Camera View / Preview */}
      <div className="flex-1 relative flex items-center justify-center">
        {!capturedImage ? (
          <>
            {/* Video Stream */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Overlay Guide with Side Profile - Larger frame */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-4">
              <div className="relative w-full max-w-xs aspect-[3/4] border-2 border-white/40 rounded-2xl">
                <div className={cn("absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-2xl", isRtl && "-left-auto -right-1 border-l-0 border-r-4 rounded-tl-none rounded-tr-2xl")} />
                <div className={cn("absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-2xl", isRtl && "-right-auto -left-1 border-r-0 border-l-4 rounded-tr-none rounded-tl-2xl")} />
                <div className={cn("absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-2xl", isRtl && "-left-auto -right-1 border-l-0 border-r-4 rounded-bl-none rounded-br-2xl")} />
                <div className={cn("absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-2xl", isRtl && "-right-auto -left-1 border-r-0 border-l-4 rounded-br-none rounded-bl-2xl")} />

                {/* Side profile indicator */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center px-4">
                  <div className="flex items-center justify-center gap-2 text-white/80 text-sm font-medium bg-black/40 backdrop-blur-sm px-3 py-2 rounded-lg">
                    <span>{t("turnLeft")}</span>
                    <ArrowRight className={cn("w-4 h-4", isRtl ? "rotate-0" : "rotate-180")} />
                  </div>
                </div>
              </div>
            </div>

            {/* Loading Overlay */}
            {isLoading && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
                  <p>{t("startingCamera")}</p>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Captured Image Preview */
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            <img
              src={capturedImage}
              alt={t("sideCaptureAlt")}
              className="max-w-xs max-h-64 w-auto h-auto object-contain rounded-lg shadow-2xl"
            />
          </div>
        )}
      </div>

      {/* Landscape Warning */}
      <AnimatePresence>
        {isLandscape && !capturedImage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute top-20 inset-x-4 z-30"
          >
            <div className="max-w-md mx-auto bg-yellow-500/90 backdrop-blur-sm text-black px-4 py-3 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">
                {t("rotateToPortrait")}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message with Instructions */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute top-20 inset-x-4 z-30"
          >
            <div className="max-w-md mx-auto bg-red-500/90 backdrop-blur-sm text-white px-4 py-4 rounded-xl">
              <div className="flex items-start gap-3 mb-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold mb-2">{t("accessTitle")}</p>
                  <p className="text-xs opacity-90 mb-2">
                    {t("accessSubtitle")}
                  </p>
                  <div className="text-xs opacity-90 space-y-1 bg-white/10 rounded-lg p-2 mb-2">
                    <p className="font-medium">{t("iosLabel")}</p>
                    <p>{t("iosSteps")}</p>
                    <p className="font-medium mt-2">{t("androidLabel")}</p>
                    <p>{t("androidSteps")}</p>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-10 bg-white text-red-600 hover:bg-white/90"
                size="sm"
              >
                {t("uploadInstead")}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recommended Badge */}
      <AnimatePresence>
        {!capturedImage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-24 inset-x-0 z-30 flex justify-center"
          >
            <div className="bg-primary/90 backdrop-blur-sm text-primary-foreground px-4 py-2 rounded-full text-xs font-semibold">
              {t("recommended")}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 inset-x-0 z-20 px-4 py-8 bg-gradient-to-t from-black/60 to-transparent">
        <div className="max-w-md mx-auto">
          {!capturedImage ? (
            <div className="flex items-center justify-center gap-8">
              {/* Switch Camera */}
              {canSwitchCamera && (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleSwitchCamera}
                  className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
                >
                  <SwitchCamera className="w-6 h-6 text-white" />
                </motion.button>
              )}

              {/* Capture Button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleCapture}
                disabled={isLoading}
                className="w-20 h-20 rounded-full bg-white flex items-center justify-center disabled:opacity-50 shadow-xl"
              >
                <div className="w-16 h-16 rounded-full border-4 border-black" />
              </motion.button>

              {/* Upload Alternative */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => fileInputRef.current?.click()}
                className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
              >
                <Camera className="w-6 h-6 text-white" />
              </motion.button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            /* Preview Actions */
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-14 rounded-xl bg-white/20 backdrop-blur-sm border-white/40 text-white hover:bg-white/30"
                onClick={handleRetake}
              >
                <RotateCw className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                {t("retake")}
              </Button>
              <Button
                className="flex-1 h-14 rounded-xl bg-white text-black hover:bg-white/90"
                onClick={handleContinue}
              >
                <Check className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                {t("continue")}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
