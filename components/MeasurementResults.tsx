"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Ruler, RotateCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { triggerHaptic } from "@/lib/haptics";

interface Measurements {
  height_cm?: number;
  height?: number;
  chest_cm?: number;
  chest?: number;
  waist_cm?: number;
  waist?: number;
  hip_cm?: number;
  hip?: number;
  shoulder_width_cm?: number;
  shoulder_width?: number;
  arm_length_cm?: number;
  arm_length?: number;
  inseam_cm?: number;
  inseam?: number;
  overall_confidence?: number;
  accuracy_level?: string;
}

interface MeasurementResultsProps {
  measurements: Measurements;
  onRemeasure: () => void;
  onDone: () => void;
}

export function MeasurementResults({
  measurements,
  onRemeasure,
  onDone,
}: MeasurementResultsProps) {
  const handleRemeasure = () => {
    triggerHaptic("light");
    onRemeasure();
  };

  const handleDone = () => {
    triggerHaptic("success");
    onDone();
  };

  const measurementCards = [
    {
      label: "الطول",
      value: measurements.height_cm || measurements.height,
      unit: "سم",
      icon: "📏",
      color: "bg-blue-500/10 border-blue-500/20",
    },
    {
      label: "الصدر",
      value: measurements.chest_cm || measurements.chest,
      unit: "سم",
      icon: "👔",
      color: "bg-purple-500/10 border-purple-500/20",
    },
    {
      label: "الخصر",
      value: measurements.waist_cm || measurements.waist,
      unit: "سم",
      icon: "⚡",
      color: "bg-green-500/10 border-green-500/20",
    },
    {
      label: "الكتف",
      value: measurements.shoulder_width_cm || measurements.shoulder_width,
      unit: "سم",
      icon: "💪",
      color: "bg-red-500/10 border-red-500/20",
    },
    {
      label: "الذراع",
      value: measurements.arm_length_cm || measurements.arm_length,
      unit: "سم",
      icon: "💪",
      color: "bg-orange-500/10 border-orange-500/20",
    },
    {
      label: "الساق",
      value: measurements.inseam_cm || measurements.inseam,
      unit: "سم",
      icon: "👖",
      color: "bg-pink-500/10 border-pink-500/20",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <div className="flex-1 max-w-md mx-auto w-full px-4 py-8 flex flex-col">
        {/* Success Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4"
          >
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </motion.div>
          <h1 className="text-2xl font-bold mb-2">القياسات جاهزة!</h1>
          <p className="text-muted-foreground">
            تم حساب قياسات جسمك
          </p>
          {measurements.overall_confidence !== undefined && (
            <div className="mt-3 inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full">
              <span className="text-sm font-medium">الدقة:</span>
              <span className="text-sm font-bold">
                {Math.round(measurements.overall_confidence * 100)}%
              </span>
              {measurements.accuracy_level && (
                <span className="text-xs text-muted-foreground">
                  ({measurements.accuracy_level})
                </span>
              )}
            </div>
          )}
        </motion.div>

        {/* Measurement Cards - grid of 2! */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 gap-3 mb-8"
        >
          {measurementCards.map((card, index) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.05 }}
              className={`${card.color} border rounded-2xl p-4 flex flex-col items-center justify-between aspect-square`}
            >
              <div className="flex flex-col items-center mb-2">
                <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center text-2xl mb-1">
                  {card.icon}
                </div>
                <p className="text-sm text-muted-foreground font-medium">
                  {card.label}
                </p>
              </div>
              <div className="flex flex-col items-center">
                <p className="text-2xl font-bold">
                  {card.value ? (
                    <>
                      {card.value}
                      <span className="text-base text-muted-foreground ml-1">
                        {card.unit}
                      </span>
                    </>
                  ) : (
                    <span className="text-base text-muted-foreground">
                      غير متوفر
                    </span>
                  )}
                </p>
                <Ruler className="w-5 h-5 text-muted-foreground mt-2" />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-muted/50 rounded-2xl p-4 mb-8"
        >
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-xl">ℹ️</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium mb-1">حول هذه القياسات</p>
              <p className="text-xs text-muted-foreground">
                يتم حساب هذه القياسات باستخدام الذكاء الاصطناعي وقد يكون هناك هامش خطأ صغير. استخدمها كدليل عند التسوق للملابس.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="space-y-3 sticky bottom-0 pt-4 bg-gradient-to-t from-background via-background to-transparent"
        >
          <Button
            variant="outline"
            onClick={handleRemeasure}
            className="w-full h-14 rounded-xl text-base"
          >
            <RotateCw className="w-5 h-5 ml-2" />
            إعادة القياس
          </Button>
          <Button
            onClick={handleDone}
            className="w-full h-14 rounded-xl text-base font-semibold"
          >
            <Home className="w-5 h-5 ml-2" />
            تم
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            يتم حفظ قياساتك محليًا
          </p>
        </motion.div>
      </div>
    </div>
  );
}
