import Link from "next/link"
import { getTranslations } from "next-intl/server"
import type { ThemeComponentProps } from "@/types/theme"
import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PaperCartDrawerConfig {
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
 * Paper Cart Drawer — Server Component Placeholder
 *
 * Minimal server-side representation of the empty cart state.
 * A client-side cart drawer will hydrate over this component
 * using the `data-cart-position` attribute for placement.
 */
export async function PaperCartDrawer({
  config,
  locale,
}: ThemeComponentProps<PaperCartDrawerConfig>) {
  const t = await getTranslations({ locale, namespace: "storefront" })
  const { position = "end" } = config

  return (
    <section
      className={cn(
        "flex flex-col items-center justify-center gap-5 px-6 py-16",
        "border border-neutral-200 bg-[var(--theme-background)] text-[var(--theme-foreground)]"
      )}
      data-cart-position={position}
    >
      {/* Bag icon */}
      <div className="flex h-16 w-16 items-center justify-center border border-neutral-200">
        <ShoppingBagIcon className="h-7 w-7 text-neutral-400" />
      </div>

      {/* Title */}
      <h3
        className="text-base font-semibold"
        style={{ fontFamily: "var(--theme-font-heading)" }}
      >
        {t("cart.title")}
      </h3>

      {/* Empty state message */}
      <p className="text-sm text-neutral-500">
        {t("cart.empty")}
      </p>

      {/* Start shopping link */}
      <Link
        href={`/${locale}/search`}
        className={cn(
          "mt-1 inline-flex items-center gap-1.5 border-b border-[var(--theme-primary)] pb-0.5",
          "text-sm font-medium text-[var(--theme-primary)] transition-opacity hover:opacity-80",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)] focus-visible:ring-offset-2"
        )}
      >
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
          className="rtl:rotate-180"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </Link>
    </section>
  )
}
