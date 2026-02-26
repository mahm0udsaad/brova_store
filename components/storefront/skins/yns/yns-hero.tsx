import Image from "next/image"
import Link from "next/link"
import { getTranslations } from "next-intl/server"
import type { ThemeComponentProps } from "@/types/theme"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ArrowRight } from "lucide-react"

interface YnsHeroConfig {
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

export async function YnsHero({
  config,
  locale,
}: ThemeComponentProps<YnsHeroConfig>) {
  const t = await getTranslations({ locale, namespace: "storefront" })
  const {
    titleKey = "hero.title",
    subtitleKey = "hero.subtitle",
    ctaKey = "hero.cta",
    backgroundUrl,
    align = "center",
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
      className={cn(
        "relative w-full overflow-hidden",
        hasImage ? "min-h-[60vh] sm:min-h-[70vh]" : "min-h-[60vh]"
      )}
    >
      {/* Background: Image with overlay OR gradient */}
      {hasImage ? (
        <>
          <Image
            src={backgroundUrl!}
            alt={title}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          {/* Dark gradient overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />
        </>
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-accent) 50%, var(--theme-primary) 100%)`,
            opacity: 0.08,
          }}
        />
      )}

      {/* Content */}
      <div className="relative flex min-h-[60vh] sm:min-h-[70vh] items-center">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div
            className={cn(
              "max-w-2xl space-y-6",
              align === "center" && "mx-auto text-center",
              align === "start" && "text-start"
            )}
          >
            {/* Title */}
            <h1
              className={cn(
                "text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl leading-[1.1]",
                hasImage
                  ? "text-white"
                  : "text-[var(--theme-foreground)]"
              )}
              style={{ fontFamily: "var(--theme-font-heading)" }}
            >
              {title}
            </h1>

            {/* Subtitle */}
            <p
              className={cn(
                "text-base sm:text-lg lg:text-xl leading-relaxed max-w-xl",
                align === "center" && "mx-auto",
                hasImage
                  ? "text-white/80"
                  : "text-[var(--theme-muted)]"
              )}
            >
              {subtitle}
            </p>

            {/* CTA */}
            <div
              className={cn(
                "flex items-center gap-4 pt-2",
                align === "center" && "justify-center"
              )}
            >
              <Button
                asChild
                className={cn(
                  "rounded-full px-8 py-6 text-base font-medium transition-all duration-300",
                  "hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]",
                  hasImage
                    ? "bg-white text-gray-900 hover:bg-white/90"
                    : "bg-[var(--theme-primary)] text-white hover:bg-[var(--theme-primary)]/90"
                )}
              >
                <Link href={`/${locale}/search`}>
                  {cta}
                  <ArrowRight
                    className={cn(
                      "size-4 transition-transform duration-300",
                      isRtl ? "rotate-180 group-hover:-translate-x-0.5" : "group-hover:translate-x-0.5"
                    )}
                  />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
