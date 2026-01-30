# Clothing Store V2 Theme Migration Notes

## Phase 0 — Audit & Map (No Code Changes)

### Reference UI: /clothing_store-main
- Styling system: Tailwind CSS v4-style imports (`@import "tailwindcss"`) + `tw-animate-css` + global CSS tokens and utilities in `clothing_store-main/app/globals.css` and `clothing_store-main/styles/globals.css`.
- Primary UI primitives/components:
  - `Header` (fixed, blurred, back/logo/actions)
  - `BottomNav` (floating bottom nav with badge)
  - `CategoryTabs`, `CategoryBentoGrid`, `CategorySheetContent`
  - `ProductCard`, `ProductCardSkeleton`
  - `ProductImageSlider` (gallery + fullscreen + try-on)
  - Misc: modal stack, theme toggle, try-on/auth sheets
- Layout entry points:
  - Home: `clothing_store-main/app/page.tsx` + `home-page-client.tsx`
  - Product detail: `clothing_store-main/app/product/[id]/page.tsx` + `product-page-client.tsx`

### Platform Theme System (current)
- Theme interface: `lib/themes/types.ts`
  - Components required: `Hero`, `ProductGrid`, `ProductCard`, `ProductDetail`.
- Theme registry/resolution: `lib/themes/index.ts` (`resolveTheme(theme_id, store_type)`)
- Existing clothing theme: `lib/themes/clothing-v1/*`.
- Storefront entry points:
  - Home: `app/[locale]/storefront-home.tsx`
  - Product detail: `app/[locale]/product/[id]/page.tsx`

### Component Mapping (Reference → New Theme Target)
| Reference component (clothing_store-main) | Target in new theme (lib/themes/clothing_store_v2) | Notes |
| --- | --- | --- |
| `app/home-page-client.tsx` | `components/homepage.tsx` (used by `Hero`/`ProductGrid` wrapper) | Home layout composition, category UI, infinite scroll. |
| `components/header.tsx` | `components/header.tsx` | Header UI; will adapt to locale-based routes. |
| `components/bottom-nav.tsx` | `components/bottom-nav.tsx` | Footer/navigation for storefront pages. |
| `components/category-tabs.tsx` | `components/category-tabs.tsx` | Dynamic categories from `store_categories`. |
| `components/category-bento-grid.tsx` | `components/category-bento-grid.tsx` | Replace `categoryData` with store categories. |
| `components/category-sheet-content.tsx` | `components/category-sheet-content.tsx` | Category sheet content. |
| `components/product-card.tsx` | `components/product-card.tsx` | Localized fields + locale-aware routes. |
| `components/product-card-skeleton.tsx` | `components/product-card-skeleton.tsx` | Grid loading state. |
| `components/product-image-slider.tsx` | `components/product-image-slider.tsx` | Product detail gallery. |
| `app/product/[id]/product-page-client.tsx` | `components/product-detail.tsx` | Product detail layout; use existing cart/try-on flows. |
| `app/layout.tsx` + `app/globals.css` | `styles/theme.css` or scoped styles | Scope CSS via theme wrapper or CSS modules. |

### Routing / Data Notes
- Reference routes are `/product/[id]` and `/` without locale.
- Platform routes are `/{locale}/product/[id]` and `/{locale}`; theme components must use locale-aware links.
- Data must come from `lib/supabase/queries/storefront` (products, store settings, categories).
- Replace mock categories (`categoryData`) with `store_categories` where available.

### Known Gaps (to address later)
- Reference UI uses global CSS utilities (safe-area padding, scrollbar-hide); will need scoped equivalents.
- Reference UI is heavy on client-side motion; ensure only necessary components are client components.

## Phase 1 — Theme Skeleton
- Created `lib/themes/clothing_store_v2/` with base theme registration and component slots.
- Registered `clothing_store_v2` in `lib/themes/index.ts`.

## Phase 2 — UI Porting (in progress)
### New/Updated Files
- `lib/themes/clothing_store_v2/index.tsx` — theme config + exports.
- `lib/themes/clothing_store_v2/hero.tsx` — placeholder (home UI handled by ProductGrid).
- `lib/themes/clothing_store_v2/product-grid.tsx` — server wrapper that loads store categories and renders the HomePage client.
- `lib/themes/clothing_store_v2/product-card.tsx` — storefront ProductCard adapted for locale + storefront products.
- `lib/themes/clothing_store_v2/product-detail.tsx` — storefront ProductDetail ported from reference UI.
- `lib/themes/clothing_store_v2/utils.ts` — localization + size inference helpers.
- `lib/themes/clothing_store_v2/components/*` — category tabs/bento/sheet + HomePage client.
- `lib/themes/clothing_store_v2/styles/theme.module.css` — scoped CSS variable overrides to match reference color tokens.
- `lib/supabase/queries/storefront.ts` — added `getStorefrontCategoryEntities` for store_categories.
- `lib/themes/types.ts` — `ProductGridProps` now supports optional `storeId`.
- `app/[locale]/storefront-home.tsx` — passes `storeId` to theme ProductGrid.

### Notes / Decisions
- Category UI now uses `store_categories` when available; otherwise falls back to categories found on `store_products`.
- Infinite scroll is simulated with in-memory pagination (no new API). This keeps UX while respecting existing queries.
- Size selection uses tags-based inference with a locale fallback of “One Size” if tags do not contain sizes (keeps cart flow intact).

### Known Differences / Next Improvements
- If product tags do not include size hints, size selection falls back to “One Size” for cart compatibility.
- In-memory pagination does not request additional products beyond initial `getStorefrontProducts` limit; consider adding a storefront products API/route if larger catalogs are common.
