"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface QuestionCardProps {
  question: string
  options: Array<{ label: string; value: string }>
  allowMultiple?: boolean
  onSelect: (values: string[]) => void
  disabled?: boolean
  locale?: "en" | "ar"
}

export function QuestionCard({
  question,
  options,
  allowMultiple = false,
  onSelect,
  disabled = false,
  locale = "en",
}: QuestionCardProps) {
  const [selected, setSelected] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)
  const isRtl = locale === "ar"

  const handleOptionClick = (value: string) => {
    if (disabled || submitted) return

    if (allowMultiple) {
      setSelected((prev) =>
        prev.includes(value)
          ? prev.filter((v) => v !== value)
          : [...prev, value]
      )
    } else {
      setSelected([value])
      setSubmitted(true)
      onSelect([value])
    }
  }

  const handleSubmitMultiple = () => {
    if (selected.length === 0 || submitted) return
    setSubmitted(true)
    onSelect(selected)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "rounded-xl border border-border bg-card p-4 shadow-sm",
        isRtl && "text-right"
      )}
      dir={isRtl ? "rtl" : "ltr"}
    >
      <p className="mb-3 text-sm font-medium text-foreground">{question}</p>

      <div className="flex flex-wrap gap-2">
        {options.map((option, idx) => {
          const isSelected = selected.includes(option.value)
          return (
            <motion.button
              key={option.value}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => handleOptionClick(option.value)}
              disabled={disabled || submitted}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                "border",
                isSelected
                  ? "border-violet-500 bg-violet-500/10 text-violet-700 dark:text-violet-300"
                  : "border-border bg-background text-muted-foreground hover:border-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/30",
                (disabled || submitted) && "cursor-not-allowed opacity-60"
              )}
            >
              {isSelected && <Check className="h-3.5 w-3.5" />}
              {option.label}
            </motion.button>
          )
        })}
      </div>

      {allowMultiple && !submitted && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          onClick={handleSubmitMultiple}
          disabled={selected.length === 0}
          className={cn(
            "mt-3 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-violet-700",
            selected.length === 0 && "cursor-not-allowed opacity-40"
          )}
        >
          {locale === "ar" ? "تأكيد" : "Confirm"} ({selected.length})
        </motion.button>
      )}
    </motion.div>
  )
}
