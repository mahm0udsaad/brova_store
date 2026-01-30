# Legacy FK Cleanup Plan: products → store_products Migration

**Date**: 2026-01-30
**Scope**: Safe migration from legacy `products`/`categories` tables to tenant-scoped `store_products`/`store_categories`
**Status**: Planning phase - NO changes made yet

## Executive Summary

The system currently has a dual-table architecture:
- **Legacy tables**: `products` (52 rows), `categories` (6 rows) - not tenant-scoped
- **New tables**: `store_products` (33 rows), `store_categories` (0 rows) - tenant-scoped

All 33 `store_products` already have `legacy_product_id` mappings, but several tables still reference the legacy `products` table directly via foreign keys. This plan outlines safe migration steps to complete the transition.

## Current Foreign Key Dependencies

### Tables Referencing Legacy Products

| Table | Column | References | Row Count | Complexity |
|-------|--------|------------|-----------|------------|
| `favorites` | `product_id` | `products.id` | 0 | LOW (no data) |
| `generated_assets` | `product_id` | `products.id` | 73 | MEDIUM (most references) |
| `try_on_history` | `product_id` | `products.id` | 18 | LOW-MEDIUM |
| `products` | `category_id` | `categories.id` | 52 | LOW (internal to legacy) |

### Not a Foreign Key (but important)

| Table | Column | Type | Row Count | Notes |
|-------|--------|------|-----------|-------|
| `store_products` | `legacy_product_id` | `text` | 33 (all populated) | Mapping field, no FK constraint |

## Migration Strategy

### Phase 1: Extend Referencing Tables (SAFE - Additive Only)

**Goal**: Add new tenant-scoped columns alongside legacy columns

#### 1.1 Add `store_product_id` to `favorites`
```sql
ALTER TABLE favorites
  ADD COLUMN store_product_id UUID REFERENCES store_products(id);

COMMENT ON COLUMN favorites.store_product_id IS
  'Tenant-scoped product reference. Replaces legacy product_id.';
```

**Impact**: None - additive only, no data changes

#### 1.2 Add `store_product_id` to `generated_assets`
```sql
ALTER TABLE generated_assets
  ADD COLUMN store_product_id UUID REFERENCES store_products(id);

COMMENT ON COLUMN generated_assets.store_product_id IS
  'Tenant-scoped product reference. Replaces legacy product_id.';
```

**Impact**: None - additive only

#### 1.3 Add `store_product_id` to `try_on_history`
```sql
ALTER TABLE try_on_history
  ADD COLUMN store_product_id UUID REFERENCES store_products(id);

COMMENT ON COLUMN try_on_history.store_product_id IS
  'Tenant-scoped product reference. Replaces legacy product_id.';
```

**Impact**: None - additive only

### Phase 2: Data Backfill (SAFE - Read-Only Validation First)

**Goal**: Populate new columns by mapping legacy IDs to store_product IDs

#### 2.1 Backfill `favorites` (0 rows - skip or future-proof)
```sql
-- No data to backfill, but add for future records
UPDATE favorites f
SET store_product_id = sp.id
FROM store_products sp
WHERE sp.legacy_product_id = f.product_id
  AND f.store_product_id IS NULL;
```

**Validation**:
```sql
SELECT COUNT(*) as unmapped_count
FROM favorites
WHERE product_id IS NOT NULL
  AND store_product_id IS NULL;
-- Expected: 0
```

#### 2.2 Backfill `generated_assets` (73 rows)
```sql
UPDATE generated_assets ga
SET store_product_id = sp.id
FROM store_products sp
WHERE sp.legacy_product_id = ga.product_id
  AND ga.store_product_id IS NULL;
```

**Validation**:
```sql
-- Check for unmapped records
SELECT COUNT(*) as unmapped_count
FROM generated_assets
WHERE product_id IS NOT NULL
  AND store_product_id IS NULL;

-- Verify mapping correctness
SELECT
  ga.id,
  ga.product_id as legacy_id,
  ga.store_product_id as new_id,
  sp.legacy_product_id as sp_legacy_ref
FROM generated_assets ga
LEFT JOIN store_products sp ON sp.id = ga.store_product_id
WHERE ga.store_product_id IS NOT NULL
LIMIT 10;
```

**Risk**: If any products in `generated_assets` don't have corresponding `store_products` entries, they'll remain unmapped. This needs investigation.

#### 2.3 Backfill `try_on_history` (18 rows)
```sql
UPDATE try_on_history th
SET store_product_id = sp.id
FROM store_products sp
WHERE sp.legacy_product_id = th.product_id
  AND th.store_product_id IS NULL;
```

**Validation**:
```sql
SELECT COUNT(*) as unmapped_count
FROM try_on_history
WHERE product_id IS NOT NULL
  AND store_product_id IS NULL;
```

### Phase 3: Update Application Code (CRITICAL - Code Changes Required)

**Goal**: Update all application code to use `store_product_id` instead of `product_id`

#### 3.1 Audit Code References
```bash
# Find all references to legacy product_id columns
grep -r "product_id" app/ components/ lib/ --include="*.ts" --include="*.tsx"

# Find Supabase queries using products table
grep -r "from('products')" app/ lib/ --include="*.ts" --include="*.tsx"
```

#### 3.2 Update Queries
- Replace all `.from('products')` with `.from('store_products')`
- Replace all `product_id` foreign key queries with `store_product_id`
- Update any joins or filters

#### 3.3 Update TypeScript Types
- Update interfaces to use `store_product_id: string` instead of `product_id: string`
- Add migration path for API compatibility if needed

### Phase 4: Soft Deprecation (SAFE - Validation Period)

**Goal**: Run both columns in parallel for a validation period

#### 4.1 Add Application Warnings
```typescript
// Example warning in dev/staging
if (process.env.NODE_ENV !== 'production') {
  if (record.product_id && !record.store_product_id) {
    console.warn('Legacy product_id used without store_product_id mapping');
  }
}
```

#### 4.2 Monitor Usage
- Log any queries still using legacy `product_id`
- Monitor for unmapped records
- Validate data consistency

**Duration**: 2-4 weeks in production

### Phase 5: Hard Cutover (BREAKING - Requires Downtime)

**Goal**: Remove legacy columns and foreign keys

⚠️ **BREAKING CHANGES - Only after Phase 4 validation passes**

#### 5.1 Drop Foreign Key Constraints
```sql
-- Drop FK constraints referencing legacy products
ALTER TABLE favorites DROP CONSTRAINT IF EXISTS favorites_product_id_fkey;
ALTER TABLE generated_assets DROP CONSTRAINT IF EXISTS generated_assets_product_id_fkey;
ALTER TABLE try_on_history DROP CONSTRAINT IF EXISTS try_on_history_product_id_fkey;
```

#### 5.2 Rename Columns (Preserve Data)
```sql
-- Rename old columns to _legacy suffix (don't drop yet)
ALTER TABLE favorites RENAME COLUMN product_id TO product_id_legacy;
ALTER TABLE generated_assets RENAME COLUMN product_id TO product_id_legacy;
ALTER TABLE try_on_history RENAME COLUMN product_id TO product_id_legacy;

-- Rename new columns to primary names
ALTER TABLE favorites RENAME COLUMN store_product_id TO product_id;
ALTER TABLE generated_assets RENAME COLUMN store_product_id TO product_id;
ALTER TABLE try_on_history RENAME COLUMN store_product_id TO product_id;
```

#### 5.3 Archive Legacy Tables (Don't Drop)
```sql
-- Rename to _archive suffix for safety
ALTER TABLE products RENAME TO products_archive;
ALTER TABLE categories RENAME TO categories_archive;

-- Disable RLS to prevent accidental access
ALTER TABLE products_archive DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories_archive DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE products_archive IS
  'ARCHIVED: Legacy products table. Use store_products instead. Kept for historical reference.';
```

### Phase 6: Final Cleanup (DESTRUCTIVE - After 3+ Months)

⚠️ **DATA LOSS RISK - Only after extended validation**

#### 6.1 Drop Legacy Columns
```sql
ALTER TABLE favorites DROP COLUMN IF EXISTS product_id_legacy;
ALTER TABLE generated_assets DROP COLUMN IF EXISTS product_id_legacy;
ALTER TABLE try_on_history DROP COLUMN IF EXISTS product_id_legacy;
```

#### 6.2 Drop Archive Tables (Optional)
```sql
-- ONLY if absolutely certain and after full backup
DROP TABLE IF EXISTS products_archive CASCADE;
DROP TABLE IF EXISTS categories_archive CASCADE;
```

## Risk Assessment

| Phase | Risk Level | Rollback Difficulty | Recommended Validation |
|-------|------------|---------------------|------------------------|
| Phase 1 | LOW | EASY (just drop columns) | Schema inspection |
| Phase 2 | LOW | EASY (data still in old columns) | Row count validation |
| Phase 3 | MEDIUM | MODERATE (code deploy required) | Staging testing, feature flags |
| Phase 4 | MEDIUM | MODERATE (monitoring period) | 2-4 weeks production validation |
| Phase 5 | HIGH | DIFFICULT (requires emergency deploy) | Full backup, rehearsal in staging |
| Phase 6 | CRITICAL | VERY DIFFICULT (data loss) | 3+ months of stable operation |

## Rollback Plans

### Phase 1-2 Rollback
```sql
-- Simply drop the new columns
ALTER TABLE favorites DROP COLUMN IF EXISTS store_product_id;
ALTER TABLE generated_assets DROP COLUMN IF EXISTS store_product_id;
ALTER TABLE try_on_history DROP COLUMN IF EXISTS store_product_id;
```

### Phase 3-4 Rollback
- Revert code changes via git
- Redeploy previous version
- New columns remain (harmless)

### Phase 5 Rollback
```sql
-- Rename columns back
ALTER TABLE favorites RENAME COLUMN product_id TO store_product_id;
ALTER TABLE favorites RENAME COLUMN product_id_legacy TO product_id;
-- Repeat for other tables

-- Restore FK constraints
ALTER TABLE favorites ADD CONSTRAINT favorites_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES products(id);
-- Repeat for other tables
```

## Pre-Migration Checklist

- [ ] Full database backup created
- [ ] Staging environment mirrors production
- [ ] All tests passing in current state
- [ ] Code audit complete (all product_id references documented)
- [ ] Downtime window scheduled (for Phase 5)
- [ ] Rollback plan tested in staging
- [ ] Team trained on new schema
- [ ] Monitoring/alerting configured

## Open Questions

1. **Unmapped Products**: Are there products in `generated_assets`/`try_on_history` that don't have `store_products` mappings?
   - Need to query: `SELECT DISTINCT product_id FROM generated_assets WHERE product_id NOT IN (SELECT legacy_product_id FROM store_products)`

2. **Categories Migration**: Do we need to migrate `categories` → `store_categories` simultaneously?
   - Current `store_categories` has 0 rows, suggesting this is incomplete

3. **API Compatibility**: Do we need to maintain legacy API endpoints during migration?

4. **Data Archival**: What's the policy for keeping archived tables? 3 months? 1 year?

## Recommended Timeline

| Phase | Duration | Notes |
|-------|----------|-------|
| Phase 1 | 1 day | Add columns (deploy during low traffic) |
| Phase 2 | 1-2 days | Backfill + validate |
| Phase 3 | 1-2 weeks | Code changes + review + testing |
| Phase 4 | 2-4 weeks | Production validation period |
| Phase 5 | 1 day | Hard cutover (schedule downtime) |
| Phase 6 | After 3+ months | Final cleanup (optional) |

**Total estimated time**: 6-8 weeks from start to Phase 5 completion

## Success Criteria

- ✅ Zero unmapped records in referencing tables
- ✅ All application code uses `store_product_id` (or new `product_id` after Phase 5)
- ✅ RLS policies enforce tenant isolation on all product queries
- ✅ No production errors related to product references
- ✅ Legacy tables archived (not dropped) for safety
- ✅ Full rollback plan tested and documented

## Notes

- This is a **planning document only** - no migrations have been applied
- Each phase should be reviewed and approved before execution
- Always test in staging before production
- Maintain backwards compatibility as long as possible
- Archive, don't delete - storage is cheap, data recovery is expensive
