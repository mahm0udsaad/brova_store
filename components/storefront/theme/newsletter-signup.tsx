import { getTranslations } from "next-intl/server"
import type { ThemeComponentProps } from "@/types/theme"

interface NewsletterSignupConfig {
  titleKey?: string
  subtitleKey?: string
  ctaKey?: string
  placeholderKey?: string
}

export async function NewsletterSignup({
  config,
  locale,
}: ThemeComponentProps<NewsletterSignupConfig>) {
  const t = await getTranslations({ locale, namespace: "storefront" })
  const {
    titleKey = "newsletter.title",
    subtitleKey = "newsletter.subtitle",
    ctaKey = "newsletter.cta",
    placeholderKey = "newsletter.placeholder",
  } = config

  return (
    <section className="bg-[var(--theme-background)] py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl font-semibold">{t(titleKey)}</h2>
        <p className="mt-2 text-sm text-[var(--theme-muted)]">{t(subtitleKey)}</p>
        <form className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
          <input
            type="email"
            placeholder={t(placeholderKey)}
            className="h-11 w-full rounded-full border border-[var(--theme-border)] bg-transparent px-4 text-sm text-[var(--theme-foreground)] placeholder:text-[var(--theme-muted)] sm:w-80"
          />
          <button className="h-11 rounded-full bg-[var(--theme-primary)] px-6 text-sm font-semibold text-white">
            {t(ctaKey)}
          </button>
        </form>
      </div>
    </section>
  )
}
