export type AICommand =
  | { type: "navigate"; path: string }
  | { type: "click"; selector: string }
  | { type: "fill"; selector: string; value: string }
  | { type: "select_image"; imageId: string }
  | { type: "trigger_action"; action: string; params: Record<string, any> }
  | { type: "show_toast"; message: string; variant: "success" | "error" | "info" }
  | { type: "open_modal"; modalType: string; data?: any }
  | { type: "refresh_data"; dataType: string }

export interface AICommandRecord {
  id?: string
  merchant_id?: string
  command: AICommand
  status?: "pending" | "executing" | "completed" | "failed"
  result?: any
  error?: string
  created_at?: string
  executed_at?: string
  completed_at?: string
}
