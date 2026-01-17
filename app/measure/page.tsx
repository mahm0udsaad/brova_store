"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { InstructionScreen } from "@/components/InstructionScreen";
import { RealTimePoseCamera } from "@/components/RealTimePoseCamera";
import { MeasurementResults } from "@/components/MeasurementResults";
import { triggerHaptic } from "@/lib/haptics";

type FlowStep = "instructions" | "camera" | "results";

interface Measurements {
  height_cm?: number;
  chest_cm?: number;
  waist_cm?: number;
  hip_cm?: number;
  shoulder_width_cm?: number;
}

export default function MeasurePage() {
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState<FlowStep>("instructions");
  const [measurements, setMeasurements] = useState<Measurements | null>(null);

  // Start flow
  const handleStart = useCallback(() => {
    setCurrentStep("camera");
  }, []);

  // Handle measurements received from RealTimePoseCamera
  const handleMeasurementsReceived = useCallback((data: Measurements) => {
    setMeasurements(data);
    setCurrentStep("results");
    triggerHaptic("success");
  }, []);

  // Back from camera
  const handleBackFromCamera = useCallback(() => {
    setCurrentStep("instructions");
  }, []);

  // Re-measure from scratch
  const handleRemeasure = useCallback(() => {
    setMeasurements(null);
    setCurrentStep("instructions");
  }, []);

  // Done - go home
  const handleDone = useCallback(() => {
    router.push("/");
  }, [router]);

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence mode="wait">
        {currentStep === "instructions" && (
          <motion.div
            key="instructions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <InstructionScreen onStart={handleStart} />
          </motion.div>
        )}

        {currentStep === "camera" && (
          <motion.div
            key="camera"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <RealTimePoseCamera 
                onBack={handleBackFromCamera}
                onMeasurementsReceived={handleMeasurementsReceived}
            />
          </motion.div>
        )}

        {currentStep === "results" && measurements && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <MeasurementResults
              measurements={measurements}
              onRemeasure={handleRemeasure}
              onDone={handleDone}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
