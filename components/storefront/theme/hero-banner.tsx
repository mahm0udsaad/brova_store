import Image from "next/image"
import { getTranslations } from "next-intl/server"
import type { ThemeComponentProps } from "@/types/theme"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface HeroBannerConfig {
  titleKey?: string
  subtitleKey?: string
  ctaKey?: string
  backgroundUrl?: string
  align?: "start" | "center"
}

export async function HeroBanner({
  config,
  locale,
}: ThemeComponentProps<HeroBannerConfig>) {
  const t = await getTranslations({ locale, namespace: "storefront" })
  const {
    titleKey = "hero.title",
    subtitleKey = "hero.subtitle",
    ctaKey = "hero.cta",
    backgroundUrl,
    align = "start",
  } = config

  return (
    <section className="relative overflow-hidden bg-[var(--theme-background)] text-[var(--theme-foreground)]">
      {backgroundUrl ? (
        <Image
          src={backgroundUrl}
          alt={t("hero.imageAlt")}
          fill
          className="object-cover"
          priority
        />
      ) : null}
      <div className="relative">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <div
            className={cn(
              "max-w-2xl space-y-5",
              align === "center" ? "text-center mx-auto" : "text-start"
            )}
          >
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--theme-muted)]">
              {t("hero.kicker")}
            </p>
            <h1 className="text-3xl font-semibold sm:text-4xl lg:text-5xl leading-tight font-[var(--theme-font-heading)]">
              {t(titleKey)}
            </h1>
            <p className="text-base sm:text-lg text-[var(--theme-muted)]">
              {t(subtitleKey)}
            </p>
            <div className={cn("flex items-center gap-3", align === "center" && "justify-center")}>
              <Button className="rounded-full px-6 py-5 bg-[var(--theme-primary)] text-white hover:bg-[var(--theme-primary)]/90">
                {t(ctaKey)}
              </Button>
              <Button
                variant="outline"
                className="rounded-full px-6 py-5 border-[var(--theme-border)] text-[var(--theme-foreground)]"
              >
                {t("hero.secondaryCta")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
