import { createClient } from "@/lib/supabase/client"

export interface CreateOrderData {
  user_id?: string
  customer_name: string
  customer_email?: string
  customer_phone: string
  shipping_address: any
  items: any[]
  total_amount: number
  payment_method?: string
  notes?: string
}

/**
 * Create a new order
 */
export async function createOrder(orderData: CreateOrderData) {
  const supabase = createClient()
  
  try {
    // Get the user if authenticated
    const { data: { user } } = await supabase.auth.getUser()
    
    // Generate order number
    const { data: orderNumberData, error: orderNumberError } = await supabase
      .rpc("generate_order_number")
    
    if (orderNumberError) {
      throw orderNumberError
    }
    
    // Create the order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        ...orderData,
        user_id: user?.id || orderData.user_id,
        order_number: orderNumberData,
        status: "pending",
        currency: "EGP",
      })
      .select()
      .single()
    
    if (orderError) {
      throw orderError
    }
    
    return { data: order, error: null }
  } catch (error) {
    console.error("Error creating order:", error)
    return { data: null, error }
  }
}

/**
 * Get orders for the current user
 */
export async function getUserOrders() {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { data: null, error: new Error("Not authenticated") }
  }
  
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_status_history (
        *
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
  
  return { data, error }
}

/**
 * Get a single order by ID
 */
export async function getOrder(orderId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_status_history (
        *
      )
    `)
    .eq("id", orderId)
    .single()
  
  return { data, error }
}

/**
 * Update order status (admin only)
 */
export async function updateOrderStatus(
  orderId: string,
  status: string,
  comment?: string
) {
  const supabase = createClient()
  
  try {
    // Update order status
    const { error: orderError } = await supabase
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", orderId)
    
    if (orderError) {
      throw orderError
    }
    
    // Add status history with comment
    if (comment) {
      const { error: historyError } = await supabase
        .from("order_status_history")
        .insert({
          order_id: orderId,
          status,
          comment,
        })
      
      if (historyError) {
        throw historyError
      }
    }
    
    return { error: null }
  } catch (error) {
    console.error("Error updating order status:", error)
    return { error }
  }
}

/**
 * Log user activity
 */
export async function logUserActivity(
  userId: string,
  actionType: string,
  actionData?: any,
  orderId?: string
) {
  const supabase = createClient()
  
  const { error } = await supabase.from("user_activity_log").insert({
    user_id: userId,
    order_id: orderId,
    action_type: actionType,
    action_data: actionData || {},
  })
  
  if (error) {
    console.error("Error logging user activity:", error)
  }
}

/**
 * Get user notifications
 */
export async function getUserNotifications() {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { data: null, error: new Error("Not authenticated") }
  }
  
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)
  
  return { data, error }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId)
  
  return { error }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead() {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: new Error("Not authenticated") }
  }
  
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("read", false)
  
  return { error }
}
