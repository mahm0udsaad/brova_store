import { getTranslations } from "next-intl/server"
import type { ThemeComponentProps } from "@/types/theme"
import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface YnsCartDrawerConfig {
  position?: "end" | "start"
}

/* ------------------------------------------------------------------ */
/*  Icons                                                              */
/* ------------------------------------------------------------------ */

function ShoppingBagIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

/**
 * YNS Cart Drawer — Server Component Placeholder
 *
 * This is a minimal server-side representation of the cart area.
 * In practice, a client-side cart drawer will override this component
 * to provide full interactivity (open/close, add/remove items, etc.).
 */
export async function YnsCartDrawer({
  config,
  locale,
}: ThemeComponentProps<YnsCartDrawerConfig>) {
  const t = await getTranslations({ locale, namespace: "storefront" })
  const { position = "end" } = config

  return (
    <section
      className={cn(
        "flex flex-col items-center justify-center gap-5 px-6 py-16",
        "bg-[var(--theme-background)] text-[var(--theme-foreground)]"
      )}
      data-cart-position={position}
    >
      {/* Cart icon */}
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-neutral-50 shadow-sm">
        <ShoppingBagIcon className="h-8 w-8 text-neutral-400" />
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold">
        {t("cart.title")}
      </h3>

      {/* Empty state message */}
      <p className="text-sm text-neutral-500">
        {t("cart.empty")}
      </p>

      {/* Continue shopping hint */}
      <span className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--theme-primary)] cursor-pointer transition-opacity hover:opacity-80">
        {t("cart.continueShopping")}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </span>
    </section>
  )
}
