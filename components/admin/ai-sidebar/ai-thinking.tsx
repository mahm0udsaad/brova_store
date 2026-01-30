"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, ChevronUp, Brain, Cog, Sparkles, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { StepUpdate } from "./ai-sidebar"

interface AIThinkingIndicatorProps {
  steps: StepUpdate[]
  defaultExpanded?: boolean
}

export function AIThinkingIndicator({ steps, defaultExpanded = false }: AIThinkingIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const getStepIcon = (type: StepUpdate["type"]) => {
    switch (type) {
      case "planning":
        return <Brain className="w-4 h-4" />
      case "executing":
        return <Cog className="w-4 h-4 animate-spin" />
      case "synthesizing":
        return <Sparkles className="w-4 h-4" />
      case "complete":
        return <CheckCircle className="w-4 h-4" />
      default:
        return <Cog className="w-4 h-4" />
    }
  }

  const getStepColor = (type: StepUpdate["type"]) => {
    switch (type) {
      case "planning":
        return "text-blue-500"
      case "executing":
        return "text-violet-500"
      case "synthesizing":
        return "text-purple-500"
      case "complete":
        return "text-green-500"
      default:
        return "text-gray-500"
    }
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-violet-500" />
          <span className="text-sm font-medium">
            {isExpanded ? "Hide" : "Show"} thinking process ({steps.length} steps)
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-gray-200 dark:border-gray-700"
          >
            <div className="p-3 space-y-2 bg-gray-50 dark:bg-gray-900/50">
              {steps.map((step, idx) => (
                <motion.div
                  key={idx}
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className={cn(
                    "flex items-start gap-2 text-sm",
                    getStepColor(step.type)
                  )}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getStepIcon(step.type)}
                  </div>
                  <div className="flex-1">
                    {step.step && step.totalSteps && (
                      <span className="text-xs opacity-70 mr-2">
                        [{step.step}/{step.totalSteps}]
                      </span>
                    )}
                    {step.agentName && (
                      <span className="font-medium mr-2">{step.agentName}:</span>
                    )}
                    <span className="opacity-90">{step.message}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
