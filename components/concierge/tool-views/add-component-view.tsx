"use client"

import { CheckCircle, Loader2, LayoutGrid } from "lucide-react"

const COMPONENT_NAMES_AR: Record<string, string> = {
  hero_banner: "بانر رئيسي",
  product_grid: "شبكة المنتجات",
  category_carousel: "سلايدر التصنيفات",
  featured_products: "منتجات مميزة",
  testimonials: "آراء العملاء",
  about_section: "عن المتجر",
  contact_form: "نموذج اتصال",
  instagram_feed: "انستقرام",
  newsletter_signup: "النشرة البريدية",
  announcement_bar: "شريط الإعلانات",
  trust_badges: "شارات الثقة",
  footer: "التذييل",
}

export function AddComponentView({ invocation }: { invocation: any }) {
  if (invocation.state === "input-available" || invocation.state === "input-streaming") {
    const componentType = invocation.input?.componentType
    return (
      <div dir="rtl" className="bg-[#16213e] rounded-xl p-4 border border-indigo-500/20">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-5 h-5 text-indigo-400" />
          <span className="text-indigo-300 font-medium">
            جارِ إضافة {COMPONENT_NAMES_AR[componentType] || componentType}...
          </span>
          <Loader2 className="w-4 h-4 animate-spin text-indigo-400 ms-auto" />
        </div>
      </div>
    )
  }

  if (invocation.state === "output-available") {
    const { componentType, status, message_ar } = invocation.output
    const isSuccess = status === "added"

    return (
      <div dir="rtl" className="bg-[#16213e] rounded-xl p-4 border border-indigo-500/20">
        <div className="flex items-center gap-2">
          {isSuccess ? (
            <CheckCircle className="w-5 h-5 text-green-400" />
          ) : (
            <LayoutGrid className="w-5 h-5 text-red-400" />
          )}
          <span className={isSuccess ? "text-green-300" : "text-red-300"}>
            {message_ar || COMPONENT_NAMES_AR[componentType] || componentType}
          </span>
        </div>
      </div>
    )
  }

  return null
}
