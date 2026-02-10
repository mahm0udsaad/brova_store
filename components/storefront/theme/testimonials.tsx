import { getTranslations } from "next-intl/server"
import type { ThemeComponentProps } from "@/types/theme"

interface TestimonialItem {
  id: string
  quoteKey: string
  nameKey: string
  roleKey?: string
}

interface TestimonialsConfig {
  titleKey?: string
  subtitleKey?: string
  items?: TestimonialItem[]
}

export async function Testimonials({
  config,
  locale,
}: ThemeComponentProps<TestimonialsConfig>) {
  const t = await getTranslations({ locale, namespace: "storefront" })
  const {
    titleKey = "testimonials.title",
    subtitleKey = "testimonials.subtitle",
    items = [],
  } = config

  return (
    <section className="bg-[var(--theme-background)] py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-start">{t(titleKey)}</h2>
          <p className="text-sm text-[var(--theme-muted)]">{t(subtitleKey)}</p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-[var(--theme-border)] bg-white p-6 shadow-sm"
            >
              <p className="text-sm text-[var(--theme-foreground)] text-start">
                “{t(item.quoteKey)}”
              </p>
              <div className="mt-4 text-sm font-semibold text-start">
                {t(item.nameKey)}
              </div>
              {item.roleKey ? (
                <div className="text-xs text-[var(--theme-muted)] text-start">
                  {t(item.roleKey)}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
