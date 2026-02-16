import { getTranslations } from "next-intl/server"
import type { ThemeComponentProps } from "@/types/theme"

type Occasion = "ramadan" | "eid_fitr" | "eid_adha" | "national_day" | "white_friday" | "back_to_school" | "custom"

interface OccasionBannerConfig {
  occasion?: Occasion
  titleKey?: string
  subtitleKey?: string
  title?: string
  title_ar?: string
  subtitle?: string
  subtitle_ar?: string
  background_color?: string
  text_color?: string
  image_url?: string
  cta_text?: string
  cta_text_ar?: string
  cta_link?: string
  starts_at?: string
  ends_at?: string
}

const occasionDefaults: Record<Occasion, {
  bg: string
  text: string
  titleEn: string
  titleAr: string
  subtitleEn: string
  subtitleAr: string
}> = {
  ramadan: {
    bg: "linear-gradient(135deg, #1a472a 0%, #2d6a4f 50%, #40916c 100%)",
    text: "#ffffff",
    titleEn: "Ramadan Kareem",
    titleAr: "رمضان كريم",
    subtitleEn: "Special offers this holy month",
    subtitleAr: "عروض مميزة بمناسبة الشهر الفضيل",
  },
  eid_fitr: {
    bg: "linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)",
    text: "#ffffff",
    titleEn: "Eid Mubarak",
    titleAr: "عيد مبارك",
    subtitleEn: "Celebrate with our Eid collection",
    subtitleAr: "احتفل مع تشكيلة العيد",
  },
  eid_adha: {
    bg: "linear-gradient(135deg, #b45309 0%, #d97706 100%)",
    text: "#ffffff",
    titleEn: "Eid Al-Adha Mubarak",
    titleAr: "عيد أضحى مبارك",
    subtitleEn: "Shop our Eid Al-Adha specials",
    subtitleAr: "تسوق عروض عيد الأضحى",
  },
  national_day: {
    bg: "linear-gradient(135deg, #15803d 0%, #22c55e 100%)",
    text: "#ffffff",
    titleEn: "Saudi National Day",
    titleAr: "اليوم الوطني السعودي",
    subtitleEn: "Proud to be Saudi — exclusive deals",
    subtitleAr: "فخر سعودي — عروض حصرية",
  },
  white_friday: {
    bg: "linear-gradient(135deg, #000000 0%, #1f2937 100%)",
    text: "#ffffff",
    titleEn: "White Friday Deals",
    titleAr: "عروض الجمعة البيضاء",
    subtitleEn: "Biggest sale of the year",
    subtitleAr: "أكبر تخفيضات السنة",
  },
  back_to_school: {
    bg: "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)",
    text: "#ffffff",
    titleEn: "Back to School",
    titleAr: "العودة للمدارس",
    subtitleEn: "Get ready for the new school year",
    subtitleAr: "استعد للعام الدراسي الجديد",
  },
  custom: {
    bg: "linear-gradient(135deg, #111827 0%, #374151 100%)",
    text: "#ffffff",
    titleEn: "Special Offer",
    titleAr: "عرض خاص",
    subtitleEn: "Limited time only",
    subtitleAr: "لفترة محدودة",
  },
}

export async function OccasionBanner({
  config,
  locale,
}: ThemeComponentProps<OccasionBannerConfig>) {
  const t = await getTranslations({ locale, namespace: "storefront" })
  const isAr = locale === "ar"
  const defaults = occasionDefaults[config.occasion || "custom"] || occasionDefaults.custom

  const title = isAr
    ? (config.title_ar || defaults.titleAr)
    : (config.title || defaults.titleEn)
  const subtitle = isAr
    ? (config.subtitle_ar || defaults.subtitleAr)
    : (config.subtitle || defaults.subtitleEn)
  const ctaText = isAr
    ? (config.cta_text_ar || "تسوق الآن")
    : (config.cta_text || "Shop Now")
  const bgStyle = config.background_color || defaults.bg
  const textColor = config.text_color || defaults.text

  return (
    <section
      className="relative overflow-hidden py-10"
      style={{
        background: bgStyle,
        color: textColor,
      }}
    >
      {config.image_url && (
        <img
          src={config.image_url}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-30"
        />
      )}
      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold sm:text-4xl">{title}</h2>
        <p className="mt-3 text-lg opacity-90">{subtitle}</p>
        {config.cta_link && (
          <a
            href={config.cta_link}
            className="mt-6 inline-block rounded-full border-2 border-current px-8 py-3 text-sm font-semibold transition-colors hover:bg-white/20"
          >
            {ctaText}
          </a>
        )}
      </div>
    </section>
  )
}
