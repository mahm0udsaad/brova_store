"use client"

import { motion } from "framer-motion"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ConfirmationRequest } from "@/lib/ai/context-builder"

interface AIConfirmationProps {
  confirmation: ConfirmationRequest
  onConfirm: () => void
  onCancel: () => void
}

export function AIConfirmation({ confirmation, onConfirm, onCancel }: AIConfirmationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4"
    >
      <div className="flex gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-sm mb-1">Confirmation Required</h4>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
            {confirmation.description}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            <span className="font-medium">Impact:</span> {confirmation.impact}
          </p>

          {confirmation.affectedItems && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              This will affect <span className="font-semibold">{confirmation.affectedItems}</span> item(s).
            </p>
          )}

          {confirmation.estimatedCost && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Estimated cost: <span className="font-semibold">{confirmation.estimatedCost} EGP</span>
            </p>
          )}

          <div className="flex gap-2 mt-4">
            <Button onClick={onConfirm} variant="default" size="sm">
              Confirm
            </Button>
            <Button onClick={onCancel} variant="outline" size="sm">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
