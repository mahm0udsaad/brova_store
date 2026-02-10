"use client"

import type { ComparisonTableData } from "@/types/ai"

interface ComparisonTableProps {
  data: ComparisonTableData
  locale: "ar" | "en"
}

export function ComparisonTable({ data, locale }: ComparisonTableProps) {
  const isRTL = locale === "ar"

  if (!data.products || data.products.length < 2) {
    return (
      <div className="rounded-xl border border-border/50 bg-muted/30 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          {isRTL ? "يلزم منتجان على الأقل للمقارنة" : "Need at least 2 products to compare"}
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border/50 overflow-hidden" dir={isRTL ? "rtl" : "ltr"}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          {/* Product headers */}
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="p-3 text-start text-xs font-medium text-muted-foreground">
                {isRTL ? "المواصفة" : "Attribute"}
              </th>
              {data.products.map((product) => (
                <th key={product.id} className="p-3 text-center min-w-[120px]">
                  <div className="space-y-2">
                    {product.image && (
                      <div className="w-16 h-16 mx-auto rounded-lg overflow-hidden bg-muted">
                        <img
                          src={product.image}
                          alt={isRTL ? product.nameAr || product.name : product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <p className="text-xs font-medium truncate max-w-[100px] mx-auto">
                      {isRTL ? product.nameAr || product.name : product.name}
                    </p>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          {/* Attributes */}
          <tbody>
            {data.attributes.map((attr, i) => (
              <tr
                key={attr.name}
                className={i % 2 === 0 ? "bg-muted/10" : ""}
              >
                <td className="p-3 text-xs font-medium text-muted-foreground whitespace-nowrap">
                  {isRTL ? attr.nameAr : attr.name}
                </td>
                {data.products.map((product) => (
                  <td key={product.id} className="p-3 text-center text-xs">
                    {String(attr.values[product.id] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
