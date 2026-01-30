# Repo Recon Report (Project Setup + Routes + Shopify-Class Alignment)

Developer: Codex (agent)

## Findings (evidence-backed)

### Repo orientation map (for new joiners)

- `app/`: Next.js App Router routes (locale-scoped storefront + admin) and API routes (`app/api/**`). (`app/`)
- `components/`: shared UI components used by both storefront and admin. (`components/`)
- `lib/`: business logic (Supabase clients/queries, AI agents, theming, marketing helpers, etc.). (`lib/`)
- `supabase/`: Supabase project assets/config (schema/migrations live elsewhere; see `scripts/*.sql` and repo docs). (`supabase/`, `scripts/`)
- `scripts/`: SQL + seed scripts (e.g. `seed:admin` runs `scripts/seed-admin.ts`). (`package.json`, `scripts/`)
- `__tests__/`: Jest tests, including multi-tenancy/RLS checks. (`__tests__/`)
- `clothing_store-main/`: appears to be a copied/legacy sub-project; contains additional Brova references and may confuse contributors if not intentionally kept. (`clothing_store-main/`)

### Package manager + tooling state (pnpm vs bun)

- Two lockfiles are present, implying mixed package manager usage:
  - `pnpm-lock.yaml` declares `lockfileVersion: '9.0'`. (`pnpm-lock.yaml`)
  - `bun.lock` declares `"lockfileVersion": 1` and repeats workspace deps. (`bun.lock`)
- `package.json` does not declare a `packageManager` field (so the repo does not enforce pnpm by default), and scripts are generic (`next dev`, `next build`, `eslint .`). (`package.json`)
- `bun.lock` is not ignored by gitignore (only `npm-debug.log*`, `yarn-debug.log*`, `yarn-error.log*`, `.pnpm-debug.log*`, etc. are listed). (`.gitignore`)

Key evidence objects:
- `pnpm-lock.yaml` top-level `lockfileVersion` and `settings`. (`pnpm-lock.yaml`)
- `bun.lock` top-level `lockfileVersion` and `workspaces[""].name`. (`bun.lock`)
- No `"packageManager": "pnpm@..."` in `package.json`. (`package.json`)

### Hardcoded tenant/brand assumptions (Brova-specific)

- Storefront root is explicitly hardcoded to a single org:
  - `HomePage()` sets `const orgSlug = 'brova'` and passes it into `<StorefrontHome locale={locale} orgSlug={orgSlug} />`. (`app/[locale]/page.tsx`)
- Global JSON-LD is hardcoded to Brova and a single domain:
  - `jsonLd["@graph"]` contains `"name": "Brova"`, `@id: "https://brova.vercel.app/#organization"`, `url: "https://brova.vercel.app"`, and a Brova-specific description. Injected via `RootLayout()` using `next/script`. (`app/layout.tsx`, function `RootLayout`)
- Multiple UI components and defaults assume the “Brova” brand:
  - Header logo points to `src="/brova-logo-full.png"` with `alt="Brova Logo"`. (`components/header.tsx`, function `Header`)
  - Marketing draft UI defaults to `DEFAULT_BRAND = { name: "Brova", handle: "brova" ... }`. (`lib/marketing/post-ui.ts`, function `buildMarketingDraft`)
  - Marketing UI also hardcodes `BRAND = { name: "Brova", handle: "brova" ... }` for generated posts. (`components/admin/marketing/generated-posts.tsx`, function `GeneratedPosts`)
  - Social post preview fallbacks render `"Brova"` if draft header fields are missing. (`components/admin/marketing/social-post-preview.tsx`, function `FacebookPostPreview` and peers)
- AI “manager” agent prompt is hardcoded to a single brand:
  - `MANAGER_SYSTEM_PROMPT` begins: “You are the AI Manager Assistant for Brova…”. (`lib/agents/manager-agent.ts`)
- Telemetry service name is hardcoded:
  - OpenTelemetry `SERVICE_NAME` is `'brova-y-otel'`. (`instrumentation.ts`)
- Local storage keys are inconsistent and partially brand-specific:
  - `PROFILE_KEY = "brova_profile"`, while cart/order/contact/address keys are `"atypical_*"`. (`lib/store.ts`, functions `getCart/saveCart/.../saveUserProfile`)
- “Brova Admin” is hardcoded into page metadata in multiple admin routes:
  - Example: `metadata.title = "Appearance | Brova Admin"` (`app/[locale]/admin/appearance/page.tsx`)
  - Example: `metadata.title = "Settings | Brova Admin"` (`app/[locale]/admin/settings/page.tsx`)
  - Example: `metadata.title = "Bulk Deals | Brova Admin"` (`app/[locale]/admin/bulk-deals/page.tsx`)
  - Example: `metadata.title = "Insights | Brova Admin"` (`app/[locale]/admin/insights/page.tsx`)

### High-level routes/modules (orientation map)

**App routes (Next App Router)**
- Locale root + layout:
  - `app/layout.tsx` (global layout + JSON-LD)
  - `app/[locale]/layout.tsx` (locale validation + `generateMetadata()` + `generateStaticParams()`)
  - `app/[locale]/page.tsx` (storefront home; hardcoded `orgSlug = 'brova'`)
- Auth/onboarding:
  - `app/[locale]/login/page.tsx`, `app/[locale]/signup/page.tsx`, `app/[locale]/admin-login/page.tsx`
  - `app/[locale]/start/page.tsx` orchestrates onboarding and redirects (`requireAuth()`, `getUserOrganization()`, `assignStoreTheme()`, redirects to `/${locale}/admin/onboarding` etc.). (`app/[locale]/start/page.tsx`, function `StartPage`)
  - `app/[locale]/setup/store-type/page.tsx` (store-type selection form; requires auth). (`app/[locale]/setup/store-type/page.tsx`, function `StoreTypePage`)
- Storefront shopping:
  - `app/[locale]/product/[id]/page.tsx`, `app/[locale]/search/page.tsx`, `app/[locale]/cart/page.tsx`, `app/[locale]/checkout/page.tsx`, `app/[locale]/orders/page.tsx`, `app/[locale]/settings/page.tsx`, `app/[locale]/confirmation/page.tsx`
- Admin workflows:
  - Dashboard: `app/[locale]/admin/page.tsx` (uses tenant-scoped `getAdminStoreContext()` and shows draft banner if store is `draft`). (`app/[locale]/admin/page.tsx`, function `AdminDashboardPage`)
  - Products: `app/[locale]/admin/products/page.tsx`, `app/[locale]/admin/products/new/page.tsx`, `app/[locale]/admin/products/[id]/page.tsx`
  - Inventory: `app/[locale]/admin/inventory/page.tsx`
  - Orders: `app/[locale]/admin/orders/page.tsx`
  - Categories: `app/[locale]/admin/categories/page.tsx`
  - Marketing: `app/[locale]/admin/marketing/page.tsx`, `app/[locale]/admin/marketing/campaign/[id]/page.tsx`
  - Appearance (theme-ish): `app/[locale]/admin/appearance/page.tsx`
  - Onboarding: `app/[locale]/admin/onboarding/page.tsx`
  - Media: `app/[locale]/admin/media/page.tsx`
  - Admin settings + insights: `app/[locale]/admin/settings/page.tsx`, `app/[locale]/admin/insights/page.tsx`
  - Bulk image/product workflows: `app/[locale]/admin/bulk-deals/page.tsx`, `app/[locale]/admin/bulk-deals/[batchId]/page.tsx`

**API routes**
- AI/admin-focused endpoints exist for “draft-first AI” style workflows:
  - Product AI + autosave/bulk: `app/api/admin/products/[id]/ai/route.ts`, `app/api/admin/products/autosave/route.ts`, `app/api/admin/products/bulk/route.ts`
  - Marketing drafts: `app/api/admin/marketing-drafts/route.ts`
  - “Concierge” approve/publish: `app/api/admin/concierge/approve-draft/route.ts`, `app/api/admin/concierge/publish/route.ts`
  - Bulk deals generation pipelines: `app/api/admin/bulk-deals/*/route.ts`
- Storefront-ish endpoints:
  - `app/api/products/route.ts`, `app/api/orders/route.ts`, `app/api/assistant/route.ts`, `app/api/try-on/route.ts`, `app/api/measure/*/route.ts`

### Shopify-class alignment check (routes vs expected journey)

Expected journey (given): auth → onboarding → products → publish → storefront → checkout → orders

- Auth: present (`app/[locale]/login/page.tsx`, `app/[locale]/signup/page.tsx`, plus `app/[locale]/admin-login/page.tsx`).
- Onboarding: present and orchestrated via `StartPage()` with redirects to store-type selection and `/${locale}/admin/onboarding`. (`app/[locale]/start/page.tsx`)
- Products: present (`app/[locale]/admin/products/*` and product detail route `app/[locale]/product/[id]/page.tsx`).
- Publish:
  - Evidence of publish concept exists in API (`app/api/admin/concierge/publish/route.ts`) and “draft” status UI banner exists in admin dashboard. (`app/[locale]/admin/page.tsx`)
  - No obvious dedicated “Publish” UI route is visible in the `app/[locale]/admin/*` page set (publish may be embedded inside other pages/components, but it’s not discoverable at the route level).
- Storefront: present (`app/[locale]/page.tsx` + `StorefrontHome`), but currently hardcoded to `orgSlug = 'brova'`. (`app/[locale]/page.tsx`)
- Checkout: present (`app/[locale]/checkout/page.tsx`).
- Orders: present (customer: `app/[locale]/orders/page.tsx`; admin: `app/[locale]/admin/orders/page.tsx`).

## Risks/blocks

1) Tooling drift + dependency resolution mismatch
- Dual lockfiles (`pnpm-lock.yaml` + `bun.lock`) make installs non-deterministic across devs/CI unless one is removed and enforcement is added. (`pnpm-lock.yaml`, `bun.lock`, `.gitignore`, `package.json`)

2) Multi-tenant + themeable storefront vision is blocked by hardcoded tenant/brand
- Storefront entrypoint sets `orgSlug = 'brova'`, and global metadata/JSON-LD hardcodes `brova.vercel.app` and “Brova” brand. This blocks true multi-tenant storefronts and per-tenant SEO/theming. (`app/[locale]/page.tsx`, `app/layout.tsx`)

3) “Ship it” quality risks for Shopify-class expectations
- Type safety is explicitly disabled at build time (`typescript.ignoreBuildErrors: true`), which can mask regressions in a complex multi-tenant/admin system. (`next.config.mjs`)
- Some deps are specified as `"latest"` (e.g. `@supabase/supabase-js`, `@emotion/is-prop-valid`), which increases reproducibility risk unless lockfiles are strictly enforced. (`package.json`)

## Proposed tasks or changes (no changes made yet)

### 1) Package manager enforcement (pnpm only)

- Add a single source of truth for tooling:
  - Add `packageManager: "pnpm@<version>"` to `package.json`.
  - Optionally add `engines.node` / `engines.pnpm` to narrow supported versions.
- Remove bun as a competing lock source:
  - Delete `bun.lock` (or move it out of the repo if you still need it for experimentation).
  - Add `bun.lock` to `.gitignore` if you don’t want it tracked at all.
- Add guardrails:
  - Add a `preinstall` script that errors if `npm_config_user_agent` is not pnpm (prevents `npm install`, `yarn`, `bun install`).
  - Update `README.md` to explicitly state `pnpm install` / `pnpm dev` as the supported path.

### 2) Brand/tenant de-hardcoding to fit “Shopify-class builder”

- Centralize tenant/brand config:
  - Replace hardcoded `orgSlug = 'brova'` with tenant resolution (domain/subdomain mapping, or route param like `/{locale}/{orgSlug}` depending on product decision).
  - Generate JSON-LD + `<head>` metadata from tenant/store settings (DB-backed) rather than constants in `app/layout.tsx`.
- Ensure admin UI is tenant-branded:
  - Replace `"Brova Admin"` metadata with `storeContext.store.name` (already available via `getAdminStoreContext()` in several places) or a tenant settings query.
- Make AI agent prompts tenant-aware:
  - Parameterize `MANAGER_SYSTEM_PROMPT` with tenant/store context instead of “Brova”.

### 3) Surface-level journey completeness

- Add an explicit “Publish” route or clearly label where publishing happens:
  - If publishing is handled by “Concierge”, expose a dedicated UI affordance and route (e.g. `/admin/publish`) that summarizes draft state, preview links, and publish actions.
- Add/storefront preview workflow:
  - Provide a “Preview storefront” link in admin that points to the tenant-scoped storefront (critical for themeable, draft-first flows).

## Acceptance criteria

### Package manager enforcement

- Repo contains exactly one lockfile for installs: `pnpm-lock.yaml`.
- `bun.lock` is removed from git tracking (deleted or ignored) and no docs/scripts reference bun.
- `package.json` includes `packageManager: "pnpm@..."` and install attempts with non-pnpm tools fail fast (preinstall guard).
- `README.md` includes `pnpm`-only commands and a minimal setup section.

### Tenant/brand hardcoding removal

- No hardcoded `"brova"` org slug in storefront entry route; tenant is resolved dynamically.
- No global SEO/JSON-LD references to `brova.vercel.app` in `app/layout.tsx`; SEO data is tenant-derived.
- Admin metadata does not hardcode “Brova Admin”; it reflects the active tenant/store.
- AI agent prompts incorporate tenant/store context, not a single brand name.

### Journey alignment

- A discoverable “publish” workflow exists at the route level (either a dedicated page or an obvious entrypoint from dashboard).
- Admin provides a “preview storefront” action that respects draft/theme changes per tenant.

## Supabase MCP query log (if any)

- None (no DB adjustments performed in this reconnaissance pass).
