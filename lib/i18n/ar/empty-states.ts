/**
 * Empty States Translations - Arabic
 * 
 * These messages turn "no data" moments into guidance opportunities.
 * Each variant should:
 * - Explain the current state
 * - Suggest a next action
 * - Feel helpful, not disappointing
 */

const emptyStates = {
  // Products
  products: {
    title: "لا توجد منتجات بعد",
    description: "ابدأ ببناء متجرك بإضافة أول منتج. الأمر لا يستغرق سوى دقيقة واحدة.",
    action: "إضافة منتج",
  },

  // Orders
  orders: {
    title: "لا توجد طلبات بعد",
    description: "عندما يقوم العملاء بتقديم طلبات، ستظهر هنا. شارك متجرك للبدء.",
    action: "تصفح المنتجات",
  },

  // Search
  search: {
    title: "لا توجد نتائج",
    description: "لم نتمكن من العثور على شيء يطابق بحثك. جرب كلمات مختلفة أو تصفح الفئات.",
    descriptionWithQuery: "لم نتمكن من العثور على \"{query}\". جرب كلمات مختلفة أو تصفح الفئات.",
    action: "مسح البحث",
  },

  // Cart
  cart: {
    title: "سلة التسوق فارغة",
    description: "اكتشف مجموعتنا وأضف المنتجات التي تحبها. سنحتفظ بها هنا بأمان.",
    action: "ابدأ التسوق",
  },

  // Favorites
  favorites: {
    title: "لا توجد مفضلات بعد",
    description: "اضغط على أيقونة القلب على المنتجات التي تحبها لحفظها هنا لاحقاً.",
    action: "استكشف المنتجات",
  },

  // Images
  images: {
    title: "لا توجد صور بعد",
    description: "ارفع صوراً لإضفاء الحياة على منتجاتك. الصور عالية الجودة تصنع كل الفرق.",
    action: "رفع صور",
  },

  // Documents
  documents: {
    title: "لا توجد مستندات",
    description: "المستندات التي تنشئها أو تستلمها ستظهر هنا.",
    action: "إنشاء مستند",
  },

  // Users
  users: {
    title: "لا يوجد مستخدمون بعد",
    description: "عندما يسجل العملاء، ستراهم هنا. شارك متجرك لتنمية جمهورك.",
    action: "دعوة مستخدمين",
  },

  // Analytics
  analytics: {
    title: "لا توجد بيانات بعد",
    description: "ستظهر التحليلات بمجرد حصول متجرك على بعض النشاط. تحقق قريباً!",
    action: "عرض لوحة التحكم",
  },

  // Messages
  messages: {
    title: "لا توجد رسائل",
    description: "عندما يتواصل العملاء، ستظهر رسائلهم هنا.",
    action: "بدء محادثة",
  },

  // Notifications
  notifications: {
    title: "لا توجد إشعارات جديدة!",
    description: "ليس لديك إشعارات جديدة. سنعلمك عندما يحدث شيء مهم.",
    action: "عرض الإعدادات",
  },

  // Inbox
  inbox: {
    title: "صندوق الوارد فارغ",
    description: "ستظهر العناصر الجديدة هنا عند وصولها.",
    action: "تحديث",
  },

  // Folder
  folder: {
    title: "هذا المجلد فارغ",
    description: "أضف ملفات أو أنشئ مجلدات فرعية لتنظيم المحتوى.",
    action: "إضافة محتوى",
  },

  // AI
  ai: {
    title: "كيف يمكنني مساعدتك؟",
    description: "أنا مساعدك الذكي. اسألني أي شيء عن إدارة متجرك أو منتجاتك أو طلباتك.",
    action: "بدء محادثة",
  },
} as const

export default emptyStates
