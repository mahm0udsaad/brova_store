/**
 * API Request and Response Type Definitions
 * Central type definitions for API endpoints and Server Actions
 *
 * Agent Ownership:
 * - SONNET owns this file for backend-related types
 * - CODEX contributes UI-related types
 * - APUS contributes AI-related types
 */

// ============================================================================
// CART TYPES (SONNET)
// ============================================================================

export interface Cart {
  id: string;
  store_id: string;
  customer_id?: string | null;
  session_id?: string | null;
  status: 'active' | 'abandoned' | 'converted' | 'merged';
  items_count: number;
  subtotal: number;
  created_at: string;
  updated_at: string;
  abandoned_at?: string | null;
  converted_at?: string | null;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  variant_id?: string | null;
  variant_options?: Record<string, string> | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
  product_snapshot?: {
    name: string;
    name_ar?: string;
    image: string;
    sku?: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface CartWithItems extends Cart {
  items: (CartItem & {
    product?: {
      name: string;
      name_ar?: string;
      image_url?: string;
      slug: string;
    };
  })[];
}

export interface AddToCartInput {
  storeId: string;
  sessionId?: string;
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface UpdateCartItemInput {
  cartId: string;
  itemId: string;
  quantity: number;
}

export interface RemoveFromCartInput {
  cartId: string;
  itemId: string;
}

// ============================================================================
// COLLECTION TYPES (SONNET)
// ============================================================================

export interface Collection {
  id: string;
  store_id: string;
  name: string;
  name_ar?: string | null;
  slug: string;
  description?: string | null;
  description_ar?: string | null;
  image_url?: string | null;
  featured: boolean;
  visible: boolean;
  sort_order: number;
  auto_rules?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface CollectionWithProducts extends Collection {
  products: {
    id: string;
    product_id: string;
    sort_order: number;
    product: {
      name: string;
      name_ar?: string;
      slug: string;
      price: number;
      image_url?: string;
      status: string;
    };
  }[];
  product_count: number;
}

export interface CreateCollectionInput {
  storeId: string;
  name: string;
  name_ar?: string;
  description?: string;
  description_ar?: string;
  image_url?: string;
  featured?: boolean;
  visible?: boolean;
}

export interface UpdateCollectionInput {
  collectionId: string;
  name?: string;
  name_ar?: string;
  description?: string;
  description_ar?: string;
  image_url?: string;
  featured?: boolean;
  visible?: boolean;
}

export interface AddProductToCollectionInput {
  collectionId: string;
  productId: string;
  sortOrder?: number;
}

// ============================================================================
// PRODUCT VARIANT TYPES (SONNET)
// ============================================================================

export interface ProductVariant {
  id: string;
  product_id: string;
  store_id: string;
  options: Record<string, string>; // {size: 'M', color: 'Blue'}
  sku?: string | null;
  price?: number | null;
  compare_at_price?: number | null;
  inventory_quantity: number;
  inventory_policy: 'deny' | 'continue';
  weight?: number | null;
  weight_unit: 'kg' | 'g' | 'lb' | 'oz';
  image_url?: string | null;
  available: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  store_id: string;
  url: string;
  alt_text?: string | null;
  alt_text_ar?: string | null;
  variant_id?: string | null;
  sort_order: number;
  is_primary: boolean;
  ai_generated: boolean;
  ai_asset_id?: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// THEME TYPES (SONNET + CODEX)
// TODO(@CODEX): Define ComponentNode interface structure
// ============================================================================

export interface ComponentNode {
  id: string;
  type: string; // 'HeroBanner' | 'ProductGrid' | 'ProductCarousel' | etc.
  config: Record<string, unknown>;
  children?: ComponentNode[];
  order: number;
  visible: boolean;
}

export interface ThemeConfig {
  id: string;
  store_id: string;
  component_tree: ComponentNode[];
  active_theme: 'fashion' | 'electronics' | 'general' | 'custom';
  custom_colors: Record<string, string>;
  custom_fonts: Record<string, string>;
  version: number;
  created_at: string;
  updated_at: string;
}

// TODO(@CODEX): Define these action inputs based on theme system requirements
export interface AddComponentInput {
  storeId: string;
  sectionId: string;
  componentType: string;
  config: Record<string, unknown>;
}

export interface UpdateComponentInput {
  storeId: string;
  componentId: string;
  updates: Partial<ComponentNode>;
}

export interface ReorderComponentsInput {
  storeId: string;
  sectionId: string;
  newOrder: string[]; // Array of component IDs
}

// ============================================================================
// ORDER TYPES (SONNET)
// ============================================================================

export interface Order {
  id: string;
  store_id?: string | null;
  user_id?: string | null;
  order_number: string;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  address: string;
  phone: string;
  full_name: string;
  subtotal: number;
  shipping_fee: number;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_status?: string | null;
  payment_method?: string | null;
  stripe_payment_intent_id?: string | null;
  stripe_checkout_session_id?: string | null;
  paid_at?: string | null;
  currency: string;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  store_id: string;
  product_id?: string | null;
  product_snapshot: {
    name: string;
    name_ar?: string;
    image_url?: string;
    sku?: string;
    price: number;
  };
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

export interface CreateOrderInput {
  storeId: string;
  cartId: string;
  customerInfo: {
    full_name: string;
    email?: string;
    phone: string;
    address: string;
  };
  paymentMethod: string;
  shippingFee?: number;
}

// ============================================================================
// STORE SETTINGS TYPES (SONNET)
// ============================================================================

export interface StoreSettings {
  id: string;
  store_id: string;
  ai_preferences: {
    daily_limits?: {
      text_tokens?: number;
      bulk_batches?: number;
      image_generation?: number;
      screenshot_analysis?: number;
    };
    default_image_style?: string;
    auto_suggest_pricing?: boolean;
    auto_generate_descriptions?: boolean;
  };
  appearance: Record<string, unknown>; // Legacy - use theme_config instead
  theme_config: {
    hero?: Record<string, unknown>;
    colors?: Record<string, string>;
    footer?: Record<string, unknown>;
    layout?: Record<string, unknown>;
    branding?: Record<string, unknown>;
    typography?: Record<string, unknown>;
  };
  shipping: {
    zones?: string[];
    enabled?: boolean;
    flat_rate_amount?: number;
    flat_rate_enabled?: boolean;
    free_shipping_threshold?: number;
  };
  notifications: {
    sms_on_order?: boolean;
    email_on_order?: boolean;
    ai_task_completion?: boolean;
  };
  updated_at: string;
}

export interface UpdateStoreSettingsInput {
  storeId: string;
  settings: Partial<Omit<StoreSettings, 'id' | 'store_id' | 'updated_at'>>;
}

// ============================================================================
// SOCIAL MEDIA TYPES (SONNET + APUS)
// TODO(@APUS): Extend with platform-specific metadata
// ============================================================================

export interface SocialMediaConnection {
  id: string;
  store_id: string;
  platform: 'tiktok' | 'instagram' | 'facebook' | 'twitter';
  platform_user_id?: string | null;
  platform_username?: string | null;
  platform_display_name?: string | null;
  status: 'active' | 'expired' | 'revoked' | 'error';
  last_error?: string | null;
  scope?: string | null;
  expires_at?: string | null;
  connected_at: string;
  last_refreshed_at?: string | null;
  last_used_at?: string | null;
}

// ============================================================================
// AI TYPES (APUS)
// TODO(@APUS): Define AI tool schemas and response types
// ============================================================================

// Placeholder for APUS to fill in
export interface AIToolResponse {
  // TODO(@APUS): Define structure
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  error: string;
  message: string;
  code?: string;
  details?: unknown;
}

export interface ApiSuccess<T = unknown> {
  success: true;
  data?: T;
  message?: string;
}
