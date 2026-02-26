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

interface PaperCategoryBrowserConfig {
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
          "border border-neutral-200 transition-all duration-200",
          "hover:border-[var(--theme-foreground)] hover:-translate-y-1",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)] focus-visible:ring-offset-2"
        )}
      >
        {/* Image area */}
        <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
          {category.imageUrl ? (
            <Image
              src={category.imageUrl}
              alt={category.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            /* No image: neutral bg with first letter centered */
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-4xl font-bold text-neutral-300 select-none">
                {category.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Category name */}
        <div className="border-t border-neutral-200 px-4 py-3">
          <h3 className="text-sm font-medium text-[var(--theme-foreground)] text-start">
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
        "group flex items-center gap-4 border border-neutral-200 p-3 transition-all duration-200",
        "hover:border-[var(--theme-foreground)] hover:-translate-y-0.5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)] focus-visible:ring-offset-2"
      )}
    >
      <div className="relative h-14 w-14 shrink-0 overflow-hidden border border-neutral-200 bg-neutral-100">
        {category.imageUrl ? (
          <Image
            src={category.imageUrl}
            alt={category.name}
            fill
            className="object-cover"
            sizes="56px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-lg font-bold text-neutral-300 select-none">
              {category.name.charAt(0).toUpperCase()}
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

export async function PaperCategoryBrowser({
  config,
  locale,
}: ThemeComponentProps<PaperCategoryBrowserConfig>) {
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
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section title with bottom border line */}
        <div className="border-b border-neutral-200 pb-4">
          <h2
            className="text-2xl font-bold text-start text-[var(--theme-foreground)] sm:text-3xl"
            style={{ fontFamily: "var(--theme-font-heading)" }}
          >
            {t(titleKey)}
          </h2>
        </div>

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
