import { getTranslations } from "next-intl/server"
import Link from "next/link"
import type { ThemeComponentProps } from "@/types/theme"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Search, ShoppingBag, Globe, Menu } from "lucide-react"

interface YnsHeaderConfig {
  logoText?: string
  showSearch?: boolean
  showCart?: boolean
  showLocaleSwitch?: boolean
  sticky?: boolean
  cartItemCount?: number
}

export async function YnsHeader({
  config,
  locale,
}: ThemeComponentProps<YnsHeaderConfig>) {
  const t = await getTranslations({ locale, namespace: "storefront" })
  const {
    logoText,
    showSearch = true,
    showCart = true,
    showLocaleSwitch = true,
    sticky = true,
    cartItemCount = 0,
  } = config

  const isRtl = locale === "ar"

  return (
    <header
      dir={isRtl ? "rtl" : "ltr"}
      className={cn(
        "w-full bg-[var(--theme-background)] transition-shadow duration-300",
        sticky &&
          "sticky top-0 z-50 supports-[backdrop-filter]:bg-[var(--theme-background)]/80 supports-[backdrop-filter]:backdrop-blur-lg",
        // Subtle bottom shadow — no border for YNS aesthetic
        "shadow-[0_1px_3px_0_rgb(0_0_0/0.04)]"
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16 sm:h-[72px]">
        {/* Logo */}
        <Link
          href={`/${locale}`}
          className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <span
            className="text-lg sm:text-xl font-bold tracking-tight text-[var(--theme-foreground)]"
            style={{ fontFamily: "var(--theme-font-heading)" }}
          >
            {logoText || t("header.defaultStoreName")}
          </span>
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-8 lg:flex">
          {[
            { label: t("header.home"), href: `/${locale}` },
            { label: t("header.shop"), href: `/${locale}/search` },
            { label: t("header.contact"), href: `/${locale}/settings` },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative text-sm font-medium text-[var(--theme-foreground)]/70 transition-colors duration-200",
                "hover:text-[var(--theme-foreground)]",
                // Animated underline on hover
                "after:absolute after:inset-x-0 after:-bottom-1 after:h-0.5 after:scale-x-0",
                "after:bg-[var(--theme-primary)] after:transition-transform after:duration-300",
                "hover:after:scale-x-100"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {showSearch && (
            <Button
              size="icon"
              variant="ghost"
              className="rounded-full text-[var(--theme-foreground)]/70 hover:text-[var(--theme-foreground)] hover:bg-[var(--theme-foreground)]/5"
              aria-label={t("header.search")}
            >
              <Search className="size-[18px]" />
            </Button>
          )}

          {showLocaleSwitch && (
            <Button
              size="icon"
              variant="ghost"
              className="hidden sm:inline-flex rounded-full text-[var(--theme-foreground)]/70 hover:text-[var(--theme-foreground)] hover:bg-[var(--theme-foreground)]/5"
              aria-label={t("header.language")}
            >
              <Globe className="size-[18px]" />
            </Button>
          )}

          {showCart && (
            <Button
              size="icon"
              variant="ghost"
              className="relative rounded-full text-[var(--theme-foreground)]/70 hover:text-[var(--theme-foreground)] hover:bg-[var(--theme-foreground)]/5"
              aria-label={t("header.cart")}
            >
              <ShoppingBag className="size-[18px]" />
              {cartItemCount > 0 && (
                <span className="absolute -end-0.5 -top-0.5 flex size-[18px] items-center justify-center rounded-full bg-[var(--theme-primary)] text-[10px] font-bold text-white">
                  {cartItemCount > 99 ? "99+" : cartItemCount}
                </span>
              )}
            </Button>
          )}

          {/* Mobile hamburger */}
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full text-[var(--theme-foreground)]/70 hover:text-[var(--theme-foreground)] hover:bg-[var(--theme-foreground)]/5 lg:hidden"
            aria-label="Menu"
          >
            <Menu className="size-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
