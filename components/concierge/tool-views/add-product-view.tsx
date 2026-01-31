"use client"

import { CheckCircle, Loader2, ShoppingBag, AlertCircle } from "lucide-react"

export function AddProductView({ invocation }: { invocation: any }) {
  if (invocation.state === "input-available" || invocation.state === "input-streaming") {
    return (
      <div dir="rtl" className="bg-[#16213e] rounded-xl p-4 border border-indigo-500/20">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-indigo-400" />
          <span className="text-indigo-300 font-medium">
            جارِ إضافة {invocation.input?.name_ar || "المنتج"}...
          </span>
          <Loader2 className="w-4 h-4 animate-spin text-indigo-400 ms-auto" />
        </div>
      </div>
    )
  }

  if (invocation.state === "output-available") {
    const { status, message_ar, name_ar, price, currency } = invocation.output
    const isSuccess = status === "added"

    return (
      <div dir="rtl" className="bg-[#16213e] rounded-xl p-4 border border-indigo-500/20">
        <div className="flex items-center gap-2">
          {isSuccess ? (
            <CheckCircle className="w-5 h-5 text-green-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400" />
          )}
          <span className={isSuccess ? "text-green-300" : "text-red-300"}>
            {message_ar}
          </span>
        </div>
        {isSuccess && (
          <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
            <span>{name_ar}</span>
            <span className="text-indigo-400 font-medium">
              {price} {currency}
            </span>
          </div>
        )}
      </div>
    )
  }

  return null
}
