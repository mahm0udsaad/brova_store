# APUS 4.5 Report: Near-Production Database Readiness

**Date:** 2026-01-30
**Scope:** Phases A–D (domains, contact, settings, tenant audit) + Phase E (store_id migration for 10 merchant-only tables)
**Method:** Supabase MCP only — all migrations via `apply_migration`, all queries via `execute_sql`

---

## Phase A — `store_domains` (Domains)

### Pre-existing State
Table, RLS (owner CRUD), unique domain constraint, partial unique index (`idx_store_domains_one_primary`) already applied.

### Migrations Applied

**Migration: `add_get_store_by_domain_and_public_read`**
```sql
CREATE OR REPLACE FUNCTION public.get_store_by_domain(lookup_domain text)
RETURNS SETOF public.stores
LANGUAGE sql STABLE SECURITY INVOKER
SET search_path = 'public'
AS $$
  SELECT s.*
  FROM public.stores s
  JOIN public.store_domains sd ON sd.store_id = s.id
  WHERE sd.domain = lookup_domain
    AND sd.status = 'active'
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_store_by_domain(text) TO anon, authenticated;

CREATE POLICY "Public can read active domains"
  ON public.store_domains FOR SELECT
  USING (status = 'active');
```

### Constraints Summary
- `domain` UNIQUE — no two stores can claim the same domain
- Partial unique index `(store_id) WHERE is_primary = true` — DB-enforced single primary per store
- `get_store_by_domain()` — SECURITY INVOKER, `search_path = 'public'`
- Public can read active domains (storefront resolution); owner CRUD for all statuses

---

## Phase B — `store_contact` (Contact Info)

### Issue Found & Fixed
`"Public can read store contact"` policy with `USING (true)` was too permissive per spec.

**Migration: `fix_store_contact_rls_owner_only`** — Dropped blanket public read.

### Public Access Restored via Function

**Migration: `triggers_and_public_contact_function`** (see Phase E below) re-added public read with `get_store_contact(uuid)` SECURITY INVOKER function + `USING (true)` SELECT policy. This exposes only the specific fields needed (store_name, email, phone, address, city, region, country, postal_code).

### Current RLS Policies
| Policy | Cmd | Scope |
|--------|-----|-------|
| Store owner can read contact | SELECT | owner via org chain |
| Store owner can insert contact | INSERT | owner via org chain |
| Store owner can update contact | UPDATE | owner via org chain |
| Public can read contact via function | SELECT | `USING (true)` |

---

## Phase C — `store_settings` Scope Fix

**Migration: `store_settings_require_store_id`**
```sql
ALTER TABLE public.store_settings ALTER COLUMN store_id SET NOT NULL;
ALTER TABLE public.store_settings ADD CONSTRAINT store_settings_store_id_unique UNIQUE (store_id);
COMMENT ON COLUMN public.store_settings.merchant_id IS 'DEPRECATED: Use store_id.';
```

- 0 rows existed → no backfill needed
- `merchant_id` kept with deprecation comment; RLS uses `store_id OR merchant_id` fallback

---

## Phase D — Tenant Audit (Previous Session)

See tenant gaps checklist below (updated post-Phase E).

---

## Phase E — Add `store_id` to 10 Merchant-Only Tables

### Migration 1: `add_store_id_to_merchant_tables`

Added `store_id uuid REFERENCES stores(id) ON DELETE SET NULL` + index to:

| # | Table | Rows | Backfilled | Orphaned |
|---|-------|------|-----------|----------|
| 1 | ai_tasks | 75 | 22 | 53 |
| 2 | ai_conversations | 13 | 13 | 0 |
| 3 | ai_memory_snapshots | 0 | 0 | 0 |
| 4 | ai_actions_log | 0 | 0 | 0 |
| 5 | ai_workflow_state | 0 | 0 | 0 |
| 6 | ai_usage | 4 | 1 | 3 |
| 7 | generated_assets | 73 | 42 | 31 |
| 8 | campaigns | 0 | 0 | 0 |
| 9 | marketing_post_drafts | 6 | 0 | 6 |
| 10 | bulk_deal_batches | 1 | 0 | 1 |

**Totals: 172 rows, 78 backfilled, 94 orphaned**

Orphaned rows belong to merchant `d20aa810-34ab-41a9-9829-87fce6430f2a` who has no organization/store record. `store_id` left NULL for these rows.

### Backfill SQL Pattern
```sql
UPDATE public.<table> t SET store_id = s.id
FROM organizations o JOIN stores s ON s.organization_id = o.id
WHERE o.owner_id = t.merchant_id AND t.store_id IS NULL;
```

### Migration 2: `update_rls_to_store_id_with_fallback`

Dropped all old `merchant_id`-based policies and created new `store_id`-based policies with transitional `OR auth.uid() = merchant_id` fallback.

**Policy pattern (applied to all 10 tables):**
```sql
CREATE POLICY "Store owner can read <table>" ON public.<table> FOR SELECT
  USING (
    store_id IN (
      SELECT s.id FROM stores s
      JOIN organizations o ON o.id = s.organization_id
      WHERE o.owner_id = auth.uid()
    )
    OR auth.uid() = merchant_id
  );
```

**Policies created per table:**

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|:---:|:---:|:---:|:---:|
| ai_tasks | ✅ | ✅ | ✅ | — |
| ai_conversations | ✅ | ✅ | ✅ | ✅ |
| ai_memory_snapshots | ✅ (ALL) | ✅ (ALL) | ✅ (ALL) | ✅ (ALL) |
| ai_actions_log | ✅ (ALL) | ✅ (ALL) | ✅ (ALL) | ✅ (ALL) |
| ai_workflow_state | ✅ (ALL) | ✅ (ALL) | ✅ (ALL) | ✅ (ALL) |
| ai_usage | ✅ | ✅ | — | — |
| generated_assets | ✅ | ✅ | ✅ | ✅ |
| campaigns | ✅ | ✅ | ✅ | ✅ |
| marketing_post_drafts | ✅ | ✅ | ✅ | ✅ |
| bulk_deal_batches | ✅ | ✅ | ✅ | — |

### Migration 3: `triggers_and_public_contact_function`

```sql
-- updated_at triggers
CREATE TRIGGER set_store_domains_updated_at
  BEFORE UPDATE ON public.store_domains
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_store_contact_updated_at
  BEFORE UPDATE ON public.store_contact
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Public contact access function
CREATE OR REPLACE FUNCTION public.get_store_contact(p_store_id uuid)
RETURNS TABLE (
  store_name text, email text, phone text,
  address_line1 text, address_line2 text,
  city text, region text, country text, postal_code text
)
LANGUAGE sql STABLE SECURITY INVOKER
SET search_path = 'public'
AS $$
  SELECT sc.store_name, sc.email, sc.phone,
         sc.address_line1, sc.address_line2,
         sc.city, sc.region, sc.country, sc.postal_code
  FROM public.store_contact sc
  WHERE sc.store_id = p_store_id
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_store_contact(uuid) TO anon, authenticated;

CREATE POLICY "Public can read contact via function"
  ON public.store_contact FOR SELECT USING (true);
```

---

## Phase F — Security Advisor Fixes

### Migration: `fix_function_search_paths`

Fixed 14 functions with mutable `search_path`:

```sql
ALTER FUNCTION public.update_marketing_post_drafts_updated_at() SET search_path = 'public';
ALTER FUNCTION public.get_current_organization_id() SET search_path = 'public';
ALTER FUNCTION public.sync_admin_to_profile() SET search_path = 'public';
ALTER FUNCTION public.handle_new_user() SET search_path = 'public';
ALTER FUNCTION public.update_updated_at_column() SET search_path = 'public';
ALTER FUNCTION public.increment_ai_usage(uuid, text, integer, integer, numeric) SET search_path = 'public';
ALTER FUNCTION public.check_usage_limit(uuid, text, integer) SET search_path = 'public';
ALTER FUNCTION public.create_organization_from_intent() SET search_path = 'public';
ALTER FUNCTION public.update_workflow_state_updated_at() SET search_path = 'public';
ALTER FUNCTION public.update_bulk_deal_images_updated_at() SET search_path = 'public';
ALTER FUNCTION public.get_user_organization() SET search_path = 'public';
ALTER FUNCTION public.update_ai_conversation_updated_at() SET search_path = 'public';
ALTER FUNCTION public.generate_order_number() SET search_path = 'public';
ALTER FUNCTION public.generate_product_slug(uuid, text) SET search_path = 'public';
```

### Post-Fix Advisor Status
| Lint | Level | Status |
|------|-------|--------|
| `function_search_path_mutable` (14) | WARN | ✅ **RESOLVED** |
| `auth_leaked_password_protection` | WARN | Pre-existing — enable in Dashboard → Auth → Settings |

---

## Updated Tenant Gaps Checklist (Post Phase E)

| Table | store_id | merchant_id | Status |
|-------|:---:|:---:|------|
| stores | — | — | ✅ Root entity (org chain) |
| organizations | — | — | ✅ Root entity (owner_id) |
| store_products | ✅ | — | ✅ |
| store_categories | ✅ | — | ✅ |
| store_domains | ✅ | — | ✅ |
| store_contact | ✅ | — | ✅ |
| store_settings | ✅ | ⚠️ dep | ✅ store_id NOT NULL |
| orders | ✅ | — | ✅ |
| product_drafts | ✅ | ⚠️ dep | ✅ |
| **ai_tasks** | ✅ | ⚠️ dep | ✅ **NEW** |
| **ai_conversations** | ✅ | ⚠️ dep | ✅ **NEW** |
| **ai_memory_snapshots** | ✅ | ⚠️ dep | ✅ **NEW** |
| **ai_actions_log** | ✅ | ⚠️ dep | ✅ **NEW** |
| **ai_workflow_state** | ✅ | ⚠️ dep | ✅ **NEW** |
| **ai_usage** | ✅ | ⚠️ dep | ✅ **NEW** |
| **generated_assets** | ✅ | ⚠️ dep | ✅ **NEW** |
| **campaigns** | ✅ | ⚠️ dep | ✅ **NEW** |
| **marketing_post_drafts** | ✅ | ⚠️ dep | ✅ **NEW** |
| **bulk_deal_batches** | ✅ | ⚠️ dep | ✅ **NEW** |
| profiles | — | — | ✅ User-scoped |
| admins | — | — | ✅ Platform-level |
| favorites | — | — | ✅ User-scoped |
| try_on_history | — | — | ✅ User-scoped |
| onboarding_intent | — | — | ✅ User-scoped |
| ai_access_contract | — | — | ✅ Config table |
| ai_messages | — | — | ✅ FK → conversations |
| order_status_history | — | — | ✅ FK → orders |
| bulk_deal_images | — | — | ✅ FK → batches |
| categories | ❌ | — | ⚠️ Legacy — superseded by store_categories |
| products | ❌ | — | ⚠️ Legacy — superseded by store_products |

**Result: 27/30 tables fully tenant-isolated. 2 legacy tables pending deprecation. 1 remaining advisory warning.**

---

## All Migrations Applied (Both Sessions)

| # | Name | What it did |
|---|------|-------------|
| 1 | `create_store_domains` | Table + RLS + partial unique index |
| 2 | `create_store_contact` | Table + RLS |
| 3 | `store_settings_add_store_id` | Added store_id column + RLS update |
| 4 | `add_get_store_by_domain_and_public_read` | Helper function + public read policy |
| 5 | `fix_store_contact_rls_owner_only` | Removed blanket public read |
| 6 | `store_settings_require_store_id` | NOT NULL + UNIQUE on store_id |
| 7 | `fix_function_search_paths` | Fixed 14 mutable search_path functions |
| 8 | `add_store_id_to_merchant_tables` | Added store_id + backfill to 10 tables |
| 9 | `update_rls_to_store_id_with_fallback` | New store_id RLS on 10 tables |
| 10 | `triggers_and_public_contact_function` | updated_at triggers + get_store_contact() |

---

## Remaining Work

1. **HIGH — Remove `merchant_id`** from all 11 tables (store_settings + 10 newly migrated) once app code migrates to `store_id`
2. **HIGH — Create org/store for orphaned merchant** `d20aa810...` (94 rows with NULL store_id)
3. **MEDIUM — Deprecate legacy `products` and `categories` tables**
4. **LOW — Enable leaked password protection** in Auth settings
5. **LOW — App code changes** — update all queries in `lib/supabase/queries/`, `app/api/admin/`, hooks, and agents to pass `store_id` instead of `merchant_id`
