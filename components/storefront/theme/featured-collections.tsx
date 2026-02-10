import Image from "next/image"
import { getTranslations } from "next-intl/server"
import type { ThemeComponentProps } from "@/types/theme"

interface CollectionItem {
  id: string
  titleKey: string
  descriptionKey: string
  imageUrl?: string
}

interface FeaturedCollectionsConfig {
  titleKey?: string
  subtitleKey?: string
  items?: CollectionItem[]
}

export async function FeaturedCollections({
  config,
  locale,
}: ThemeComponentProps<FeaturedCollectionsConfig>) {
  const t = await getTranslations({ locale, namespace: "storefront" })
  const {
    titleKey = "collections.title",
    subtitleKey = "collections.subtitle",
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
              className="group relative overflow-hidden rounded-2xl border border-[var(--theme-border)] bg-white"
            >
              <div className="relative h-56 w-full bg-neutral-100">
                {item.imageUrl ? (
                  <Image src={item.imageUrl} alt={t(item.titleKey)} fill className="object-cover" />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>
              <div className="relative p-5">
                <h3 className="text-base font-semibold text-start">{t(item.titleKey)}</h3>
                <p className="mt-2 text-sm text-[var(--theme-muted)] text-start">
                  {t(item.descriptionKey)}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
