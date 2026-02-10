'use server';

/**
 * Cart Management Server Actions
 * Handles shopping cart operations for both anonymous and authenticated users
 *
 * Agent: SONNET (Backend)
 * Used by: CODEX (Frontend) for cart UI components
 */

import { createServerClient } from '@/lib/supabase/server';
import { z } from 'zod';
import type {
  Cart,
  CartItem,
  CartWithItems,
  AddToCartInput,
  UpdateCartItemInput,
  RemoveFromCartInput,
} from '@/types/api';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const addToCartSchema = z.object({
  storeId: z.string().uuid(),
  sessionId: z.string().optional(),
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  quantity: z.number().int().min(1).max(99),
});

const updateCartItemSchema = z.object({
  cartId: z.string().uuid(),
  itemId: z.string().uuid(),
  quantity: z.number().int().min(0).max(99), // 0 = remove item
});

const removeFromCartSchema = z.object({
  cartId: z.string().uuid(),
  itemId: z.string().uuid(),
});

// ============================================================================
// GET CART
// ============================================================================

/**
 * Get or create a cart for the current session/user
 * @param storeId - Store UUID
 * @param sessionId - Optional session ID for anonymous carts
 * @returns Cart with items
 */
export async function getCart(
  storeId: string,
  sessionId?: string
): Promise<{ success: boolean; data?: CartWithItems; error?: string }> {
  try {
    const supabase = await createServerClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let cart: CartWithItems | null = null;

    if (user) {
      // Find cart by customer_id
      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', user.id)
        .eq('store_id', storeId)
        .single();

      if (customer) {
        const { data } = await supabase
          .from('carts')
          .select(
            `
            *,
            items:cart_items(
              *,
              product:store_products(name, name_ar, image_url, slug)
            )
          `
          )
          .eq('store_id', storeId)
          .eq('customer_id', customer.id)
          .eq('status', 'active')
          .single();

        cart = data as CartWithItems | null;
      }
    } else if (sessionId) {
      // Find cart by session_id
      const { data } = await supabase
        .from('carts')
        .select(
          `
          *,
          items:cart_items(
            *,
            product:store_products(name, name_ar, image_url, slug)
          )
        `
        )
        .eq('store_id', storeId)
        .eq('session_id', sessionId)
        .eq('status', 'active')
        .single();

      cart = data as CartWithItems | null;
    }

    // Create new cart if none exists
    if (!cart) {
      const newCartData: any = {
        store_id: storeId,
        status: 'active',
      };

      if (user) {
        // Get or create customer
        let { data: customer } = await supabase
          .from('customers')
          .select('id')
          .eq('user_id', user.id)
          .eq('store_id', storeId)
          .single();

        if (!customer) {
          const { data: newCustomer } = await supabase
            .from('customers')
            .insert({
              store_id: storeId,
              user_id: user.id,
              email: user.email!,
            })
            .select('id')
            .single();

          customer = newCustomer;
        }

        newCartData.customer_id = customer?.id;
      } else if (sessionId) {
        newCartData.session_id = sessionId;
      } else {
        return {
          success: false,
          error: 'Session ID required for anonymous carts',
        };
      }

      const { data: newCart, error } = await supabase
        .from('carts')
        .insert(newCartData)
        .select(
          `
          *,
          items:cart_items(
            *,
            product:store_products(name, name_ar, image_url, slug)
          )
        `
        )
        .single();

      if (error) throw error;
      cart = newCart as CartWithItems;
    }

    return { success: true, data: cart };
  } catch (error: any) {
    console.error('getCart error:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// ADD TO CART
// ============================================================================

/**
 * Add a product to cart or update quantity if already exists
 * @param input - Add to cart parameters
 * @returns Updated cart with items
 */
export async function addToCart(
  input: AddToCartInput
): Promise<{ success: boolean; data?: CartWithItems; error?: string }> {
  try {
    // Validate input
    const validated = addToCartSchema.parse(input);
    const { storeId, sessionId, productId, variantId, quantity } = validated;

    const supabase = await createServerClient();

    // Get or create cart
    const cartResult = await getCart(storeId, sessionId);
    if (!cartResult.success || !cartResult.data) {
      return {
        success: false,
        error: cartResult.error || 'Failed to get cart',
      };
    }

    const cart = cartResult.data;

    // Get product details for snapshot
    const { data: product, error: productError } = await supabase
      .from('store_products')
      .select('name, name_ar, image_url, sku, price')
      .eq('id', productId)
      .single();

    if (productError) throw productError;

    const product_snapshot = {
      name: product.name,
      name_ar: product.name_ar,
      image: product.image_url || '',
      sku: product.sku || undefined,
    };

    // Check if item already exists in cart
    const existingItem = cart.items?.find(
      (item) =>
        item.product_id === productId &&
        (variantId ? item.variant_id === variantId : !item.variant_id)
    );

    if (existingItem) {
      // Update existing item quantity
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: existingItem.quantity + quantity })
        .eq('id', existingItem.id);

      if (error) throw error;
    } else {
      // Add new item
      const { error } = await supabase.from('cart_items').insert({
        cart_id: cart.id,
        product_id: productId,
        variant_id: variantId || null,
        quantity,
        unit_price: product.price,
        product_snapshot,
      });

      if (error) throw error;
    }

    // Fetch updated cart
    const updatedCartResult = await getCart(storeId, sessionId);
    return updatedCartResult;
  } catch (error: any) {
    console.error('addToCart error:', error);
    return {
      success: false,
      error: error.message || 'Failed to add item to cart',
    };
  }
}

// ============================================================================
// UPDATE CART ITEM
// ============================================================================

/**
 * Update cart item quantity (or remove if quantity is 0)
 * @param input - Update parameters
 * @returns Updated cart
 */
export async function updateCartItem(
  input: UpdateCartItemInput
): Promise<{ success: boolean; data?: CartWithItems; error?: string }> {
  try {
    const validated = updateCartItemSchema.parse(input);
    const { cartId, itemId, quantity } = validated;

    const supabase = await createServerClient();

    if (quantity === 0) {
      // Remove item
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
    } else {
      // Update quantity
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', itemId);

      if (error) throw error;
    }

    // Fetch updated cart
    const { data: cart } = await supabase
      .from('carts')
      .select(
        `
        *,
        items:cart_items(
          *,
          product:store_products(name, name_ar, image_url, slug)
        )
      `
      )
      .eq('id', cartId)
      .single();

    return { success: true, data: cart as CartWithItems };
  } catch (error: any) {
    console.error('updateCartItem error:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// REMOVE FROM CART
// ============================================================================

/**
 * Remove an item from the cart
 * @param input - Remove parameters
 * @returns Updated cart
 */
export async function removeFromCart(
  input: RemoveFromCartInput
): Promise<{ success: boolean; data?: CartWithItems; error?: string }> {
  try {
    const validated = removeFromCartSchema.parse(input);
    const { cartId, itemId } = validated;

    const supabase = await createServerClient();

    const { error } = await supabase.from('cart_items').delete().eq('id', itemId);

    if (error) throw error;

    // Fetch updated cart
    const { data: cart } = await supabase
      .from('carts')
      .select(
        `
        *,
        items:cart_items(
          *,
          product:store_products(name, name_ar, image_url, slug)
        )
      `
      )
      .eq('id', cartId)
      .single();

    return { success: true, data: cart as CartWithItems };
  } catch (error: any) {
    console.error('removeFromCart error:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// CLEAR CART
// ============================================================================

/**
 * Remove all items from a cart
 * @param cartId - Cart UUID
 * @returns Success status
 */
export async function clearCart(
  cartId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerClient();

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cartId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('clearCart error:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// MERGE CARTS (on user login)
// ============================================================================

/**
 * Merge anonymous cart with authenticated user cart
 * Called when user logs in
 * @param sessionId - Anonymous session ID
 * @param storeId - Store UUID
 * @returns Success status
 */
export async function mergeCart(
  sessionId: string,
  storeId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Get anonymous cart
    const { data: anonymousCart } = await supabase
      .from('carts')
      .select('id, items:cart_items(*)')
      .eq('session_id', sessionId)
      .eq('store_id', storeId)
      .eq('status', 'active')
      .single();

    if (!anonymousCart || !anonymousCart.items || anonymousCart.items.length === 0) {
      return { success: true }; // Nothing to merge
    }

    // Get user cart
    const userCartResult = await getCart(storeId);
    if (!userCartResult.success || !userCartResult.data) {
      return { success: false, error: 'Failed to get user cart' };
    }

    const userCart = userCartResult.data;

    // Merge items
    for (const item of anonymousCart.items as any[]) {
      await addToCart({
        storeId,
        productId: item.product_id,
        variantId: item.variant_id,
        quantity: item.quantity,
      });
    }

    // Mark anonymous cart as merged
    await supabase
      .from('carts')
      .update({ status: 'merged' })
      .eq('id', anonymousCart.id);

    return { success: true };
  } catch (error: any) {
    console.error('mergeCart error:', error);
    return { success: false, error: error.message };
  }
}
