import Image from "next/image"
import Link from "next/link"
import { getTranslations } from "next-intl/server"
import type { ThemeComponentProps } from "@/types/theme"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ArrowRight } from "lucide-react"

interface PaperHeroConfig {
  titleKey?: string
  subtitleKey?: string
  ctaKey?: string
  backgroundUrl?: string
  align?: "start" | "center"
  /** Direct text overrides (from store_banners, bypasses i18n) */
  titleOverride?: string
  subtitleOverride?: string
  ctaOverride?: string
}

export async function PaperHero({
  config,
  locale,
}: ThemeComponentProps<PaperHeroConfig>) {
  const t = await getTranslations({ locale, namespace: "storefront" })
  const {
    titleKey = "hero.title",
    subtitleKey = "hero.subtitle",
    ctaKey = "hero.cta",
    backgroundUrl,
    titleOverride,
    subtitleOverride,
    ctaOverride,
  } = config

  const isRtl = locale === "ar"
  const title = titleOverride || t(titleKey)
  const subtitle = subtitleOverride || t(subtitleKey)
  const cta = ctaOverride || t(ctaKey)

  const hasImage = Boolean(backgroundUrl)

  return (
    <section
      dir={isRtl ? "rtl" : "ltr"}
      className="w-full bg-white"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            "grid min-h-[500px] items-center gap-8 py-12 sm:py-16",
            hasImage
              ? "lg:grid-cols-2 lg:gap-12"
              : "lg:grid-cols-1"
          )}
        >
          {/* Text content */}
          <div
            className={cn(
              "flex flex-col justify-center",
              hasImage ? "order-2 lg:order-1" : "max-w-2xl",
              !hasImage && "py-8"
            )}
          >
            {/* Gradient accent line above title */}
            <div
              className="mb-6 h-1 w-16"
              style={{
                background: `linear-gradient(to right, var(--theme-primary), var(--theme-accent))`,
              }}
            />

            {/* Kicker text */}
            <span
              className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--theme-accent)]"
              style={{ fontFamily: "var(--theme-font-body)" }}
            >
              {t("hero.kicker") ?? ""}
            </span>

            {/* Heading */}
            <h1
              className="text-3xl font-bold tracking-tight text-[var(--theme-foreground)] sm:text-4xl lg:text-5xl leading-[1.1]"
              style={{ fontFamily: "var(--theme-font-heading)" }}
            >
              {title}
            </h1>

            {/* Subtitle */}
            <p className="mt-4 text-base leading-relaxed text-neutral-600 sm:text-lg max-w-lg">
              {subtitle}
            </p>

            {/* CTA Button -- rectangular, not pill */}
            <div className="mt-8">
              <Button
                asChild
                className={cn(
                  "h-11 px-8 text-sm font-semibold rounded-sm",
                  "bg-[var(--theme-primary)] text-white",
                  "hover:bg-[var(--theme-primary)]/90",
                  "transition-all duration-200",
                  "focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)] focus-visible:ring-offset-2"
                )}
              >
                <Link href={`/${locale}/search`} className="inline-flex items-center gap-2">
                  {cta}
                  <ArrowRight
                    className={cn(
                      "size-4 transition-transform duration-200",
                      isRtl ? "rotate-180" : "",
                      "group-hover:translate-x-0.5"
                    )}
                  />
                </Link>
              </Button>
            </div>
          </div>

          {/* Image side */}
          {hasImage && (
            <div className="relative order-1 aspect-[4/5] w-full overflow-hidden rounded-lg lg:order-2 lg:aspect-auto lg:h-full lg:min-h-[500px]">
              <Image
                src={backgroundUrl!}
                alt={title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
