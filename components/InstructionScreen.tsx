"use client";

import { motion } from "framer-motion";
import { Camera, Ruler, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { triggerHaptic } from "@/lib/haptics";

interface InstructionScreenProps {
  onStart: () => void;
}

export function InstructionScreen({ onStart }: InstructionScreenProps) {
  const handleStart = () => {
    triggerHaptic("medium");
    onStart();
  };

  const instructions = [
    { icon: "📏", text: "Stand straight" },
    { icon: "👤", text: "Full body visible" },
    { icon: "💡", text: "Good lighting" },
    { icon: "🤲", text: "Arms relaxed" },
    { icon: "📱", text: "Phone upright" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 max-w-md mx-auto w-full px-4 py-8 flex flex-col">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Ruler className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Get Your Measurements</h1>
          <p className="text-muted-foreground">
            We'll capture your body measurements using AI to help you find the
            perfect fit.
          </p>
        </motion.div>

        {/* Visual Examples */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            What we need
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {/* Front View */}
            <div className="bg-muted/50 rounded-2xl p-6 flex flex-col items-center">
              <div className="relative w-full aspect-[3/4] mb-4 flex items-center justify-center">
                {/* Simple silhouette representation */}
                <svg
                  viewBox="0 0 100 150"
                  className="w-full h-full"
                  fill="currentColor"
                  opacity="0.3"
                >
                  {/* Head */}
                  <circle cx="50" cy="20" r="12" />
                  {/* Body */}
                  <rect x="38" y="32" width="24" height="45" rx="4" />
                  {/* Arms */}
                  <rect x="24" y="35" width="14" height="35" rx="3" />
                  <rect x="62" y="35" width="14" height="35" rx="3" />
                  {/* Legs */}
                  <rect x="40" y="77" width="8" height="65" rx="3" />
                  <rect x="52" y="77" width="8" height="65" rx="3" />
                </svg>
              </div>
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-primary" />
                <span className="font-semibold">Front View</span>
              </div>
              <span className="text-xs text-muted-foreground mt-1">
                Required
              </span>
            </div>

            {/* Side View */}
            <div className="bg-muted/50 rounded-2xl p-6 flex flex-col items-center">
              <div className="relative w-full aspect-[3/4] mb-4 flex items-center justify-center">
                {/* Simple side silhouette */}
                <svg
                  viewBox="0 0 100 150"
                  className="w-full h-full"
                  fill="currentColor"
                  opacity="0.3"
                >
                  {/* Head (side profile) */}
                  <ellipse cx="55" cy="20" rx="10" ry="12" />
                  {/* Body (side) */}
                  <rect x="48" y="32" width="16" height="45" rx="3" />
                  {/* Arm (side) */}
                  <rect x="48" y="35" width="12" height="35" rx="2" />
                  {/* Legs */}
                  <rect x="50" y="77" width="8" height="65" rx="3" />
                </svg>
              </div>
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-muted-foreground" />
                <span className="font-semibold">Side View</span>
              </div>
              <span className="text-xs text-muted-foreground mt-1">
                Recommended
              </span>
            </div>
          </div>
        </motion.div>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Quick tips
          </h2>
          <div className="space-y-3">
            {instructions.map((instruction, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                className="flex items-center gap-3 bg-muted/30 rounded-xl p-3"
              >
                <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center text-xl shrink-0">
                  {instruction.icon}
                </div>
                <span className="font-medium">{instruction.text}</span>
                <CheckCircle2 className="w-5 h-5 text-primary ml-auto shrink-0" />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Spacer to push button to bottom */}
        <div className="flex-1" />

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="sticky bottom-0 pt-4 bg-gradient-to-t from-background via-background to-transparent"
        >
          <Button
            onClick={handleStart}
            className="w-full h-14 rounded-xl text-base font-semibold"
            size="lg"
          >
            <Camera className="w-5 h-5 mr-2" />
            Start Camera
          </Button>
          <p className="text-xs text-center text-muted-foreground mt-3">
            Your photos are processed locally and securely
          </p>
        </motion.div>
      </div>
    </div>
  );
}
