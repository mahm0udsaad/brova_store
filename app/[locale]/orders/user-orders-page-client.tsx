"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  PackageCheck,
  ArrowLeft,
  Bell,
  ChevronRight,
  MapPin,
  DollarSign,
  Calendar,
} from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { triggerHaptic } from "@/lib/haptics"
import { BottomNav } from "@/components/bottom-nav"
import { Header } from "@/components/header"
import { useCart } from "@/hooks/use-cart"
import { useLocale, useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js"

interface Order {
  id: string
  order_number: string
  status: string
  total_amount: number
  customer_name: string
  customer_phone: string
  shipping_address: any
  items: any[]
  created_at: string
  updated_at: string
  tracking_number?: string
  order_status_history?: any[]
}

interface Notification {
  id: string
  title: string
  message: string
  read: boolean
  created_at: string
  type: string
}

const getStatusConfig = (t: ReturnType<typeof useTranslations>) => ({
  pending: { label: t("status.pending"), icon: Clock, color: "text-yellow-500", bg: "bg-yellow-500/10" },
  confirmed: { label: t("status.confirmed"), icon: CheckCircle2, color: "text-blue-500", bg: "bg-blue-500/10" },
  processing: { label: t("status.processing"), icon: Package, color: "text-purple-500", bg: "bg-purple-500/10" },
  shipped: { label: t("status.shipped"), icon: Truck, color: "text-indigo-500", bg: "bg-indigo-500/10" },
  out_for_delivery: { label: t("status.outForDelivery"), icon: Truck, color: "text-orange-500", bg: "bg-orange-500/10" },
  delivered: { label: t("status.delivered"), icon: PackageCheck, color: "text-green-500", bg: "bg-green-500/10" },
  cancelled: { label: t("status.cancelled"), icon: XCircle, color: "text-red-500", bg: "bg-red-500/10" },
})

export default function UserOrdersPageClient({ 
  initialOrders, 
  initialNotifications 
}: { 
  initialOrders: Order[]
  initialNotifications: Notification[]
}) {
  const locale = useLocale()
  const t = useTranslations("ordersPage")
  const statusConfig = getStatusConfig(t)
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", {
      style: "currency",
      currency: "EGP",
    }).format(value)
  const isRtl = locale === "ar"
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showNotifications, setShowNotifications] = useState(false)
  const { itemCount } = useCart()

  // Subscribe to real-time updates
  useEffect(() => {
    const supabase = createClient()
    
    // Subscribe to order updates
    const ordersChannel = supabase
      .channel("user-orders")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        (payload: RealtimePostgresChangesPayload<Order>) => {
          if (payload.eventType === "INSERT") {
            setOrders((prev) => [payload.new as Order, ...prev])
          } else if (payload.eventType === "UPDATE") {
            setOrders((prev) =>
              prev.map((order) => (order.id === payload.new.id ? (payload.new as Order) : order))
            )
          }
        }
      )
      .subscribe()

    // Subscribe to notification updates
    const notificationsChannel = supabase
      .channel("user-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload: RealtimePostgresChangesPayload<Notification>) => {
          setNotifications((prev) => [payload.new as Notification, ...prev])
          
          // Show browser notification if permitted
          if (Notification.permission === "granted") {
            const notif = payload.new as Notification
            new Notification(notif.title, {
              body: notif.message,
              icon: "/icon-192x192.jpg",
              badge: "/icon-192x192.jpg",
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(ordersChannel)
      supabase.removeChannel(notificationsChannel)
    }
  }, [])

  const markNotificationAsRead = async (notificationId: string) => {
    const supabase = createClient()
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId)
    
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    )
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  if (selectedOrder) {
    return (
      <OrderDetailView
        order={selectedOrder}
        onBack={() => setSelectedOrder(null)}
        statusConfig={statusConfig}
        formatCurrency={formatCurrency}
        locale={locale}
      />
    )
  }

  return (
    <div className="min-h-screen bg-background pt-14 pb-bottom-nav">
      <div className="max-w-md mx-auto px-4">
        {/* Header */}
        <Header
          showLogo
          leftAction={
            <Link href={`/${locale}`}>
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className={cn("w-5 h-5", isRtl && "-scale-x-100")} />
              </Button>
            </Link>
          }
          rightAction={
            <button
              onClick={() => {
                triggerHaptic("light")
                setShowNotifications(!showNotifications)
              }}
              className="relative p-2 rounded-full hover:bg-muted transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          }
        />

        {/* Page Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="my-6"
        >
          <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
          <p className="text-muted-foreground">
            {t("subtitle")}
          </p>
        </motion.div>

        {/* Notifications Panel */}
        <AnimatePresence>
          {showNotifications && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="bg-card border rounded-2xl p-4">
                <h3 className="font-semibold mb-3">{t("notifications.title")}</h3>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {t("notifications.empty")}
                    </p>
                  ) : (
                    notifications.map((notification) => (
                      <button
                        key={notification.id}
                        onClick={() => {
                          triggerHaptic("light")
                          markNotificationAsRead(notification.id)
                        }}
                        className={`w-full text-left p-3 rounded-xl transition-colors ${
                          notification.read ? "bg-muted/50" : "bg-primary/10"
                        }`}
                      >
                        <p className="font-medium text-sm">{notification.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(notification.created_at).toLocaleString(locale === "ar" ? "ar-EG" : "en-US")}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Orders List */}
        <div className="space-y-4 mb-6">
          {orders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">{t("emptyTitle")}</h3>
              <p className="text-muted-foreground mb-6">
                {t("emptySubtitle")}
              </p>
              <Link href={`/${locale}`}>
                <Button>{t("browseProducts")}</Button>
              </Link>
            </motion.div>
          ) : (
            orders.map((order, index) => (
              <OrderCard
                key={order.id}
                order={order}
                index={index}
                statusConfig={statusConfig}
                formatCurrency={formatCurrency}
                locale={locale}
                onClick={() => {
                  triggerHaptic("light")
                  setSelectedOrder(order)
                }}
              />
            ))
          )}
        </div>
      </div>

      <BottomNav cartCount={itemCount} />
    </div>
  )
}

function OrderCard({ order, index, onClick, statusConfig, formatCurrency, locale }: any) {
  const t = useTranslations("ordersPage")
  const isRtl = locale === "ar"
  const config = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className="bg-card border rounded-2xl p-4 cursor-pointer hover:shadow-lg transition-all active:scale-[0.98]"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1">{t("orderNumber")}</p>
          <p className="font-mono font-semibold">{order.order_number}</p>
        </div>
        <ChevronRight className={cn("w-5 h-5 text-muted-foreground", isRtl && "-scale-x-100")} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className={`p-3 rounded-xl ${config.bg}`}>
          <Icon className={`w-5 h-5 ${config.color}`} />
        </div>
        <div className="flex-1">
          <p className={`font-semibold ${config.color}`}>{config.label}</p>
          <p className="text-sm text-muted-foreground">
            {t("itemCount", { count: order.items?.length || 0 })}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t">
        <div className="text-sm text-muted-foreground">
          {new Date(order.created_at).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US")}
        </div>
        <div className="text-lg font-bold">{formatCurrency(order.total_amount)}</div>
      </div>
    </motion.div>
  )
}

function OrderDetailView({ order, onBack, statusConfig, formatCurrency, locale }: { order: Order; onBack: () => void; statusConfig: any; formatCurrency: (value: number) => string; locale: string }) {
  const t = useTranslations("ordersPage")
  const isRtl = locale === "ar"
  const config = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending
  const Icon = config.icon

  return (
    <div className="min-h-screen bg-background pt-14 pb-bottom-nav">
      <div className="max-w-md mx-auto px-4">
        {/* Header */}
        <Header
          showLogo={false}
          leftAction={
            <Button variant="ghost" size="icon" className="rounded-full" onClick={onBack}>
              <ArrowLeft className={cn("w-5 h-5", isRtl && "-scale-x-100")} />
            </Button>
          }
        />

        {/* Order Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 my-6"
        >
          {/* Order Number */}
          <div>
            <p className="text-sm text-muted-foreground mb-1">{t("orderNumber")}</p>
            <p className="text-2xl font-mono font-bold">{order.order_number}</p>
          </div>

          {/* Status Card */}
          <div className="bg-card border rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-4 rounded-2xl ${config.bg}`}>
                <Icon className={`w-8 h-8 ${config.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("statusTitle")}</p>
                <p className={`text-xl font-bold ${config.color}`}>{config.label}</p>
              </div>
            </div>

            {order.tracking_number && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-1">{t("trackingNumber")}</p>
                <p className="font-mono font-semibold">{order.tracking_number}</p>
              </div>
            )}
          </div>

          {/* Timeline */}
          {(() => {
            const historyEntries = order.order_status_history ?? []
            if (historyEntries.length === 0) return null
            return (
            <div className="bg-card border rounded-2xl p-6">
              <h3 className="font-semibold mb-4">{t("timelineTitle")}</h3>
              <div className="space-y-4">
                {historyEntries.map((history: any, index: number) => {
                  const historyConfig = statusConfig[history.status as keyof typeof statusConfig]
                  const HistoryIcon = historyConfig?.icon || Clock
                  
                  return (
                    <div key={history.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`p-2 rounded-full ${historyConfig?.bg || "bg-muted"}`}>
                          <HistoryIcon className={`w-4 h-4 ${historyConfig?.color || "text-muted-foreground"}`} />
                        </div>
                        {index < historyEntries.length - 1 && (
                          <div className="w-0.5 flex-1 bg-muted my-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="font-medium">{historyConfig?.label || history.status}</p>
                        {history.comment && (
                          <p className="text-sm text-muted-foreground mt-1">{history.comment}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(history.created_at).toLocaleString(locale === "ar" ? "ar-EG" : "en-US")}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
          })()}

          {/* Items */}
          <div className="bg-card border rounded-2xl p-6">
            <h3 className="font-semibold mb-4">{t("itemsTitle")}</h3>
            <div className="space-y-3">
              {order.items?.map((item: any, index: number) => (
                <div key={index} className="flex justify-between py-3 border-b last:border-0">
                  <div>
                    <p className="font-medium">{item.name || item.product_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.size
                        ? t("itemMetaWithSize", { count: item.quantity, size: item.size })
                        : t("itemMeta", { count: item.quantity })}
                    </p>
                  </div>
                  <p className="font-semibold">{formatCurrency(item.price)}</p>
                </div>
              ))}
              <div className="flex justify-between pt-3 text-lg font-bold">
                <span>{t("total")}</span>
                <span>{formatCurrency(order.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-card border rounded-2xl p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              {t("shippingAddress")}
            </h3>
            <p className="text-muted-foreground">
              {typeof order.shipping_address === "string"
                ? order.shipping_address
                : JSON.stringify(order.shipping_address, null, 2)}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
