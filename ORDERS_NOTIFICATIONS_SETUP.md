# Orders & Notifications System - Setup Guide

This guide will help you set up the complete orders and notifications system with real-time updates, WhatsApp integration, and user activity tracking.

## 🎯 Features Implemented

✅ **Order Management System**
- Complete order tracking with status updates
- Real-time order updates using Supabase Realtime
- Order history and timeline
- Admin order management dashboard

✅ **Notification System**
- Push notification permission modal after sign-in
- Real-time notifications for order updates
- Notification center for users
- Browser push notifications

✅ **User Activity Tracking**
- Track all user interactions
- WhatsApp message tracking
- Call tracking
- Order view tracking
- Admin action logging

✅ **Communication Tools**
- WhatsApp direct messaging integration
- Click-to-call functionality
- Email integration
- Activity history for each user

✅ **Admin Dashboard**
- Beautiful mobile-first UI
- Order filtering and search
- Quick status updates
- User contact actions
- Real-time order monitoring

## 📋 Setup Instructions

### 1. Set Up Supabase Database

Run the SQL migration to create all necessary tables:

```bash
# Navigate to your project directory
cd /Users/mahmoudmac/Projects/brova/y

# Run the migration using Supabase CLI or copy the SQL to your Supabase dashboard
supabase migration new orders_system
# Then copy the contents of scripts/003-create-orders-system.sql
```

Or manually in Supabase Dashboard:
1. Go to SQL Editor
2. Copy the contents of `scripts/003-create-orders-system.sql`
3. Run the query

### 2. Enable Realtime

In your Supabase Dashboard:
1. Go to Database → Replication
2. Enable realtime for these tables:
   - `orders`
   - `notifications`
   - `order_status_history`

### 3. Update Types

Generate TypeScript types for the new tables:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/supabase.ts
```

### 4. Configure Admin Access

To mark a user as admin, run this SQL in Supabase:

```sql
-- Replace USER_EMAIL with the actual admin email
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'admin@brova.com';
```

### 5. Set Up WhatsApp Business (Optional but Recommended)

For production WhatsApp integration:
1. Get a WhatsApp Business account
2. Get API access from WhatsApp Business Platform
3. Update the WhatsApp link format in the admin dashboard if needed

Current format works with regular WhatsApp:
```typescript
const whatsappUrl = `https://wa.me/${phone}?text=${message}`
```

### 6. Configure Push Notifications

For production push notifications:
1. Create a service worker file: `public/sw.js`
2. Register service worker in your app
3. Use Firebase Cloud Messaging or similar for push notifications

Basic service worker example:
```javascript
// public/sw.js
self.addEventListener('push', function(event) {
  const data = event.data.json()
  self.registration.showNotification(data.title, {
    body: data.message,
    icon: '/icon-192x192.jpg',
    badge: '/icon-192x192.jpg'
  })
})
```

## 📱 User Flow

### For Customers:

1. **Sign In** → Notification permission modal appears
2. **Allow Notifications** → Preferences saved to database
3. **Place Order** → Order created with "pending" status
4. **Receive Updates** → Real-time notifications when order status changes
5. **Track Order** → View order history and timeline in `/orders`

### For Admins:

1. **Access Admin Dashboard** → Navigate to `/admin/orders`
2. **View Orders** → See all orders with filtering and search
3. **Update Status** → Change order status with optional comment
4. **Contact Customer** → Use WhatsApp, Call, or Email buttons
5. **View Activity** → Check user history and interactions

## 🗂️ Database Schema

### Tables Created:

1. **orders** - Main orders table
   - Order details, customer info, items, status
   - Automatic order number generation
   - RLS policies for users and admins

2. **order_status_history** - Track status changes
   - Timestamp of each status change
   - Optional comments
   - Changed by user tracking

3. **user_preferences** - User notification settings
   - Push notification preferences
   - Email/SMS preferences
   - Push tokens

4. **notifications** - User notifications
   - Order update notifications
   - Read/unread status
   - Automatic creation on status change

5. **user_activity_log** - Activity tracking
   - WhatsApp messages sent
   - Calls made
   - Emails sent
   - Order views
   - Admin actions

## 🔄 Real-time Updates

The system uses Supabase Realtime for instant updates:

**Admin Dashboard:**
- Automatically updates when new orders come in
- Shows status changes in real-time
- Updates order details when viewing

**User Orders Page:**
- Shows status updates immediately
- Displays notifications instantly
- Updates order timeline in real-time

## 🎨 UI/UX Features

### Mobile-First Design:
- Optimized for mobile devices
- Touch-friendly buttons
- Haptic feedback on interactions
- Smooth animations with Framer Motion

### Status Visualization:
- Color-coded status badges
- Icon-based status indicators
- Progress timeline
- Clear visual hierarchy

### Communication Tools:
- One-tap WhatsApp messaging
- Click-to-call functionality
- Pre-filled message templates
- Activity logging

## 📍 Pages Created

1. **`/admin/orders`** - Admin order management
2. **`/orders`** - User orders tracking
3. **Notification Modal** - Auto-shows after sign-in

## 🔧 Components Created

1. **`notification-permission-modal.tsx`** - Request notification permissions
2. **`orders-page-client.tsx`** - Admin dashboard
3. **`user-orders-page-client.tsx`** - User orders view

## 📚 Utility Functions

Check `lib/orders.ts` for helper functions:
- `createOrder()` - Create new order
- `getUserOrders()` - Get user's orders
- `updateOrderStatus()` - Update order status
- `logUserActivity()` - Log user actions
- `getUserNotifications()` - Get user notifications
- `markNotificationAsRead()` - Mark notification as read

## 🚀 Testing

### Test Order Creation:
```typescript
import { createOrder } from "@/lib/orders"

const orderData = {
  customer_name: "John Doe",
  customer_phone: "+201234567890",
  customer_email: "john@example.com",
  shipping_address: {
    street: "123 Main St",
    city: "Cairo",
    country: "Egypt"
  },
  items: [
    {
      product_id: "prod_123",
      name: "Black Hoodie",
      quantity: 1,
      size: "L",
      price: 500
    }
  ],
  total_amount: 500,
  payment_method: "cash_on_delivery"
}

const { data, error } = await createOrder(orderData)
```

### Test Status Update:
```typescript
import { updateOrderStatus } from "@/lib/orders"

await updateOrderStatus(
  orderId,
  "shipped",
  "Order shipped via Aramex. Tracking: 123456789"
)
```

## 🔐 Security

- Row Level Security (RLS) enabled on all tables
- Users can only see their own orders
- Admins can see and manage all orders
- Activity logging for audit trails
- Secure notification delivery

## 📈 Future Enhancements

Consider adding:
- SMS notifications via Twilio
- Email notifications via SendGrid
- Push notifications via FCM
- WhatsApp Business API integration
- Order analytics dashboard
- Customer segmentation
- Automated status updates based on shipping provider
- Multi-language support
- Export orders to CSV/Excel

## 🐛 Troubleshooting

### Notifications not showing:
1. Check browser notification permissions
2. Verify Supabase Realtime is enabled
3. Check notification preferences in database

### Orders not updating:
1. Verify RLS policies are correctly set
2. Check Supabase Realtime subscription
3. Verify admin role is set correctly

### WhatsApp not opening:
1. Check phone number format (must include country code)
2. Verify WhatsApp is installed on device
3. Check URL encoding of message

## 📞 Support

For issues or questions:
1. Check Supabase logs for errors
2. Review browser console for client errors
3. Verify database migrations ran successfully
4. Test with different user roles (admin vs regular user)

---

**Built with ❤️ for Brova**
- Mobile-first design
- Real-time updates
- Beautiful UI/UX
- Production-ready
