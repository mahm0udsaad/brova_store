import { toast } from "sonner"
import { Sparkles, CheckCircle, AlertCircle, Info } from "lucide-react"

/**
 * AI-specific toast helpers with custom styling and icons
 */
export const aiToast = {
  /**
   * Show a processing/loading toast that persists until dismissed
   */
  processing: (message: string) => {
    return toast.loading(message, {
      icon: <Sparkles className="animate-pulse text-violet-500" />,
      duration: Infinity,
    })
  },

  /**
   * Show a step progress toast
   */
  step: (step: string, current: number, total: number) => {
    return toast.info(`${step} (${current}/${total})`, {
      icon: <Info className="text-blue-500" />,
      duration: 2000,
    })
  },

  /**
   * Show a success toast
   */
  success: (message: string) => {
    return toast.success(message, {
      icon: <CheckCircle className="text-green-500" />,
      duration: 4000,
    })
  },

  /**
   * Show an error toast with optional retry action
   */
  error: (message: string, retry?: () => void) => {
    return toast.error(message, {
      icon: <AlertCircle className="text-red-500" />,
      duration: 5000,
      action: retry
        ? {
            label: "Retry",
            onClick: retry,
          }
        : undefined,
    })
  },

  /**
   * Show an info toast
   */
  info: (message: string) => {
    return toast.info(message, {
      icon: <Info className="text-blue-500" />,
      duration: 3000,
    })
  },

  /**
   * Dismiss a specific toast by ID
   */
  dismiss: (toastId: string | number) => {
    toast.dismiss(toastId)
  },

  /**
   * Dismiss all toasts
   */
  dismissAll: () => {
    toast.dismiss()
  },
}
