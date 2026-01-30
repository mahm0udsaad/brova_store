/**
 * Onboarding Translations - Arabic
 * 
 * Conversational, welcoming tone that guides without pressure.
 */

const onboarding = {
  // Navigation
  next: "متابعة",
  skip: "تخطي",
  skipForNow: "سأفعل هذا لاحقاً",
  back: "رجوع",

  // Slide 1: Welcome
  intro: {
    title: "مرحباً بك في بروفا",
    description: "اختبر أزياء الشارع العصرية بطريقة جديدة كلياً. نحن هنا لمساعدتك في العثور على المقاس المثالي.",
  },

  // Slide 2: AI Try-On
  tryOn: {
    title: "التجربة بالذكاء الاصطناعي",
    description: "شاهد كيف ستبدو الملابس عليك قبل الشراء. تقنيتنا تعرض المقاس بدقة على جسمك.",
  },

  // Slide 3: Measurements
  measure: {
    title: "المقاسات الذكية",
    description: "احصل على توصيات مقاسات مخصصة بناءً على قياساتك الدقيقة. لا مزيد من التخمين.",
  },

  // Slide 4: CTA
  prompt: {
    title: "مستعد للبدء؟",
    description: "لنقترح أفضل المنتجات لك، سنحتاج قياساتك. الأمر لا يستغرق سوى دقيقة واحدة.",
    cta: "إعداد مقاساتي",
  },
} as const

export default onboarding
