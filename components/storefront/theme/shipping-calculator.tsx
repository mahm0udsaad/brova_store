import { getTranslations } from "next-intl/server"
import type { ThemeComponentProps } from "@/types/theme"
import { cn } from "@/lib/utils"
import { Truck, Clock, MapPin } from "lucide-react"

interface ShippingRegion {
  id: string
  name: string
  name_ar?: string
  cost: number
  deliveryDays: string
}

interface ShippingCalculatorConfig {
  regions?: ShippingRegion[]
  freeShippingThreshold?: number
  currency?: string
}

export async function ShippingCalculator({
  config,
  locale,
}: ThemeComponentProps<ShippingCalculatorConfig>) {
  const t = await getTranslations({ locale, namespace: "storefront" })
  const {
    regions = [],
    freeShippingThreshold,
    currency = "SAR",
  } = config

  const isAr = locale === "ar"

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat(isAr ? "ar-SA" : "en-SA", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)

  return (
    <section className="bg-[var(--theme-background)] py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 text-start">
          <Truck
            className="h-6 w-6 shrink-0 text-[var(--theme-primary)]"
            strokeWidth={1.5}
          />
          <h2 className="text-2xl font-semibold text-[var(--theme-foreground)]">
            {isAr ? "حاسبة الشحن" : "Shipping Estimates"}
          </h2>
        </div>

        {freeShippingThreshold != null && (
          <div
            className={cn(
              "mt-4 rounded-2xl border border-[var(--theme-primary)]/20 bg-[var(--theme-primary)]/5 px-5 py-3 text-sm text-[var(--theme-primary)]",
              "flex items-center gap-2 text-start"
            )}
          >
            <Truck className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            <span>
              {isAr
                ? `شحن مجاني للطلبات التي تتجاوز ${formatCurrency(freeShippingThreshold)}`
                : `Free shipping on orders over ${formatCurrency(freeShippingThreshold)}`}
            </span>
          </div>
        )}

        {regions.length > 0 ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {regions.map((region) => (
              <article
                key={region.id}
                className="rounded-2xl border border-[var(--theme-border)] bg-white p-6 shadow-sm space-y-4"
              >
                <div className="flex items-center gap-2 text-start">
                  <MapPin
                    className="h-4 w-4 shrink-0 text-[var(--theme-primary)]"
                    strokeWidth={1.5}
                  />
                  <span className="text-sm font-semibold text-[var(--theme-foreground)]">
                    {isAr && region.name_ar ? region.name_ar : region.name}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs text-[var(--theme-muted)] text-start">
                    {isAr ? "تكلفة الشحن" : "Shipping cost"}
                  </span>
                  <span
                    className="text-sm font-semibold text-[var(--theme-foreground)]"
                    dir={isAr ? "rtl" : "ltr"}
                  >
                    {region.cost === 0
                      ? isAr
                        ? "مجاني"
                        : "Free"
                      : formatCurrency(region.cost)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs text-[var(--theme-muted)] text-start">
                    {isAr ? "مدة التوصيل" : "Estimated delivery"}
                  </span>
                  <div className="flex items-center gap-1.5 text-sm text-[var(--theme-foreground)]">
                    <Clock
                      className="h-3.5 w-3.5 shrink-0 text-[var(--theme-muted)]"
                      strokeWidth={1.5}
                    />
                    <span>{region.deliveryDays}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-[var(--theme-border)] bg-white p-8 text-center">
            <MapPin
              className="mx-auto h-8 w-8 text-[var(--theme-muted)]"
              strokeWidth={1.5}
            />
            <p className="mt-3 text-sm text-[var(--theme-muted)]">
              {isAr
                ? "لم يتم تحديد مناطق الشحن بعد. يرجى التواصل معنا لمزيد من المعلومات."
                : "No shipping regions configured yet. Please contact us for shipping details."}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
