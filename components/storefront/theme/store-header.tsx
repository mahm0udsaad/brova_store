import { getTranslations } from "next-intl/server"
import Link from "next/link"
import type { ThemeComponentProps } from "@/types/theme"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Search, ShoppingBag, Globe } from "lucide-react"

interface StoreHeaderConfig {
  logoText?: string
  showSearch?: boolean
  showCart?: boolean
  showLocaleSwitch?: boolean
  sticky?: boolean
}

export async function StoreHeader({
  config,
  locale,
}: ThemeComponentProps<StoreHeaderConfig>) {
  const t = await getTranslations({ locale, namespace: "storefront" })
  const {
    logoText,
    showSearch = true,
    showCart = true,
    showLocaleSwitch = true,
    sticky = true,
  } = config

  return (
    <header
      className={cn(
        "w-full border-b border-[var(--theme-border)] bg-[var(--theme-background)]",
        sticky && "sticky top-0 z-40"
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-[var(--theme-primary)] text-white">
            <span className="text-sm font-semibold">B</span>
          </div>
          <span className="text-base font-semibold tracking-tight">
            {logoText || t("header.defaultStoreName")}
          </span>
        </div>

        <nav className="hidden items-center gap-6 text-sm font-medium lg:flex">
          <Link className="text-[var(--theme-foreground)]" href={`/${locale}`}>
            {t("header.home")}
          </Link>
          <Link className="text-[var(--theme-foreground)]" href={`/${locale}/search`}>
            {t("header.shop")}
          </Link>
          <Link className="text-[var(--theme-foreground)]" href={`/${locale}/search`}>
            {t("header.categories")}
          </Link>
          <Link className="text-[var(--theme-foreground)]" href={`/${locale}/settings`}>
            {t("header.contact")}
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {showSearch ? (
            <Button
              size="icon"
              variant="outline"
              className="rounded-full border-[var(--theme-border)]"
              aria-label={t("header.search")}
            >
              <Search className="size-4" />
            </Button>
          ) : null}
          {showCart ? (
            <Button
              size="icon"
              variant="outline"
              className="rounded-full border-[var(--theme-border)]"
              aria-label={t("header.cart")}
            >
              <ShoppingBag className="size-4" />
            </Button>
          ) : null}
          {showLocaleSwitch ? (
            <Button
              size="icon"
              variant="outline"
              className="rounded-full border-[var(--theme-border)]"
              aria-label={t("header.language")}
            >
              <Globe className="size-4" />
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  )
}
