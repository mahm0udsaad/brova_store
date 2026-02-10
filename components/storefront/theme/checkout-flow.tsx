import { getTranslations } from "next-intl/server"
import type { ThemeComponentProps } from "@/types/theme"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { User, MapPin, CreditCard, CheckCircle } from "lucide-react"

interface CheckoutFlowConfig {
  currentStep?: number
  steps?: Array<{ label: string; labelKey?: string }>
  orderSummary?: {
    subtotal: number
    shipping: number
    tax: number
    total: number
  }
  currency?: string
}

const STEP_ICONS = [User, MapPin, CreditCard, CheckCircle] as const

function formatCurrency(amount: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SA", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export async function CheckoutFlow({
  config,
  locale,
}: ThemeComponentProps<CheckoutFlowConfig>) {
  const t = await getTranslations({ locale, namespace: "storefront" })

  const {
    currentStep = 1,
    steps,
    orderSummary = { subtotal: 0, shipping: 0, tax: 0, total: 0 },
    currency = "SAR",
  } = config

  const defaultSteps = [
    { label: t("checkout.steps.customerInfo"), labelKey: "checkout.steps.customerInfo" },
    { label: t("checkout.steps.shipping"), labelKey: "checkout.steps.shipping" },
    { label: t("checkout.steps.payment"), labelKey: "checkout.steps.payment" },
    { label: t("checkout.steps.review"), labelKey: "checkout.steps.review" },
  ]

  const resolvedSteps = steps && steps.length > 0 ? steps : defaultSteps

  const isLastStep = currentStep >= resolvedSteps.length
  const fmt = (amount: number) => formatCurrency(amount, currency, locale)

  return (
    <section className="bg-[var(--theme-background)] py-12 text-[var(--theme-foreground)]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* ── Step indicator bar ── */}
        <nav aria-label={t("checkout.stepsLabel")} className="mb-10">
          <ol className="flex items-center justify-between gap-2">
            {resolvedSteps.map((step, index) => {
              const stepNumber = index + 1
              const Icon = STEP_ICONS[index] ?? CheckCircle
              const isActive = stepNumber === currentStep
              const isCompleted = stepNumber < currentStep

              return (
                <li key={index} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex w-full items-center">
                    {/* Connector line before */}
                    {index > 0 && (
                      <div
                        className={cn(
                          "h-0.5 flex-1",
                          isCompleted || isActive
                            ? "bg-[var(--theme-primary)]"
                            : "bg-[var(--theme-border)]"
                        )}
                      />
                    )}

                    {/* Step circle */}
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                        isCompleted &&
                          "border-[var(--theme-primary)] bg-[var(--theme-primary)] text-white",
                        isActive &&
                          "border-[var(--theme-primary)] bg-[var(--theme-background)] text-[var(--theme-primary)]",
                        !isCompleted &&
                          !isActive &&
                          "border-[var(--theme-border)] bg-[var(--theme-background)] text-[var(--theme-muted)]"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    {/* Connector line after */}
                    {index < resolvedSteps.length - 1 && (
                      <div
                        className={cn(
                          "h-0.5 flex-1",
                          isCompleted
                            ? "bg-[var(--theme-primary)]"
                            : "bg-[var(--theme-border)]"
                        )}
                      />
                    )}
                  </div>

                  <span
                    className={cn(
                      "text-xs font-medium text-center",
                      isActive
                        ? "text-[var(--theme-primary)]"
                        : isCompleted
                          ? "text-[var(--theme-foreground)]"
                          : "text-[var(--theme-muted)]"
                    )}
                  >
                    {step.labelKey ? t(step.labelKey) : step.label}
                  </span>
                </li>
              )
            })}
          </ol>
        </nav>

        {/* ── Main content grid ── */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Form area — 2 columns */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-[var(--theme-border)] bg-white p-6 sm:p-8">
              {/* Step 1 — Customer Info */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold font-[var(--theme-font-heading)] text-start">
                    {t("checkout.steps.customerInfo")}
                  </h2>
                  <div className="grid gap-5 sm:grid-cols-2">
                    {/* Name */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-start">
                        {t("checkout.fields.name")}
                      </label>
                      <div className="h-11 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-background)] px-4" />
                    </div>
                    {/* Email */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-start">
                        {t("checkout.fields.email")}
                      </label>
                      <div className="h-11 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-background)] px-4" />
                    </div>
                    {/* Phone */}
                    <div className="space-y-2 sm:col-span-2">
                      <label className="block text-sm font-medium text-start">
                        {t("checkout.fields.phone")}
                      </label>
                      <div className="h-11 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-background)] px-4" />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2 — Shipping */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold font-[var(--theme-font-heading)] text-start">
                    {t("checkout.steps.shipping")}
                  </h2>
                  <div className="grid gap-5 sm:grid-cols-2">
                    {/* Address */}
                    <div className="space-y-2 sm:col-span-2">
                      <label className="block text-sm font-medium text-start">
                        {t("checkout.fields.address")}
                      </label>
                      <div className="h-11 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-background)] px-4" />
                    </div>
                    {/* City */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-start">
                        {t("checkout.fields.city")}
                      </label>
                      <div className="h-11 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-background)] px-4" />
                    </div>
                    {/* Region */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-start">
                        {t("checkout.fields.region")}
                      </label>
                      <div className="h-11 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-background)] px-4" />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3 — Payment */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold font-[var(--theme-font-heading)] text-start">
                    {t("checkout.steps.payment")}
                  </h2>
                  <div className="space-y-4">
                    {/* Card option */}
                    <div
                      className={cn(
                        "flex items-center gap-4 rounded-xl border-2 p-4 cursor-pointer",
                        "border-[var(--theme-primary)] bg-[var(--theme-primary)]/5"
                      )}
                    >
                      <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-[var(--theme-primary)]">
                        <div className="h-2.5 w-2.5 rounded-full bg-[var(--theme-primary)]" />
                      </div>
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-[var(--theme-primary)]" />
                        <span className="text-sm font-medium">
                          {t("checkout.payment.card")}
                        </span>
                      </div>
                    </div>
                    {/* Cash on delivery option */}
                    <div
                      className={cn(
                        "flex items-center gap-4 rounded-xl border-2 p-4 cursor-pointer",
                        "border-[var(--theme-border)]"
                      )}
                    >
                      <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-[var(--theme-muted)]" />
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-[var(--theme-muted)]" />
                        <span className="text-sm font-medium">
                          {t("checkout.payment.cod")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4 — Review */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold font-[var(--theme-font-heading)] text-start">
                    {t("checkout.steps.review")}
                  </h2>
                  <div className="space-y-4">
                    {/* Customer info summary */}
                    <div className="rounded-xl border border-[var(--theme-border)] p-4 space-y-2">
                      <h3 className="text-sm font-semibold text-start">
                        {t("checkout.review.customerDetails")}
                      </h3>
                      <div className="grid gap-1 text-sm text-[var(--theme-muted)]">
                        <p>{t("checkout.fields.name")}: ---</p>
                        <p>{t("checkout.fields.email")}: ---</p>
                        <p>{t("checkout.fields.phone")}: ---</p>
                      </div>
                    </div>
                    {/* Shipping summary */}
                    <div className="rounded-xl border border-[var(--theme-border)] p-4 space-y-2">
                      <h3 className="text-sm font-semibold text-start">
                        {t("checkout.review.shippingDetails")}
                      </h3>
                      <div className="grid gap-1 text-sm text-[var(--theme-muted)]">
                        <p>{t("checkout.fields.address")}: ---</p>
                        <p>{t("checkout.fields.city")}: ---</p>
                        <p>{t("checkout.fields.region")}: ---</p>
                      </div>
                    </div>
                    {/* Payment summary */}
                    <div className="rounded-xl border border-[var(--theme-border)] p-4 space-y-2">
                      <h3 className="text-sm font-semibold text-start">
                        {t("checkout.review.paymentMethod")}
                      </h3>
                      <p className="text-sm text-[var(--theme-muted)]">---</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Navigation buttons ── */}
              <div className="mt-8 flex items-center justify-between gap-4">
                {currentStep > 1 ? (
                  <Button
                    variant="outline"
                    className="rounded-full px-6 py-5 border-[var(--theme-border)] text-[var(--theme-foreground)]"
                  >
                    {t("checkout.nav.back")}
                  </Button>
                ) : (
                  <div />
                )}
                <Button
                  className="rounded-full px-6 py-5 bg-[var(--theme-primary)] text-white hover:bg-[var(--theme-primary)]/90"
                >
                  {isLastStep
                    ? t("checkout.nav.placeOrder")
                    : t("checkout.nav.continue")}
                </Button>
              </div>
            </div>
          </div>

          {/* ── Order summary sidebar ── */}
          <aside className="lg:col-span-1">
            <div className="sticky top-6 rounded-2xl border border-[var(--theme-border)] bg-white p-6 space-y-5">
              <h3 className="text-lg font-semibold font-[var(--theme-font-heading)] text-start">
                {t("checkout.summary.title")}
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--theme-muted)]">
                    {t("checkout.summary.subtotal")}
                  </span>
                  <span>{fmt(orderSummary.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--theme-muted)]">
                    {t("checkout.summary.shipping")}
                  </span>
                  <span>{fmt(orderSummary.shipping)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--theme-muted)]">
                    {t("checkout.summary.tax")}
                  </span>
                  <span>{fmt(orderSummary.tax)}</span>
                </div>
                <div className="h-px bg-[var(--theme-border)]" />
                <div className="flex items-center justify-between text-base font-semibold">
                  <span>{t("checkout.summary.total")}</span>
                  <span className="text-[var(--theme-primary)]">
                    {fmt(orderSummary.total)}
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
