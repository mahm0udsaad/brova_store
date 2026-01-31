"use client"

import { Loader2, Eye, LayoutGrid, ShoppingBag, CreditCard } from "lucide-react"

export function PreviewStoreView({ invocation }: { invocation: any }) {
  if (invocation.state === "input-available" || invocation.state === "input-streaming") {
    return (
      <div dir="rtl" className="bg-[#16213e] rounded-xl p-4 border border-indigo-500/20">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-indigo-400" />
          <span className="text-indigo-300 font-medium">جارِ تحميل المعاينة...</span>
          <Loader2 className="w-4 h-4 animate-spin text-indigo-400 ms-auto" />
        </div>
      </div>
    )
  }

  if (invocation.state === "output-available") {
    const { componentCount, productCount, paymentsConfigured, components } =
      invocation.output

    return (
      <div dir="rtl" className="bg-[#16213e] rounded-xl p-4 border border-indigo-500/20">
        <div className="flex items-center gap-2 mb-3">
          <Eye className="w-5 h-5 text-indigo-400" />
          <span className="text-indigo-300 font-medium">حالة المتجر</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-[#1a1a2e]/50 rounded-lg p-3 text-center">
            <LayoutGrid className="w-5 h-5 text-indigo-400 mx-auto mb-1" />
            <span className="text-xl font-bold text-white">{componentCount}</span>
            <p className="text-xs text-gray-400">مكونات</p>
          </div>
          <div className="bg-[#1a1a2e]/50 rounded-lg p-3 text-center">
            <ShoppingBag className="w-5 h-5 text-indigo-400 mx-auto mb-1" />
            <span className="text-xl font-bold text-white">{productCount}</span>
            <p className="text-xs text-gray-400">منتجات</p>
          </div>
          <div className="bg-[#1a1a2e]/50 rounded-lg p-3 text-center">
            <CreditCard className="w-5 h-5 text-indigo-400 mx-auto mb-1" />
            <span className="text-xl font-bold text-white">
              {paymentsConfigured ? "✓" : "✗"}
            </span>
            <p className="text-xs text-gray-400">الدفع</p>
          </div>
        </div>

        {components && components.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {components.map(
              (c: { type: string; position: number }, i: number) => (
                <span
                  key={i}
                  className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full"
                >
                  {c.type}
                </span>
              )
            )}
          </div>
        )}
      </div>
    )
  }

  return null
}
