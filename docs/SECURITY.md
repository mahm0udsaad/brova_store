# Security Architecture

## 1. Authentication & Middleware

### Request Flow (`middleware.ts`)

Every request goes through this pipeline:

1. **Skip** static files and Next.js internals
2. **Resolve tenant** from `Host` header (subdomain-based, no DB lookup at edge)
3. **Run i18n** middleware for page routes (API routes skip this)
4. **Set** `x-tenant-slug` header on response for downstream server components
5. **Refresh** Supabase auth session via `@supabase/ssr`
6. **Protect admin routes**:
   - `/api/admin/*` → returns `401 JSON` if no session
   - `/admin/*` → redirects to `/{locale}/admin-login?redirect={path}` if no session
   - Login paths (`/admin-login`, `/login`) are excluded from auth checks

### Tenant Resolution

- `localhost` → defaults to `brova`
- `{slug}.brova.app` / `{slug}.vercel.app` → extracts subdomain
- Custom domains → resolved server-side via `resolveTenant()` (requires DB lookup, not done at edge)

## 2. Admin Authorization

All admin queries flow through `getAdminStoreContext()` (in `admin-store.ts`):

```
auth.getUser() → organizations (owner_id = user.id) → stores (organization_id = org.id)
```

This ensures **every admin query is scoped to `store_id`**, preventing cross-tenant data access. Used consistently in:
- `admin-wallet.ts`, `admin-customers.ts`, `admin-notifications.ts`, `admin-dashboard.ts`
- All server actions (`theme.ts`, `store-lifecycle.ts`, `banners.ts`, `shipping.ts`)

### Admin vs Store Owner

Currently a **single-owner model**:
- Each `organization` has one `owner_id` (FK to `auth.users`)
- Each organization has one `store`
- No staff/editor roles exist yet — the owner has full admin access

## 3. Row Level Security (RLS) Policies

### Public Read (Storefront)

| Table | Policy | Conditions |
|-------|--------|------------|
| `stores` | `Public can read active stores` | `status = 'active'` |
| `store_products` | `Public can read active products in active stores` | `product.status = 'active' AND store.status = 'active'` |
| `store_banners` | `Public can read active banners for active stores` | `is_active = true`, within date range, `store.status = 'active'` |

**`store_settings`** does NOT have a public read policy. The storefront resolves themes statically from `stores.theme_id` via the theme registry — no runtime query to `store_settings.theme_config`.

### Owner-Only Access

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `customers` | Owner | Owner | Owner | Owner |
| `notifications` | Owner | System (open) | Owner | — |
| `wallet_balances` | Owner | Owner | Owner | — |
| `wallet_transactions` | Owner | System (open) | — | — |
| `orders` | Owner OR ordering user | Open | Owner | — |
| `store_preview_tokens` | Owner | Owner | Owner | Owner |

### Known Advisories

The following INSERT policies use `WITH CHECK (true)` (open insert):
- `notifications` → "System can insert notifications"
- `order_items` → "System can insert order items"
- `wallet_transactions` → "System can insert transactions"

These are intentional for system/webhook-driven inserts but should be tightened to `service_role` only if server-side insert paths are migrated to use the service role key.

## 4. Preview Token Security

Preview tokens allow viewing draft stores before publishing.

| Property | Value |
|----------|-------|
| Generation | `crypto.randomBytes(32)` — 256-bit entropy |
| Expiry | 24 hours (`expires_at` column) |
| Reusability | Multi-use until expiry (shareable preview links) |
| Cleanup | Expired tokens deleted on each new token creation |
| Validation | Server-side via `validatePreviewToken()` — checks expiry, deletes stale |
| Delivery | `?preview={token}` query parameter |
| Storage | `store_preview_tokens` table, `token` column has UNIQUE constraint |
| RLS | Owner-only (ALL operations gated by `store_id` ownership) |

### Flow
1. Store owner calls `createPreviewToken()` → gets token + expiry
2. Shares URL like `https://store.brova.app?preview={token}`
3. Storefront middleware/page checks token via `validatePreviewToken()`
4. If valid + not expired → renders storefront despite `stores.status = 'draft'`
5. If expired or invalid → 404

## 5. Store Publishing Flow

```
validateStoreForPublishing()
  ├── Check auth (getUser → org → store)
  ├── Check active_products count > 0
  ├── Check store.name exists
  └── Check store.store_type exists

publishStore()
  ├── Run validation
  ├── Set stores.status = 'active', published_at = now()
  └── revalidatePath('/')

unpublishStore()
  ├── Check auth
  ├── Set stores.status = 'draft'
  └── revalidatePath('/')
```

When a store is `draft`:
- `Public can read active stores` RLS policy blocks anon access
- `Public can read active products in active stores` blocks product browsing
- Only preview tokens bypass this (checked application-side)

## 6. Input Validation

- **Theme colors**: Validated against `/^#[0-9A-Fa-f]{6}$/` via Zod schemas
- **AI color extraction**: Output validated with `ColorAnalysisSchema` (Zod)
- **Customer search**: `%` characters escaped to prevent SQL wildcard injection
- **Banner operations**: Always scoped to `store_id` via `getAdminStoreContext()`
- **Store lifecycle actions**: All gated by `getAuthenticatedStore()` helper

## 7. Function Search Path

Two functions have mutable search paths (flagged by Supabase linter):
- `public.update_updated_at_column`
- `public.create_store_wallet`

**Remediation**: Set `search_path = ''` on these functions. See [Supabase docs](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable).

## 8. Auth Configuration

- **Leaked password protection**: Currently disabled. Recommended to enable via Supabase dashboard. See [password security docs](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
