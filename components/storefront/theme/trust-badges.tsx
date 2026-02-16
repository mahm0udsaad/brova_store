import { getTranslations } from "next-intl/server"
import type { ThemeComponentProps } from "@/types/theme"

type BadgeType = "mada" | "visa" | "mastercard" | "apple_pay" | "tamara" | "tabby" | "cod" | "stc_pay"

interface TrustBadgesConfig {
  titleKey?: string
  badges?: Array<{ type: BadgeType; label?: string }>
}

const defaultBadges: Array<{ type: BadgeType; label?: string }> = [
  { type: "mada" },
  { type: "visa" },
  { type: "mastercard" },
  { type: "apple_pay" },
  { type: "tamara" },
  { type: "cod" },
]

const badgeLabels: Record<BadgeType, { en: string; ar: string }> = {
  mada: { en: "mada", ar: "مدى" },
  visa: { en: "Visa", ar: "فيزا" },
  mastercard: { en: "Mastercard", ar: "ماستركارد" },
  apple_pay: { en: "Apple Pay", ar: "Apple Pay" },
  tamara: { en: "Tamara", ar: "تمارا" },
  tabby: { en: "tabby", ar: "تابي" },
  cod: { en: "Cash on Delivery", ar: "الدفع عند الاستلام" },
  stc_pay: { en: "STC Pay", ar: "STC Pay" },
}

const badgeColors: Record<BadgeType, string> = {
  mada: "#4C3494",
  visa: "#1A1F71",
  mastercard: "#EB001B",
  apple_pay: "#000000",
  tamara: "#3DCBAB",
  tabby: "#3BFFC0",
  cod: "#6B7280",
  stc_pay: "#4F008C",
}

export async function TrustBadges({
  config,
  locale,
}: ThemeComponentProps<TrustBadgesConfig>) {
  const t = await getTranslations({ locale, namespace: "storefront" })
  const { titleKey = "trust.title", badges = defaultBadges } = config
  const isAr = locale === "ar"

  return (
    <section className="border-y border-[var(--theme-border)] bg-[var(--theme-background)] py-6">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <p className="mb-4 text-center text-xs font-medium uppercase tracking-widest text-[var(--theme-muted)]">
          {t(titleKey)}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          {badges.map((badge, i) => {
            const label = badge.label || badgeLabels[badge.type]?.[isAr ? "ar" : "en"] || badge.type
            const color = badgeColors[badge.type] || "#6B7280"
            return (
              <div
                key={`${badge.type}-${i}`}
                className="flex items-center gap-2 rounded-lg border border-[var(--theme-border)] bg-white px-3 py-2"
              >
                <div
                  className="flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold text-white"
                  style={{ backgroundColor: color }}
                >
                  {badge.type.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-medium text-[var(--theme-foreground)]">
                  {label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
