import Link from "next/link"
import { getTranslations } from "next-intl/server"
import type { ThemeComponentProps } from "@/types/theme"
import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface FooterColumn {
  titleKey: string
  links: { labelKey: string; href: string }[]
}

interface PaperFooterConfig {
  columns?: FooterColumn[]
  showNewsletter?: boolean
  copyrightKey?: string
  storeName?: string
}

/* ------------------------------------------------------------------ */
/*  Payment label component                                            */
/* ------------------------------------------------------------------ */

function PaymentLabel({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center border border-neutral-200 px-3 py-1.5 text-xs font-medium tracking-wide text-neutral-500 uppercase">
      {name}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export async function PaperFooter({
  config,
  locale,
}: ThemeComponentProps<PaperFooterConfig>) {
  const t = await getTranslations({ locale, namespace: "storefront" })
  const isAr = locale === "ar"

  const {
    columns = [
      {
        titleKey: "footer.shop",
        links: [
          { labelKey: "footer.links.newArrivals", href: `/${locale}/search` },
          { labelKey: "footer.links.bestSellers", href: `/${locale}/search` },
          { labelKey: "footer.links.collections", href: `/${locale}/search` },
        ],
      },
      {
        titleKey: "footer.help",
        links: [
          { labelKey: "footer.links.support", href: `/${locale}/settings` },
          { labelKey: "footer.links.shipping", href: `/${locale}/settings` },
          { labelKey: "footer.links.returns", href: `/${locale}/settings` },
        ],
      },
      {
        titleKey: "footer.company",
        links: [
          { labelKey: "footer.links.about", href: `/${locale}/settings` },
          { labelKey: "footer.links.careers", href: `/${locale}/settings` },
          { labelKey: "footer.links.contact", href: `/${locale}/settings` },
        ],
      },
    ],
    showNewsletter = true,
    copyrightKey = "footer.copyright",
    storeName,
  } = config

  const currentYear = new Date().getFullYear()
  const paymentMethods = ["Visa", "Mastercard", "Mada", "Apple Pay"]

  return (
    <footer className="border-t border-neutral-200 bg-white text-[var(--theme-foreground)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ---- Columns section ---- */}
        <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand column */}
          <div className="space-y-4">
            <div
              className="text-lg font-bold tracking-tight"
              style={{ fontFamily: "var(--theme-font-heading)" }}
            >
              {storeName || t("footer.brand")}
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-neutral-500 text-start">
              {t("footer.tagline")}
            </p>
          </div>

          {/* Link columns */}
          {columns.map((column) => (
            <nav key={column.titleKey} className="space-y-4">
              <h4
                className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--theme-foreground)]"
                style={{ fontFamily: "var(--theme-font-heading)" }}
              >
                {t(column.titleKey)}
              </h4>
              <ul className="space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.labelKey}>
                    <Link
                      href={link.href}
                      className={cn(
                        "text-sm text-neutral-500 transition-colors hover:text-[var(--theme-foreground)]",
                        "focus-visible:outline-none focus-visible:underline focus-visible:text-[var(--theme-primary)]"
                      )}
                    >
                      {t(link.labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* ---- Newsletter row ---- */}
        {showNewsletter && (
          <>
            <div className="h-px bg-neutral-200" />
            <div className="flex flex-col items-start gap-5 py-10 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <h4
                  className="text-sm font-semibold"
                  style={{ fontFamily: "var(--theme-font-heading)" }}
                >
                  {t("newsletter.title")}
                </h4>
                <p className="text-xs text-neutral-500">
                  {t("newsletter.subtitle")}
                </p>
              </div>
              <form className="flex w-full max-w-md items-center gap-0 sm:w-auto">
                <input
                  type="email"
                  placeholder={t("footer.emailPlaceholder")}
                  className={cn(
                    "h-11 flex-1 border border-neutral-300 border-e-0 px-4 text-sm",
                    "text-[var(--theme-foreground)] placeholder:text-neutral-400",
                    "outline-none transition-colors",
                    "focus:border-[var(--theme-primary)] focus:ring-1 focus:ring-[var(--theme-primary)]",
                    "bg-white"
                  )}
                  dir={isAr ? "rtl" : "ltr"}
                />
                <button
                  type="submit"
                  className={cn(
                    "h-11 shrink-0 px-6 text-sm font-semibold transition-all",
                    "bg-[var(--theme-primary)] text-white",
                    "hover:bg-[var(--theme-primary)]/90",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)] focus-visible:ring-offset-1"
                  )}
                >
                  {t("footer.subscribe")}
                </button>
              </form>
            </div>
          </>
        )}

        {/* ---- Bottom bar: copyright + payment ---- */}
        <div className="h-px bg-neutral-200" />
        <div className="flex flex-col items-center gap-4 py-6 sm:flex-row sm:justify-between">
          <p className="text-xs text-neutral-400">
            {storeName
              ? `\u00A9 ${currentYear} ${storeName}. All rights reserved.`
              : `\u00A9 ${t(copyrightKey)}`}
          </p>

          {/* Payment icons as text labels */}
          <div className="flex flex-wrap items-center gap-2">
            {paymentMethods.map((method) => (
              <PaymentLabel key={method} name={method} />
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
