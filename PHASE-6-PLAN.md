# Brova Project — Phase 6 Implementation Plan

**Status:** Planning
**Estimated Timeline:** 4-5 days
**Goal:** Store migration + legacy database cleanup

---

## 🎯 Phase 6 Objectives

### 6.1 Store Migration System
Enable merchants to import their stores from competing platforms

### 6.2 Legacy Foreign Key Cleanup
Migrate legacy product references to multi-tenant store_product_id

---

## 📋 Detailed Implementation Plan

## PART 1: Store Migration System (4 days)

### 1.1 Platform Detection & Web Scraping

**New File: `lib/migration/scraper.ts`**

```typescript
// Platform detection
function detectPlatform(storeUrl: string): 'salla' | 'shopify' | 'woocommerce' | 'unknown'

// Scraper implementations
class SallaStoreScraper {
  // Scrape Salla store (Arabic e-commerce platform)
  // - Products (name, description, price, images, SKU)
  // - Categories (name, description)
  // - Product attributes (color, size, etc.)
  // - Store info (name, logo, description)
}

class ShopifyScraper {
  // Use Shopify Storefront GraphQL API
  // - Products with variants
  // - Collections/categories
  // - Store metadata
}

class WooCommerceScraper {
  // Use WooCommerce REST API
  // - Products with variations
  // - Categories
  // - Store info
}
```

**Tasks:**
- [ ] Detect platform by URL/headers
- [ ] Build Salla scraper (HTML parsing)
- [ ] Build Shopify scraper (GraphQL client)
- [ ] Build WooCommerce scraper (REST client)
- [ ] Handle pagination
- [ ] Extract product images
- [ ] Handle authentication if needed

---

### 1.2 AI-Powered Field Mapping & Translation

**New File: `lib/migration/normalizer.ts`**

```typescript
interface RawProduct {
  [key: string]: any  // Platform-specific fields
}

interface NormalizedProduct {
  name: string
  name_ar: string
  description: string
  description_ar: string
  price: number
  category: string
  category_ar: string
  sku?: string
  images: string[]
  attributes?: Record<string, string>
}

// Main normalization function
async function normalizeProducts(
  products: RawProduct[],
  sourcePlatform: string,
  targetLanguage: 'ar' | 'en'
): Promise<NormalizedProduct[]>

// Field mapping using Claude AI
async function mapFieldsAI(
  sourceFields: string[],
  sourcePlatform: string,
  targetSchema: string
): Promise<Record<string, string>>

// Translation with context
async function translateProductsAI(
  products: RawProduct[],
  fromLanguage: 'ar' | 'en',
  toLanguage: 'ar' | 'en'
): Promise<NormalizedProduct[]>
```

**Tasks:**
- [ ] Build field mapping AI (Claude)
- [ ] Create schema definitions for each platform
- [ ] Implement normalization logic
- [ ] Add translation with business context
- [ ] Handle missing/invalid fields
- [ ] Validate output format

---

### 1.3 Batch Import with Image Reupload

**New File: `lib/migration/importer.ts`**

```typescript
interface ImportOptions {
  storeId: string
  products: NormalizedProduct[]
  uploadImages: boolean
  deleteExisting: boolean
}

async function importProducts(options: ImportOptions): Promise<{
  imported: number
  failed: number
  errors: ImportError[]
}>

// Image handling
async function reuploadProductImages(
  imageUrls: string[],
  storeId: string
): Promise<string[]>  // Returns new URLs in Supabase Storage

// Batch insert with transaction
async function batchInsertProducts(
  storeId: string,
  products: NormalizedProduct[]
): Promise<{ success: number; failed: number }>
```

**Tasks:**
- [ ] Download images from source store
- [ ] Upload to Supabase Storage
- [ ] Batch insert to store_products table
- [ ] Handle transaction rollback on error
- [ ] Track import progress
- [ ] Update migration status
- [ ] Handle duplicate detection

---

### 1.4 Migration API Endpoints

**New File: `app/api/migration/route.ts`**

```typescript
// POST /api/migration/analyze
// Request: { storeUrl, sourcePlatform? }
// Response: { platform, productCount, categories, errors }
// - Detect platform and analyze store
// - Count products to import
// - Identify potential issues

// POST /api/migration/start
// Request: { storeId, sourceUrl, sourcePlatform?, options }
// Response: { taskId, estimatedTime }
// - Create migration task
// - Submit async job
// - Return tracking ID

// GET /api/migration/status?taskId={id}
// Response: { status, progress, processed, total, errors, results }
// - Check import progress
// - Return real-time status
// - List any errors encountered

// Possible statuses: analyzing, scraping, processing, importing, completed, failed
```

**Tasks:**
- [ ] Implement `/analyze` endpoint
- [ ] Implement `/start` endpoint
- [ ] Implement `/status` endpoint
- [ ] Add authentication
- [ ] Add rate limiting
- [ ] Add error handling

---

### 1.5 Database Table

**New Migration: `add_store_migration_tasks_table`**

```sql
CREATE TABLE store_migration_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL,
  source_platform TEXT,
  status TEXT NOT NULL DEFAULT 'analyzing',
  -- analyzing, scraping, processing, importing, completed, failed

  -- Progress tracking
  progress_percent INTEGER DEFAULT 0,
  total_items INTEGER,
  processed_items INTEGER DEFAULT 0,
  imported_items INTEGER DEFAULT 0,
  failed_items INTEGER DEFAULT 0,

  -- Results
  results JSONB,  -- { imported: 100, failed: 3, errors: [...] }
  error TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  INDEX (store_id),
  INDEX (status)
);
```

**Tasks:**
- [ ] Create migration
- [ ] Add RLS policies
- [ ] Add indexes for performance

---

## PART 2: Legacy Foreign Key Cleanup (1 day)

### 2.1 Add store_product_id Columns

**New Migration: `add_legacy_fk_columns`**

```sql
-- Add new columns to tables that reference legacy products
ALTER TABLE favorites
ADD COLUMN store_product_id uuid REFERENCES store_products(id);

ALTER TABLE generated_assets
ADD COLUMN store_product_id uuid REFERENCES store_products(id);

ALTER TABLE try_on_history
ADD COLUMN store_product_id uuid REFERENCES store_products(id);

-- Create mapping table for reference
CREATE TABLE IF NOT EXISTS product_legacy_mapping (
  legacy_product_id uuid PRIMARY KEY,
  store_product_id uuid NOT NULL REFERENCES store_products(id),
  store_id uuid NOT NULL REFERENCES stores(id),
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX (store_id)
);
```

**Tasks:**
- [ ] Add store_product_id to favorites
- [ ] Add store_product_id to generated_assets
- [ ] Add store_product_id to try_on_history
- [ ] Create product_legacy_mapping table
- [ ] Add indexes
- [ ] Add RLS policies

---

### 2.2 Data Migration (Phase 3 - Deferred)

**Note:** The following is deferred to Phase 3+ when all legacy products are fully mapped.

```typescript
// Migration script (run manually after mapping complete)
async function migrateDataToNewForeignKeys(): Promise<void> {
  const supabase = await createServerClient()

  // Step 1: Populate mapping table
  // Match legacy_product_id → store_product_id using product names/SKUs

  // Step 2: Backfill favorites.store_product_id
  // SELECT legacy_product_id FROM favorites
  // JOIN product_legacy_mapping USING (legacy_product_id)
  // UPDATE favorites SET store_product_id = mapping.store_product_id

  // Step 3: Backfill generated_assets.store_product_id
  // Similar pattern

  // Step 4: Backfill try_on_history.store_product_id
  // Similar pattern

  // Step 5: Update RLS policies to use store_product_id
}
```

---

## 🔧 Implementation Checklist

### Phase 6.1 Store Migration

**Week 1:**
- [ ] Build web scraper for Salla (HTML parsing)
- [ ] Build web scraper for Shopify (GraphQL)
- [ ] Build web scraper for WooCommerce (REST API)
- [ ] Implement field mapping AI
- [ ] Implement translation engine
- [ ] Build image reupload system

**Week 2:**
- [ ] Create importer with batch processing
- [ ] Build migration API endpoints
- [ ] Create store_migration_tasks table
- [ ] Add RLS policies
- [ ] Write integration tests
- [ ] Build status polling in UI

### Phase 6.2 Legacy FK Cleanup

**Week 2 (Partial):**
- [ ] Add store_product_id columns
- [ ] Create product_legacy_mapping table
- [ ] Add indexes and RLS
- [ ] Write migration script (deferred execution)
- [ ] Document migration process

---

## 📊 Expected Outcomes

### Phase 6.1 Enables:
- ✅ Migrate stores from Salla
- ✅ Migrate stores from Shopify
- ✅ Migrate stores from WooCommerce
- ✅ Auto-translate to Arabic
- ✅ Track import progress
- ✅ Handle large catalogs (1000+ products)

### Phase 6.2 Enables:
- ✅ Multi-tenant product references
- ✅ Proper data isolation
- ✅ Future schema flexibility
- ✅ RLS enforcement at column level

---

## 🚀 Dependencies

### Required Packages:
- `cheerio` - HTML parsing (Salla)
- `apollo-client` - GraphQL (Shopify)
- `axios` - HTTP requests (WooCommerce)
- `form-data` - File uploads

### External APIs:
- Salla Storefront (public)
- Shopify Storefront GraphQL
- WooCommerce REST API
- Supabase Storage (for images)

### AI Models:
- Claude 3.5 Sonnet (field mapping)
- Gemini Flash (translation)

---

## 🛡️ Security Considerations

1. **URL Validation**
   - Whitelist allowed domains
   - Prevent SSRF attacks
   - Rate limit per store

2. **Image Handling**
   - Validate image URLs
   - Scan for malware (ClamAV)
   - Set max image size

3. **Data Privacy**
   - Don't log sensitive data
   - Encrypt stored URLs
   - Delete raw import data after processing

4. **Rate Limiting**
   - Max 1 import per store per day
   - Max 10k products per import
   - Throttle API calls to source stores

---

## 📈 Success Criteria

✅ Phase 6.1 Complete When:
- [ ] All 3 platforms can be imported
- [ ] 100+ test products imported successfully
- [ ] Image reupload working
- [ ] Progress tracking functional
- [ ] Error handling comprehensive
- [ ] API endpoints tested

✅ Phase 6.2 Complete When:
- [ ] All legacy columns added
- [ ] Mapping table populated
- [ ] Migration script written
- [ ] RLS policies verified
- [ ] No data loss in migration

---

## 🔄 After Phase 6

Once Phase 6 is complete:

**Phase 7: Polish + Testing + Deploy (3-4 days)**
- Error boundaries & loading states
- SEO & metadata
- Full test suite
- Vercel deployment
- Production monitoring

---

## 📝 Notes for Implementation

1. **Scraper Resilience**
   - Handle timeouts (30s max per product)
   - Retry failed requests (3 attempts)
   - Log all errors for debugging

2. **Performance**
   - Batch imports in chunks of 100
   - Use database transactions
   - Cache image URLs before reupload

3. **User Communication**
   - Show progress bar
   - List any warnings/errors
   - Provide download of import report

4. **Testing**
   - Test with 10 products first
   - Test with 100+ products
   - Test with slow internet
   - Test image failures

---

**Status:** Ready for Phase 6 Implementation
**Next Action:** Begin with store scraping modules
