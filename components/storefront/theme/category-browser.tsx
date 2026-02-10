import Image from "next/image"
import Link from "next/link"
import { getTranslations } from "next-intl/server"
import type { ThemeComponentProps } from "@/types/theme"
import { cn } from "@/lib/utils"

interface CategoryItem {
  id: string
  name: string
  name_ar?: string
  imageUrl?: string
  productCount?: number
  slug?: string
}

interface CategoryBrowserConfig {
  titleKey?: string
  categories?: CategoryItem[]
  columns?: 2 | 3 | 4
  layout?: "grid" | "list"
}

function CategoryCard({
  category,
  locale,
}: {
  category: CategoryItem
  locale: string
}) {
  const displayName =
    locale === "ar" && category.name_ar ? category.name_ar : category.name
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
  const href = `/${locale}/search?category=${category.slug ?? category.id}`

  return (
    <Link
      href={href}
      className="group rounded-2xl border border-[var(--theme-border)] bg-white p-3 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
    >
      <div className="relative aspect-square overflow-hidden rounded-xl bg-neutral-100">
        {category.imageUrl ? (
          <Image
            src={category.imageUrl}
            alt={displayName}
            fill
            className="object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[var(--theme-primary)]/10">
            <span className="text-2xl font-bold text-[var(--theme-primary)]">
              {initials}
            </span>
          </div>
        )}
        {typeof category.productCount === "number" ? (
          <span className="absolute end-3 top-3 rounded-full bg-[var(--theme-primary)] px-3 py-1 text-xs font-semibold text-white">
            {category.productCount}
          </span>
        ) : null}
      </div>
      <div className="mt-3 ps-1 pe-1">
        <h3 className="text-sm font-medium text-start text-[var(--theme-foreground)]">
          {displayName}
        </h3>
      </div>
    </Link>
  )
}

function CategoryListItem({
  category,
  locale,
}: {
  category: CategoryItem
  locale: string
}) {
  const displayName =
    locale === "ar" && category.name_ar ? category.name_ar : category.name
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
  const href = `/${locale}/search?category=${category.slug ?? category.id}`

  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-2xl border border-[var(--theme-border)] bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
        {category.imageUrl ? (
          <Image
            src={category.imageUrl}
            alt={displayName}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[var(--theme-primary)]/10">
            <span className="text-base font-bold text-[var(--theme-primary)]">
              {initials}
            </span>
          </div>
        )}
      </div>
      <div className="flex-1 text-start">
        <h3 className="text-sm font-medium text-[var(--theme-foreground)]">
          {displayName}
        </h3>
      </div>
      {typeof category.productCount === "number" ? (
        <span className="me-1 rounded-full bg-[var(--theme-primary)] px-3 py-1 text-xs font-semibold text-white">
          {category.productCount}
        </span>
      ) : null}
    </Link>
  )
}

export async function CategoryBrowser({
  config,
  locale,
}: ThemeComponentProps<CategoryBrowserConfig>) {
  const t = await getTranslations({ locale, namespace: "storefront" })
  const {
    titleKey = "categories.title",
    categories = [],
    columns = 3,
    layout = "grid",
  } = config

  const gridCols =
    columns === 2
      ? "grid-cols-2"
      : columns === 3
      ? "grid-cols-2 md:grid-cols-3"
      : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"

  return (
    <section className="bg-[var(--theme-background)] py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-start text-[var(--theme-foreground)]">
            {t(titleKey)}
          </h2>
        </div>

        {categories.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-[var(--theme-border)] p-8 text-center text-sm text-[var(--theme-muted)]">
            {t("categories.empty")}
          </div>
        ) : layout === "list" ? (
          <div className="mt-8 flex flex-col gap-3">
            {categories.map((category) => (
              <CategoryListItem
                key={category.id}
                category={category}
                locale={locale}
              />
            ))}
          </div>
        ) : (
          <div className={cn("mt-8 grid gap-4", gridCols)}>
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                locale={locale}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
