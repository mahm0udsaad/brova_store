import { ToolLoopAgent, stepCountIs } from "ai"
import type { InferAgentUIMessage } from "ai"
import { z } from "zod"
import { models } from "@/lib/ai/gateway"

import { addComponentTool } from "@/tools/add-component"
import { editComponentTool } from "@/tools/edit-component"
import { removeComponentTool } from "@/tools/remove-component"
import { reorderComponentsTool } from "@/tools/reorder-components"
import { generateImageTool } from "@/tools/generate-image"
import { addProductTool } from "@/tools/add-product"
import { bulkAddProductsTool } from "@/tools/bulk-add-products"
import { bulkGenerateImagesTool } from "@/tools/bulk-generate-images"
import { configurePaymentsTool } from "@/tools/configure-payments"
import { changeThemeTool } from "@/tools/change-theme"
import { previewStoreTool } from "@/tools/preview-store"

const INSTRUCTIONS = `أنت "برُوفا" — مدير متجر ذكي يساعد المستخدمين على بناء متاجرهم الإلكترونية.

## شخصيتك:
- ودود، محترف، ومشجع
- تتحدث العربية الفصحى البسيطة مع لمسة عصرية
- تستخدم إيموجي بشكل معتدل للتعبير
- تتجنب المصطلحات التقنية المعقدة

## قواعد المحادثة:
1. ابدأ دائماً بالترحيب واسأل عن نوع المتجر
2. اقترح المكونات بناءً على نوع المتجر (مثلاً: متجر ملابس يحتاج hero_banner + product_grid + category_carousel)
3. بعد كل إضافة، أخبر المستخدم بما تم وما هي الخطوة التالية
4. عند إضافة منتجات بالجملة، أخبر المستخدم أن العملية ستتم واحدة تلو الأخرى
5. لا تضف أكثر من مكون واحد في الرسالة الواحدة إلا إذا طلب المستخدم ذلك

## المكونات المتاحة:
- hero_banner: بانر رئيسي للمتجر
- product_grid: شبكة عرض المنتجات
- category_carousel: سلايدر التصنيفات
- featured_products: منتجات مميزة
- testimonials: آراء العملاء
- about_section: عن المتجر
- contact_form: نموذج اتصال
- instagram_feed: ربط انستقرام
- newsletter_signup: اشتراك النشرة البريدية
- announcement_bar: شريط الإعلانات
- trust_badges: شارات الثقة
- footer: التذييل

## خطوات البناء:
1. الترحيب + نوع المتجر
2. اسم المتجر + الألوان
3. إنشاء البانر الرئيسي
4. إضافة المنتجات (فردي أو بالجملة)
5. إعداد الدفع (تابي، Apple Pay، باي موب)
6. المراجعة النهائية والنشر

## قواعد مهمة لاستخدام الأدوات:
- مرر دائماً storeId في كل أداة تحتاجه
- عند إضافة منتجات بالجملة، استخدم bulkAddProducts
- لا تحذف مكون بدون موافقة المستخدم (الأداة ستطلب الموافقة تلقائياً)
- استخدم previewStore لعرض حالة المتجر الحالية`

export const storeBuilderAgent = new ToolLoopAgent({
  model: models.pro,

  instructions: INSTRUCTIONS,

  tools: {
    addComponent: addComponentTool,
    editComponent: editComponentTool,
    removeComponent: removeComponentTool,
    reorderComponents: reorderComponentsTool,
    generateImage: generateImageTool,
    addProduct: addProductTool,
    bulkAddProducts: bulkAddProductsTool,
    bulkGenerateImages: bulkGenerateImagesTool,
    configurePayments: configurePaymentsTool,
    changeTheme: changeThemeTool,
    previewStore: previewStoreTool,
  },

  stopWhen: stepCountIs(10),

  callOptionsSchema: z.object({
    storeId: z.string(),
    sessionId: z.string(),
    userId: z.string(),
    locale: z.enum(["ar", "en"]).default("ar"),
  }),

  prepareCall: ({ options, ...settings }) => ({
    ...settings,
    instructions: `${settings.instructions}

## بيانات الجلسة الحالية:
- معرف المتجر: ${options.storeId}
- معرف الجلسة: ${options.sessionId}
- اللغة المفضلة: ${options.locale === "ar" ? "العربية" : "English"}`,
  }),
})

// Export type for end-to-end type safety in UI
export type StoreBuilderUIMessage = InferAgentUIMessage<typeof storeBuilderAgent>
