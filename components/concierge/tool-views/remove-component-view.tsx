"use client"

import { CheckCircle, Loader2, Trash2, ShieldAlert } from "lucide-react"

export function RemoveComponentView({ invocation }: { invocation: any }) {
  if (invocation.state === "approval-requested") {
    return (
      <div dir="rtl" className="bg-[#16213e] rounded-xl p-4 border border-red-500/30">
        <div className="flex items-center gap-2 mb-3">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
          <span className="text-amber-300 font-medium">
            هل تريد حذف {invocation.input?.componentType}؟
          </span>
        </div>
        <p className="text-xs text-gray-400 mb-3">هذا الإجراء لا يمكن التراجع عنه</p>
        {/* Approval buttons are handled by the useChat hook's addToolApprovalResponse */}
      </div>
    )
  }

  if (invocation.state === "input-available" || invocation.state === "input-streaming") {
    return (
      <div dir="rtl" className="bg-[#16213e] rounded-xl p-4 border border-red-500/20">
        <div className="flex items-center gap-2">
          <Trash2 className="w-5 h-5 text-red-400" />
          <span className="text-red-300 font-medium">جارِ حذف المكون...</span>
          <Loader2 className="w-4 h-4 animate-spin text-red-400 ms-auto" />
        </div>
      </div>
    )
  }

  if (invocation.state === "output-available") {
    const { removed, message_ar } = invocation.output
    return (
      <div dir="rtl" className="bg-[#16213e] rounded-xl p-4 border border-indigo-500/20">
        <div className="flex items-center gap-2">
          {removed ? (
            <CheckCircle className="w-5 h-5 text-green-400" />
          ) : (
            <Trash2 className="w-5 h-5 text-red-400" />
          )}
          <span className={removed ? "text-green-300" : "text-red-300"}>
            {message_ar}
          </span>
        </div>
      </div>
    )
  }

  return null
}
