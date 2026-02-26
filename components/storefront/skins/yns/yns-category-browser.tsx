import Image from "next/image"
import Link from "next/link"
import { getTranslations } from "next-intl/server"
import type { ThemeComponentProps } from "@/types/theme"
import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CategoryItem {
  id: string
  name: string
  slug: string
  imageUrl?: string
}

interface YnsCategoryBrowserConfig {
  titleKey?: string
  categories?: CategoryItem[]
  columns?: 2 | 3 | 4
  layout?: "grid" | "list"
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function CategoryCard({
  category,
  locale,
}: {
  category: CategoryItem
  locale: string
}) {
  const href = `/${locale}/search?category=${category.slug}`

  return (
    <Link href={href} className="group block">
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl transition-all duration-300",
          "hover:scale-[1.02] hover:shadow-xl",
          "aspect-[4/3]"
        )}
      >
        {category.imageUrl ? (
          <>
            <Image
              src={category.imageUrl}
              alt={category.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </>
        ) : (
          /* Solid background fallback */
          <div className="absolute inset-0 bg-[var(--theme-primary)]/[0.08]" />
        )}

        {/* Category name */}
        <div className="absolute inset-0 flex items-end p-5">
          <h3
            className={cn(
              "text-base font-semibold leading-tight sm:text-lg",
              category.imageUrl
                ? "text-white drop-shadow-sm"
                : "text-[var(--theme-foreground)]"
            )}
          >
            {category.name}
          </h3>
        </div>
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
  const href = `/${locale}/search?category=${category.slug}`

  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-4 rounded-2xl bg-white p-3 shadow-sm transition-all duration-200",
        "hover:shadow-md hover:scale-[1.01]"
      )}
    >
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
        {category.imageUrl ? (
          <Image
            src={category.imageUrl}
            alt={category.name}
            fill
            className="object-cover"
            sizes="64px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[var(--theme-primary)]/[0.08]">
            <span className="text-base font-bold text-[var(--theme-primary)]">
              {category.name
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </span>
          </div>
        )}
      </div>
      <div className="flex-1 text-start">
        <h3 className="text-sm font-medium text-[var(--theme-foreground)] group-hover:text-[var(--theme-primary)] transition-colors">
          {category.name}
        </h3>
      </div>
      {/* Arrow */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0 text-neutral-400 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
      >
        <path d="m9 18 6-6-6-6" />
      </svg>
    </Link>
  )
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export async function YnsCategoryBrowser({
  config,
  locale,
}: ThemeComponentProps<YnsCategoryBrowserConfig>) {
  const {
    titleKey = "categories.title",
    categories,
    columns = 3,
    layout = "grid",
  } = config

  /* If no categories, render nothing */
  if (!categories || categories.length === 0) {
    return null
  }

  const t = await getTranslations({ locale, namespace: "storefront" })

  const gridCols =
    columns === 2
      ? "grid-cols-2"
      : columns === 4
        ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
        : "grid-cols-2 md:grid-cols-3"

  return (
    <section className="bg-[var(--theme-background)] py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section title */}
        <h2 className="text-2xl font-bold text-start text-[var(--theme-foreground)] sm:text-3xl">
          {t(titleKey)}
        </h2>

        {/* Grid or list */}
        {layout === "list" ? (
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
          <div className={cn("mt-8 grid gap-4 sm:gap-5", gridCols)}>
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
