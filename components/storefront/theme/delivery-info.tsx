import { getTranslations } from "next-intl/server"
import type { ThemeComponentProps } from "@/types/theme"

interface DeliveryZone {
  city: string
  city_ar: string
  delivery_time: string
  delivery_time_ar: string
  cost: number
}

interface DeliveryInfoConfig {
  titleKey?: string
  zones?: DeliveryZone[]
  free_shipping_threshold?: number
  same_day_available?: boolean
  same_day_cities?: string[]
  currency?: string
}

const defaultZones: DeliveryZone[] = [
  { city: "Riyadh", city_ar: "الرياض", delivery_time: "Same day", delivery_time_ar: "نفس اليوم", cost: 0 },
  { city: "Jeddah", city_ar: "جدة", delivery_time: "1-2 days", delivery_time_ar: "١-٢ يوم", cost: 25 },
  { city: "Dammam", city_ar: "الدمام", delivery_time: "2-3 days", delivery_time_ar: "٢-٣ أيام", cost: 30 },
]

export async function DeliveryInfo({
  config,
  locale,
}: ThemeComponentProps<DeliveryInfoConfig>) {
  const t = await getTranslations({ locale, namespace: "storefront" })
  const {
    titleKey = "delivery.title",
    zones = defaultZones,
    free_shipping_threshold,
    same_day_available = false,
    currency = "SAR",
  } = config
  const isAr = locale === "ar"

  return (
    <section className="bg-[var(--theme-background)] py-10">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h2 className="mb-6 text-center text-xl font-semibold text-[var(--theme-foreground)]">
          {t(titleKey)}
        </h2>

        {free_shipping_threshold && (
          <div className="mb-6 rounded-xl bg-green-50 border border-green-200 p-4 text-center">
            <p className="text-sm font-medium text-green-800">
              {isAr
                ? `شحن مجاني للطلبات فوق ${free_shipping_threshold} ${currency === "SAR" ? "ر.س" : currency}`
                : `Free shipping on orders over ${currency} ${free_shipping_threshold}`}
            </p>
          </div>
        )}

        {same_day_available && (
          <div className="mb-6 flex items-center justify-center gap-2">
            <span className="inline-flex items-center rounded-full bg-[var(--theme-primary)] px-3 py-1 text-xs font-semibold text-white">
              {isAr ? "توصيل في نفس اليوم" : "Same-Day Delivery"}
            </span>
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-[var(--theme-border)]">
          <table className="w-full text-sm" dir={isAr ? "rtl" : "ltr"}>
            <thead>
              <tr className="border-b border-[var(--theme-border)] bg-[var(--theme-background)]">
                <th className="px-4 py-3 text-start font-medium text-[var(--theme-muted)]">
                  {isAr ? "المدينة" : "City"}
                </th>
                <th className="px-4 py-3 text-start font-medium text-[var(--theme-muted)]">
                  {isAr ? "مدة التوصيل" : "Delivery Time"}
                </th>
                <th className="px-4 py-3 text-start font-medium text-[var(--theme-muted)]">
                  {isAr ? "التكلفة" : "Cost"}
                </th>
              </tr>
            </thead>
            <tbody>
              {zones.map((zone, i) => (
                <tr key={i} className="border-b border-[var(--theme-border)] last:border-0">
                  <td className="px-4 py-3 font-medium text-[var(--theme-foreground)]">
                    {isAr ? zone.city_ar : zone.city}
                  </td>
                  <td className="px-4 py-3 text-[var(--theme-muted)]">
                    {isAr ? zone.delivery_time_ar : zone.delivery_time}
                  </td>
                  <td className="px-4 py-3 text-[var(--theme-foreground)]">
                    {zone.cost === 0
                      ? (isAr ? "مجاني" : "Free")
                      : isAr
                        ? `${zone.cost} ر.س`
                        : `${currency} ${zone.cost}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
