'use server';

/**
 * Collection Management Server Actions
 * Handles product collection CRUD operations
 *
 * Agent: SONNET (Backend)
 * Used by: CODEX (Frontend) for collection management UI
 */

import { createServerClient } from '@/lib/supabase/server';
import { z } from 'zod';
import type {
  Collection,
  CollectionWithProducts,
  CreateCollectionInput,
  UpdateCollectionInput,
  AddProductToCollectionInput,
  PaginatedResponse,
} from '@/types/api';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createCollectionSchema = z.object({
  storeId: z.string().uuid(),
  name: z.string().min(1).max(255),
  name_ar: z.string().max(255).optional(),
  description: z.string().optional(),
  description_ar: z.string().optional(),
  image_url: z.string().url().optional(),
  featured: z.boolean().optional().default(false),
  visible: z.boolean().optional().default(true),
});

const updateCollectionSchema = z.object({
  collectionId: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  name_ar: z.string().max(255).optional(),
  description: z.string().optional(),
  description_ar: z.string().optional(),
  image_url: z.string().url().optional(),
  featured: z.boolean().optional(),
  visible: z.boolean().optional(),
});

const addProductSchema = z.object({
  collectionId: z.string().uuid(),
  productId: z.string().uuid(),
  sortOrder: z.number().int().min(0).optional(),
});

// ============================================================================
// HELPER: Generate Slug
// ============================================================================

async function generateSlug(storeId: string, name: string): Promise<string> {
  const supabase = await createServerClient();

  // Call database function to generate unique slug
  const { data, error } = await supabase.rpc('generate_collection_slug', {
    p_store_id: storeId,
    p_name: name,
  });

  if (error) {
    // Fallback: generate slug client-side
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .replace(/^-+|-+$/g, '');

    return baseSlug || 'collection';
  }

  return data;
}

// ============================================================================
// GET COLLECTIONS
// ============================================================================

/**
 * Get all collections for a store
 * @param storeId - Store UUID
 * @param visibleOnly - Filter for visible collections only
 * @returns Array of collections
 */
export async function getCollections(
  storeId: string,
  visibleOnly: boolean = false
): Promise<{ success: boolean; data?: Collection[]; error?: string }> {
  try {
    const supabase = await createServerClient();

    let query = supabase
      .from('collections')
      .select('*')
      .eq('store_id', storeId)
      .order('sort_order', { ascending: true });

    if (visibleOnly) {
      query = query.eq('visible', true);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { success: true, data: data as Collection[] };
  } catch (error: any) {
    console.error('getCollections error:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// GET COLLECTION BY ID
// ============================================================================

/**
 * Get a single collection with its products
 * @param collectionId - Collection UUID
 * @returns Collection with products
 */
export async function getCollection(
  collectionId: string
): Promise<{
  success: boolean;
  data?: CollectionWithProducts;
  error?: string;
}> {
  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('collections')
      .select(
        `
        *,
        products:collection_products(
          id,
          product_id,
          sort_order,
          product:store_products(name, name_ar, slug, price, image_url, status)
        )
      `
      )
      .eq('id', collectionId)
      .single();

    if (error) throw error;

    const collection = data as any;
    collection.product_count = collection.products?.length || 0;

    return { success: true, data: collection };
  } catch (error: any) {
    console.error('getCollection error:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// GET COLLECTION BY SLUG
// ============================================================================

/**
 * Get a collection by its slug
 * @param storeId - Store UUID
 * @param slug - Collection slug
 * @returns Collection with products
 */
export async function getCollectionBySlug(
  storeId: string,
  slug: string
): Promise<{
  success: boolean;
  data?: CollectionWithProducts;
  error?: string;
}> {
  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('collections')
      .select(
        `
        *,
        products:collection_products(
          id,
          product_id,
          sort_order,
          product:store_products(name, name_ar, slug, price, image_url, status)
        )
      `
      )
      .eq('store_id', storeId)
      .eq('slug', slug)
      .single();

    if (error) throw error;

    const collection = data as any;
    collection.product_count = collection.products?.length || 0;

    return { success: true, data: collection };
  } catch (error: any) {
    console.error('getCollectionBySlug error:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// CREATE COLLECTION
// ============================================================================

/**
 * Create a new collection
 * @param input - Collection creation parameters
 * @returns Created collection
 */
export async function createCollection(
  input: CreateCollectionInput
): Promise<{ success: boolean; data?: Collection; error?: string }> {
  try {
    const validated = createCollectionSchema.parse(input);
    const { storeId, name, ...rest } = validated;

    const supabase = await createServerClient();

    // Verify store ownership
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { data: store } = await supabase
      .from('stores')
      .select('id, organization_id')
      .eq('id', storeId)
      .single();

    if (!store) {
      return { success: false, error: 'Store not found' };
    }

    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', store.organization_id)
      .eq('owner_id', user.id)
      .single();

    if (!org) {
      return { success: false, error: 'Unauthorized' };
    }

    // Generate slug
    const slug = await generateSlug(storeId, name);

    // Create collection
    const { data, error } = await supabase
      .from('collections')
      .insert({
        store_id: storeId,
        name,
        slug,
        ...rest,
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: data as Collection };
  } catch (error: any) {
    console.error('createCollection error:', error);
    return {
      success: false,
      error: error.message || 'Failed to create collection',
    };
  }
}

// ============================================================================
// UPDATE COLLECTION
// ============================================================================

/**
 * Update a collection
 * @param input - Update parameters
 * @returns Updated collection
 */
export async function updateCollection(
  input: UpdateCollectionInput
): Promise<{ success: boolean; data?: Collection; error?: string }> {
  try {
    const validated = updateCollectionSchema.parse(input);
    const { collectionId, ...updates } = validated;

    const supabase = await createServerClient();

    // If name is updated, regenerate slug
    if (updates.name) {
      const { data: collection } = await supabase
        .from('collections')
        .select('store_id')
        .eq('id', collectionId)
        .single();

      if (collection) {
        const slug = await generateSlug(collection.store_id, updates.name);
        (updates as any).slug = slug;
      }
    }

    const { data, error } = await supabase
      .from('collections')
      .update(updates)
      .eq('id', collectionId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: data as Collection };
  } catch (error: any) {
    console.error('updateCollection error:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// DELETE COLLECTION
// ============================================================================

/**
 * Delete a collection
 * @param collectionId - Collection UUID
 * @returns Success status
 */
export async function deleteCollection(
  collectionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerClient();

    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', collectionId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('deleteCollection error:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// ADD PRODUCT TO COLLECTION
// ============================================================================

/**
 * Add a product to a collection
 * @param input - Add product parameters
 * @returns Success status
 */
export async function addProductToCollection(
  input: AddProductToCollectionInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const validated = addProductSchema.parse(input);
    const { collectionId, productId, sortOrder } = validated;

    const supabase = await createServerClient();

    // Get current max sort_order if not provided
    let finalSortOrder = sortOrder;
    if (finalSortOrder === undefined) {
      const { data } = await supabase
        .from('collection_products')
        .select('sort_order')
        .eq('collection_id', collectionId)
        .order('sort_order', { ascending: false })
        .limit(1)
        .single();

      finalSortOrder = data ? data.sort_order + 1 : 0;
    }

    const { error } = await supabase.from('collection_products').insert({
      collection_id: collectionId,
      product_id: productId,
      sort_order: finalSortOrder,
    });

    if (error) {
      if (error.code === '23505') {
        // Unique constraint violation
        return { success: false, error: 'Product already in collection' };
      }
      throw error;
    }

    return { success: true };
  } catch (error: any) {
    console.error('addProductToCollection error:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// REMOVE PRODUCT FROM COLLECTION
// ============================================================================

/**
 * Remove a product from a collection
 * @param collectionId - Collection UUID
 * @param productId - Product UUID
 * @returns Success status
 */
export async function removeProductFromCollection(
  collectionId: string,
  productId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerClient();

    const { error } = await supabase
      .from('collection_products')
      .delete()
      .eq('collection_id', collectionId)
      .eq('product_id', productId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('removeProductFromCollection error:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// REORDER COLLECTION PRODUCTS
// ============================================================================

/**
 * Reorder products within a collection
 * @param collectionId - Collection UUID
 * @param productOrder - Array of product IDs in desired order
 * @returns Success status
 */
export async function reorderCollectionProducts(
  collectionId: string,
  productOrder: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerClient();

    // Update sort_order for each product
    const updates = productOrder.map((productId, index) =>
      supabase
        .from('collection_products')
        .update({ sort_order: index })
        .eq('collection_id', collectionId)
        .eq('product_id', productId)
    );

    await Promise.all(updates);

    return { success: true };
  } catch (error: any) {
    console.error('reorderCollectionProducts error:', error);
    return { success: false, error: error.message };
  }
}
