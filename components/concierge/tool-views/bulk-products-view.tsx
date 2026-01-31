"use client"

import { useEffect, useState } from "react"
import { CheckCircle, Loader2, Package, AlertCircle } from "lucide-react"

export function BulkProductsView({ invocation }: { invocation: any }) {
  const [productStatuses, setProductStatuses] = useState<
    Record<number, "pending" | "processing" | "done" | "error">
  >({})

  useEffect(() => {
    if (invocation.state === "output-available" && invocation.output?.batchId) {
      const interval = setInterval(async () => {
        try {
          const res = await fetch(
            `/api/onboarding/batch/${invocation.output.batchId}/status`
          )
          const data = await res.json()
          setProductStatuses(data.statuses)

          if (
            Object.values(data.statuses).every(
              (s) => s === "done" || s === "error"
            )
          ) {
            clearInterval(interval)
          }
        } catch {
          // Polling failed, will retry
        }
      }, 2000)
      return () => clearInterval(interval)
    }
  }, [invocation.state, invocation.output?.batchId])

  if (invocation.state === "input-available" || invocation.state === "input-streaming") {
    return (
      <div dir="rtl" className="bg-[#16213e] rounded-xl p-4 border border-indigo-500/20">
        <div className="flex items-center gap-2 mb-3">
          <Package className="w-5 h-5 text-indigo-400" />
          <span className="text-indigo-300 font-medium">
            جارِ تجهيز {invocation.input?.products?.length || "..."} منتج...
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
          <span className="text-sm text-gray-400">يتم المعالجة</span>
        </div>
      </div>
    )
  }

  if (invocation.state === "output-available") {
    const { products, totalCount } = invocation.output
    const doneCount = Object.values(productStatuses).filter(
      (s) => s === "done"
    ).length
    const progress = totalCount > 0 ? (doneCount / totalCount) * 100 : 0

    return (
      <div dir="rtl" className="bg-[#16213e] rounded-xl p-4 border border-indigo-500/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-400" />
            <span className="text-indigo-300 font-medium">
              إضافة {totalCount} منتج بالجملة
            </span>
          </div>
          <span className="text-sm text-gray-400">
            {doneCount}/{totalCount}
          </span>
        </div>

        {/* Progress bar - fills right to left */}
        <div className="w-full h-2 bg-gray-700 rounded-full mb-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-l from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Individual product statuses */}
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {products?.map(
            (product: { name_ar: string; index: number }, i: number) => (
              <div
                key={i}
                className="flex items-center justify-between text-sm px-2 py-1 rounded bg-[#1a1a2e]/50"
              >
                <span className="text-gray-300">{product.name_ar}</span>
                {productStatuses[i] === "done" ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : productStatuses[i] === "error" ? (
                  <AlertCircle className="w-4 h-4 text-red-400" />
                ) : (
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                )}
              </div>
            )
          )}
        </div>
      </div>
    )
  }

  return null
}
