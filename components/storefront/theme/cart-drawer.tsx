import { getTranslations } from "next-intl/server"
import type { ThemeComponentProps } from "@/types/theme"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ShoppingBag, Minus, Plus, Trash2 } from "lucide-react"

interface CartItem {
  id: string
  name: string
  name_ar?: string
  price: number
  quantity: number
  imageUrl?: string
  size?: string
  color?: string
}

interface CartDrawerConfig {
  items?: CartItem[]
  subtotal?: number
  currency?: string
  checkoutUrl?: string
}

function formatPrice(locale: string, amount: number, currency: string) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US", {
    style: "currency",
    currency,
  }).format(amount)
}

function CartItemRow({
  item,
  locale,
  currency,
  t,
}: {
  item: CartItem
  locale: string
  currency: string
  t: (key: string) => string
}) {
  const displayName = locale === "ar" && item.name_ar ? item.name_ar : item.name
  const lineTotal = item.price * item.quantity

  return (
    <li className="flex gap-3 border-b border-[var(--theme-border)] py-4 last:border-b-0">
      {/* Thumbnail */}
      <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={displayName}
            width={48}
            height={48}
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-[var(--theme-muted)]">
            <ShoppingBag className="size-5" />
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h4 className="truncate text-sm font-medium text-[var(--theme-foreground)]">
          {displayName}
        </h4>

        {/* Size / Color */}
        {(item.size || item.color) && (
          <p className="text-xs text-[var(--theme-muted)]">
            {[item.size, item.color].filter(Boolean).join(" / ")}
          </p>
        )}

        {/* Quantity controls + line total */}
        <div className="mt-1 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label={t("cart.decrease")}
              className="flex size-6 items-center justify-center rounded border border-[var(--theme-border)] text-[var(--theme-muted)] transition hover:bg-neutral-50"
            >
              <Minus className="size-3" />
            </button>
            <span className="min-w-[1.5rem] text-center text-xs font-medium text-[var(--theme-foreground)]">
              {item.quantity}
            </span>
            <button
              type="button"
              aria-label={t("cart.increase")}
              className="flex size-6 items-center justify-center rounded border border-[var(--theme-border)] text-[var(--theme-muted)] transition hover:bg-neutral-50"
            >
              <Plus className="size-3" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[var(--theme-foreground)]" dir="ltr">
              {formatPrice(locale, lineTotal, currency)}
            </span>
            <button
              type="button"
              aria-label={t("cart.remove")}
              className="flex size-6 items-center justify-center rounded text-[var(--theme-muted)] transition hover:text-red-500"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </li>
  )
}

export async function CartDrawer({
  config,
  locale,
}: ThemeComponentProps<CartDrawerConfig>) {
  const t = await getTranslations({ locale, namespace: "storefront" })

  const {
    items = [],
    subtotal,
    currency = "SAR",
    checkoutUrl,
  } = config

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const computedSubtotal =
    subtotal ?? items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const resolvedCheckoutUrl = checkoutUrl || `/${locale}/checkout`
  const isRtl = locale === "ar"

  // Empty cart state
  if (items.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center"
        dir={isRtl ? "rtl" : "ltr"}
      >
        <div className="flex size-16 items-center justify-center rounded-full bg-neutral-100">
          <ShoppingBag className="size-7 text-[var(--theme-muted)]" />
        </div>
        <p className="text-sm text-[var(--theme-muted)]">
          {t("cart.empty")}
        </p>
        <Link href={`/${locale}`}>
          <Button
            variant="outline"
            className="rounded-full border-[var(--theme-border)] text-sm"
          >
            {t("cart.continueShopping")}
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div
      className="flex h-full flex-col"
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-[var(--theme-border)] px-6 py-4">
        <ShoppingBag className="size-5 text-[var(--theme-primary)]" />
        <h3 className="text-base font-semibold text-[var(--theme-foreground)]">
          {t("cart.title")}
        </h3>
        <span className="ms-auto rounded-full bg-[var(--theme-primary)] px-2 py-0.5 text-xs font-medium text-white">
          {itemCount}
        </span>
      </div>

      {/* Items list */}
      <ul className="flex-1 overflow-y-auto px-6">
        {items.map((item) => (
          <CartItemRow
            key={item.id}
            item={item}
            locale={locale}
            currency={currency}
            t={t}
          />
        ))}
      </ul>

      {/* Footer: subtotal + checkout */}
      <div className="border-t border-[var(--theme-border)] px-6 py-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[var(--theme-muted)]">
            {t("cart.subtotal")}
          </span>
          <span className="text-base font-semibold text-[var(--theme-foreground)]" dir="ltr">
            {formatPrice(locale, computedSubtotal, currency)}
          </span>
        </div>

        <Link href={resolvedCheckoutUrl} className="mt-4 block">
          <Button
            className={cn(
              "w-full rounded-full text-sm font-medium",
              "bg-[var(--theme-primary)] text-white hover:opacity-90"
            )}
          >
            {t("cart.checkout")}
          </Button>
        </Link>
      </div>
    </div>
  )
}
