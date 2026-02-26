import { getTranslations } from "next-intl/server"
import Link from "next/link"
import type { ThemeComponentProps } from "@/types/theme"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Search, ShoppingBag, User, Globe, Menu } from "lucide-react"

interface PaperHeaderConfig {
  logoText?: string
  showSearch?: boolean
  showCart?: boolean
  showLocaleSwitch?: boolean
  sticky?: boolean
  cartItemCount?: number
}

export async function PaperHeader({
  config,
  locale,
}: ThemeComponentProps<PaperHeaderConfig>) {
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
        "w-full bg-white border-b border-neutral-200",
        sticky && "sticky top-0 z-50"
      )}
    >
      {/* Single dense row: logo | nav + search | actions */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center gap-4 sm:gap-6">
          {/* Logo */}
          <Link
            href={`/${locale}`}
            className="shrink-0 transition-opacity hover:opacity-80"
          >
            <span
              className="text-base sm:text-lg font-bold tracking-tight text-[var(--theme-foreground)] uppercase"
              style={{ fontFamily: "var(--theme-font-heading)" }}
            >
              {logoText || t("header.defaultStoreName")}
            </span>
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden items-center gap-6 lg:flex">
            {[
              { label: t("header.home"), href: `/${locale}` },
              { label: t("header.shop"), href: `/${locale}/search` },
              { label: t("header.contact"), href: `/${locale}/settings` },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium text-neutral-600 transition-colors duration-150",
                  "hover:text-[var(--theme-foreground)]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)] focus-visible:ring-offset-2 rounded-sm"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Search bar -- visible on desktop, collapses to icon on mobile */}
          {showSearch && (
            <div className="hidden flex-1 justify-end sm:flex ms-auto max-w-sm">
              <div className="relative w-full">
                <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder={t("header.search")}
                  aria-label={t("header.search")}
                  readOnly
                  className={cn(
                    "h-9 w-full border border-neutral-200 bg-neutral-50 ps-9 pe-3 text-sm",
                    "placeholder:text-neutral-400 text-[var(--theme-foreground)]",
                    "transition-colors duration-150",
                    "hover:border-neutral-300 focus:border-[var(--theme-primary)] focus:ring-1 focus:ring-[var(--theme-primary)]",
                    "focus-visible:outline-none",
                    "rounded-sm"
                  )}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className={cn("flex items-center gap-0.5", !showSearch && "ms-auto")}>
            {/* Mobile search icon */}
            {showSearch && (
              <Button
                size="icon-sm"
                variant="ghost"
                className="sm:hidden rounded-none text-neutral-600 hover:text-[var(--theme-foreground)] hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)]"
                aria-label={t("header.search")}
              >
                <Search className="size-4" />
              </Button>
            )}

            {showLocaleSwitch && (
              <Button
                size="icon-sm"
                variant="ghost"
                className="hidden sm:inline-flex rounded-none text-neutral-600 hover:text-[var(--theme-foreground)] hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)]"
                aria-label={t("header.language")}
              >
                <Globe className="size-4" />
              </Button>
            )}

            {/* User icon */}
            <Button
              size="icon-sm"
              variant="ghost"
              className="hidden sm:inline-flex rounded-none text-neutral-600 hover:text-[var(--theme-foreground)] hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)]"
              aria-label={t("header.account") ?? "Account"}
            >
              <User className="size-4" />
            </Button>

            {/* Cart */}
            {showCart && (
              <Button
                size="icon-sm"
                variant="ghost"
                className="relative rounded-none text-neutral-600 hover:text-[var(--theme-foreground)] hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)]"
                aria-label={t("header.cart")}
              >
                <ShoppingBag className="size-4" />
                {cartItemCount > 0 && (
                  <span className="absolute -end-0.5 -top-0.5 flex size-4 items-center justify-center bg-[var(--theme-primary)] text-[9px] font-bold text-white">
                    {cartItemCount > 99 ? "99+" : cartItemCount}
                  </span>
                )}
              </Button>
            )}

            {/* Mobile hamburger */}
            <Button
              size="icon-sm"
              variant="ghost"
              className="rounded-none text-neutral-600 hover:text-[var(--theme-foreground)] hover:bg-neutral-100 lg:hidden focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)]"
              aria-label="Menu"
            >
              <Menu className="size-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
