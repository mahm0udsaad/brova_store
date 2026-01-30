# Multi-Tenant DB & Security Migration Report

**Date:** 2026-01-30
**Migrations Applied:** 3

---

## Task A — Orders Tenant Scoping (CRITICAL)

### Schema Changes
**Migration:** `add_store_id_to_orders`

```sql
ALTER TABLE public.orders ADD COLUMN store_id uuid REFERENCES public.stores(id);
CREATE INDEX idx_orders_store_id ON public.orders(store_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
```

### RLS Policies Replaced

| Table | Old Policy | New Policy | Scope |
|-------|-----------|------------|-------|
| `orders` | `Users can view own orders` | `orders_select_policy` | Customer (user_id) OR store admin (org→store chain) |
| `orders` | `Users can create orders` | `orders_insert_policy` | Customer (user_id = auth.uid() or NULL) |
| `orders` | — | `orders_update_policy` | Store admin only (org→store chain) |
| `order_status_history` | `Authenticated users can insert status history` | `osh_insert_policy` | Order owner OR store admin |
| `order_status_history` | `Users can view own order status history` | `osh_select_policy` | Order owner OR store admin |

**Admin detection logic:** `stores.id = orders.store_id → organizations.owner_id = auth.uid()`

### Verification
- Column `store_id` confirmed present on `orders`
- Indexes confirmed: `idx_orders_store_id`, `idx_orders_status`, `idx_orders_user_id`
- 9 total policies across `orders`, `order_status_history`, `ai_access_contract`

---

## Task B — SECURITY INVOKER Views

**Migration:** `convert_views_to_security_invoker`

All 5 views recreated with `WITH (security_invoker = true)`:

| View | Change | Notes |
|------|--------|-------|
| `platform_products` | SECURITY INVOKER | No column changes |
| `ai_products` | SECURITY INVOKER | No column changes |
| `ai_store_summary` | SECURITY INVOKER | No column changes |
| `ai_orders` | SECURITY INVOKER + added `store_id` | Dropped & recreated (column order change) |
| `ai_catalog_stats` | SECURITY INVOKER | No column changes |

**Impact:** These views previously ran as `postgres` (owner), bypassing all RLS on underlying tables. Now queries through these views respect the caller's RLS policies.

---

## Task C — RLS on ai_access_contract

**Migration:** `enable_rls_ai_access_contract`

```sql
ALTER TABLE public.ai_access_contract ENABLE ROW LEVEL SECURITY;
```

| Policy | Command | Condition |
|--------|---------|-----------|
| `ai_access_contract_select_admin` | SELECT | `admins.id = auth.uid()` |
| `ai_access_contract_insert_admin` | INSERT | `admins.id = auth.uid()` |
| `ai_access_contract_update_admin` | UPDATE | `admins.id = auth.uid()` |
| `ai_access_contract_delete_admin` | DELETE | `admins.id = auth.uid()` |

---

## Security Advisors (Post-Migration)

No new RLS advisories. Existing warnings are all `function_search_path_mutable` on 14 functions — these are pre-existing and unrelated to this migration.

---

## Risks & Assumptions

1. **Existing orders have `store_id = NULL`** — The 1 existing order row needs backfilling. App code that creates orders must be updated to pass `store_id`.
2. **Admin detection uses `organizations.owner_id`** — This assumes one owner per org. If team member roles are added later, the RLS policies need expansion.
3. **SECURITY INVOKER views** require callers to have RLS access to underlying tables (`store_products`, `stores`, `organizations`, `orders`). Service-role calls are unaffected.

## App Code Follow-ups Required

1. **Order creation** — Update checkout flow to include `store_id` when inserting into `orders`.
2. **Admin order queries** — Admin pages querying `ai_orders` now get `store_id` column for filtering.
3. **Backfill script** — Run `UPDATE orders SET store_id = '<store-uuid>' WHERE store_id IS NULL` for existing orders.
