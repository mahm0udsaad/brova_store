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

interface YnsFooterConfig {
  columns?: FooterColumn[]
  showNewsletter?: boolean
  copyrightKey?: string
  storeName?: string
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export async function YnsFooter({
  config,
  locale,
}: ThemeComponentProps<YnsFooterConfig>) {
  const t = await getTranslations({ locale, namespace: "storefront" })
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
        titleKey: "footer.company",
        links: [
          { labelKey: "footer.links.about", href: `/${locale}/settings` },
          { labelKey: "footer.links.careers", href: `/${locale}/settings` },
          { labelKey: "footer.links.contact", href: `/${locale}/settings` },
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
    ],
    showNewsletter = true,
    copyrightKey = "footer.copyright",
    storeName,
  } = config

  const currentYear = new Date().getFullYear()

  return (
    <footer
      className="bg-[var(--theme-primary)]/[0.03] text-[var(--theme-foreground)]"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* ---- Top section: columns ---- */}
        <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand column */}
          <div className="space-y-4">
            <div className="text-lg font-bold tracking-tight">
              {storeName || t("footer.brand")}
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-neutral-500">
              {t("footer.tagline")}
            </p>
          </div>

          {/* Link columns */}
          {columns.map((column) => (
            <nav key={column.titleKey} className="space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-400">
                {t(column.titleKey)}
              </h4>
              <ul className="space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.labelKey}>
                    <Link
                      href={link.href}
                      className="text-sm text-neutral-500 transition-colors hover:text-[var(--theme-foreground)]"
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
            <div className="h-px bg-neutral-200/60" />
            <div className="flex flex-col items-start gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <h4 className="text-sm font-semibold">
                  {t("newsletter.title")}
                </h4>
                <p className="text-xs text-neutral-500">
                  {t("newsletter.subtitle")}
                </p>
              </div>
              <form className="flex w-full max-w-sm items-center gap-2 sm:w-auto">
                <input
                  type="email"
                  placeholder={t("footer.emailPlaceholder")}
                  className={cn(
                    "h-11 flex-1 rounded-full border-0 bg-white px-5 text-sm shadow-sm",
                    "text-[var(--theme-foreground)] placeholder:text-neutral-400",
                    "outline-none ring-1 ring-neutral-200 transition-shadow",
                    "focus:ring-2 focus:ring-[var(--theme-primary)]/40"
                  )}
                />
                <button
                  type="submit"
                  className={cn(
                    "h-11 shrink-0 rounded-full px-6 text-sm font-medium transition-all",
                    "bg-[var(--theme-primary)] text-white",
                    "hover:bg-[var(--theme-primary)]/90 hover:shadow-md"
                  )}
                >
                  {t("footer.subscribe")}
                </button>
              </form>
            </div>
          </>
        )}

        {/* ---- Bottom bar ---- */}
        <div className="h-px bg-neutral-200/60" />
        <div className="flex flex-col items-center gap-2 py-6 sm:flex-row sm:justify-between">
          <p className="text-xs text-neutral-400">
            {storeName
              ? `\u00A9 ${currentYear} ${storeName}. All rights reserved.`
              : `\u00A9 ${t(copyrightKey)}`}
          </p>
          <p className="text-xs text-neutral-400">
            Powered by{" "}
            <span className="font-medium text-[var(--theme-primary)]">
              Brova
            </span>
          </p>
        </div>
      </div>
    </footer>
  )
}
