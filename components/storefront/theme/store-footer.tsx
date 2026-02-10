import { getTranslations } from "next-intl/server"
import type { ThemeComponentProps } from "@/types/theme"
import Link from "next/link"

interface FooterColumn {
  titleKey: string
  links: { labelKey: string; href: string }[]
}

interface StoreFooterConfig {
  columns?: FooterColumn[]
  showNewsletter?: boolean
  copyrightKey?: string
}

export async function StoreFooter({
  config,
  locale,
}: ThemeComponentProps<StoreFooterConfig>) {
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
  } = config

  return (
    <footer className="border-t border-[var(--theme-border)] bg-[var(--theme-background)]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-10 lg:grid-cols-4">
          <div className="space-y-4">
            <div className="text-lg font-semibold">{t("footer.brand")}</div>
            <p className="text-sm text-[var(--theme-muted)]">{t("footer.tagline")}</p>
            {showNewsletter ? (
              <form className="flex w-full max-w-xs items-center gap-2">
                <input
                  className="h-10 w-full rounded-full border border-[var(--theme-border)] bg-transparent px-4 text-sm text-[var(--theme-foreground)] placeholder:text-[var(--theme-muted)]"
                  placeholder={t("footer.emailPlaceholder")}
                  type="email"
                />
                <button className="h-10 rounded-full bg-[var(--theme-primary)] px-4 text-sm font-medium text-white">
                  {t("footer.subscribe")}
                </button>
              </form>
            ) : null}
          </div>

          {columns.map((column) => (
            <div key={column.titleKey} className="space-y-3">
              <div className="text-sm font-semibold">{t(column.titleKey)}</div>
              <ul className="space-y-2 text-sm text-[var(--theme-muted)]">
                {column.links.map((link) => (
                  <li key={link.labelKey}>
                    <Link className="hover:text-[var(--theme-foreground)]" href={link.href}>
                      {t(link.labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-[var(--theme-border)] pt-6 text-xs text-[var(--theme-muted)]">
          {t(copyrightKey)}
        </div>
      </div>
    </footer>
  )
}
