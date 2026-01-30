"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Package,
  Phone,
  MessageCircle,
  Mail,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  PackageCheck,
  ArrowLeft,
  ArrowRight,
  Search,
  Filter,
  ChevronDown,
  User,
  MapPin,
  DollarSign,
  Calendar,
  MoreVertical,
  Eye,
  History,
  Bell,
  MessageSquare,
} from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { triggerHaptic } from "@/lib/haptics"
import { useLocale, useTranslations } from "next-intl"
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js"

interface Order {
  id: string
  order_number: string
  status: string
  total: number
  customer_name: string
  customer_phone: string
  customer_email?: string
  shipping_address: any
  items: any[]
  created_at: string
  updated_at: string
  tracking_number?: string
  notes?: string
  admin_notes?: string
  user_id?: string
  order_status_history?: any[]
}

interface OrdersPageClientProps {
  initialOrders: Order[]
}

type StatusConfig = {
  label: string
  icon: typeof Clock
  color: string
  badge: string
}

export default function OrdersPageClient({ initialOrders }: OrdersPageClientProps) {
  const locale = useLocale()
  const t = useTranslations("admin")
  const isRtl = locale === "ar"
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [isUpdating, setIsUpdating] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [userActivity, setUserActivity] = useState<any[]>([])
  const statusConfig: Record<string, StatusConfig> = {
    pending: { label: t("ordersPage.status.pending"), icon: Clock, color: "text-yellow-500 bg-yellow-500/10", badge: "bg-yellow-500" },
    confirmed: { label: t("ordersPage.status.confirmed"), icon: CheckCircle2, color: "text-blue-500 bg-blue-500/10", badge: "bg-blue-500" },
    processing: { label: t("ordersPage.status.processing"), icon: Package, color: "text-purple-500 bg-purple-500/10", badge: "bg-purple-500" },
    shipped: { label: t("ordersPage.status.shipped"), icon: Truck, color: "text-indigo-500 bg-indigo-500/10", badge: "bg-indigo-500" },
    out_for_delivery: { label: t("ordersPage.status.outForDelivery"), icon: Truck, color: "text-orange-500 bg-orange-500/10", badge: "bg-orange-500" },
    delivered: { label: t("ordersPage.status.delivered"), icon: PackageCheck, color: "text-green-500 bg-green-500/10", badge: "bg-green-500" },
    cancelled: { label: t("ordersPage.status.cancelled"), icon: XCircle, color: "text-red-500 bg-red-500/10", badge: "bg-red-500" },
  }

  const buildHref = (href: string) => (href === "/" ? `/${locale}` : `/${locale}${href}`)
  const BackIcon = isRtl ? ArrowRight : ArrowLeft

  // Subscribe to real-time order updates
  useEffect(() => {
    const supabase = createClient()
    
    const channel = supabase
      .channel("orders-changes")
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
            if (selectedOrder?.id === payload.new.id) {
              setSelectedOrder(payload.new as Order)
            }
          } else if (payload.eventType === "DELETE") {
            setOrders((prev) => prev.filter((order) => order.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedOrder])

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      (order.order_number?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (order.customer_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (order.customer_phone || '').includes(searchQuery)
    
    const matchesFilter = filterStatus === "all" || order.status === filterStatus
    
    return matchesSearch && matchesFilter
  })

  // Load user activity when order is selected
  useEffect(() => {
    if (selectedOrder?.user_id) {
      loadUserActivity(selectedOrder.user_id, selectedOrder.id)
    }
  }, [selectedOrder])

  const loadUserActivity = async (userId: string, orderId: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from("user_activity_log")
      .select("*")
      .or(`user_id.eq.${userId},order_id.eq.${orderId}`)
      .order("created_at", { ascending: false })
      .limit(20)
    
    if (data) {
      setUserActivity(data)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string, comment?: string) => {
    setIsUpdating(true)
    triggerHaptic("light")
    
    try {
      const supabase = createClient()
      
      // Update order status
      const { error: orderError } = await supabase
        .from("orders")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", orderId)

      if (orderError) throw orderError

      // Add status history with comment
      if (comment) {
        await supabase
          .from("order_status_history")
          .insert({
            order_id: orderId,
            status: newStatus,
            comment,
          })
      }

      // Log activity
      await supabase.from("user_activity_log").insert({
        user_id: selectedOrder?.user_id,
        order_id: orderId,
        action_type: "status_updated",
        action_data: { old_status: selectedOrder?.status, new_status: newStatus, comment },
      })

      // Send SMS notification automatically
      if (selectedOrder?.customer_phone) {
        try {
          await fetch("/api/admin/send-order-sms", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId,
              phone: selectedOrder.customer_phone,
              status: newStatus,
              trackingNumber: selectedOrder.tracking_number,
            }),
          })
        } catch (smsError) {
          console.error("Error sending SMS notification:", smsError)
          // Don't fail the status update if SMS fails
        }
      }

      triggerHaptic("success")
    } catch (error) {
      console.error("Error updating order:", error)
      triggerHaptic("error")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleWhatsAppMessage = async (phone: string, orderNumber: string) => {
    triggerHaptic("medium")
    
    const message = encodeURIComponent(t("ordersPage.whatsappMessage", { orderNumber }))
    
    // Log activity
    const supabase = createClient()
    await supabase.from("user_activity_log").insert({
      user_id: selectedOrder?.user_id,
      order_id: selectedOrder?.id,
      action_type: "whatsapp_sent",
      action_data: { phone, order_number: orderNumber },
    })

    // Open WhatsApp
    const whatsappUrl = `https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${message}`
    window.open(whatsappUrl, "_blank")
  }

  const handleCall = async (phone: string) => {
    triggerHaptic("medium")
    
    // Log activity
    const supabase = createClient()
    await supabase.from("user_activity_log").insert({
      user_id: selectedOrder?.user_id,
      order_id: selectedOrder?.id,
      action_type: "call_initiated",
      action_data: { phone },
    })

    window.location.href = `tel:${phone}`
  }

  const handleEmail = async (email: string) => {
    triggerHaptic("medium")
    
    // Log activity
    const supabase = createClient()
    await supabase.from("user_activity_log").insert({
      user_id: selectedOrder?.user_id,
      order_id: selectedOrder?.id,
      action_type: "email_opened",
      action_data: { email },
    })

    window.location.href = `mailto:${email}`
  }

  const handleSMS = async (phone: string, orderNumber: string, status: string) => {
    triggerHaptic("medium")
    
    try {
      const response = await fetch("/api/admin/send-order-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: selectedOrder?.id,
          phone,
          status,
          trackingNumber: selectedOrder?.tracking_number,
        }),
      })

      const data = await response.json()

      if (data.success) {
        triggerHaptic("success")
        alert(t("ordersPage.smsSuccess"))
      } else {
        triggerHaptic("error")
        alert(t("ordersPage.smsError", { error: data.error }))
      }
    } catch (error) {
      console.error("Error sending SMS:", error)
      triggerHaptic("error")
      alert(t("ordersPage.smsErrorGeneric"))
    }
  }

  if (selectedOrder) {
    return <OrderDetailsView 
      order={selectedOrder}
      onBack={() => setSelectedOrder(null)}
      onStatusUpdate={updateOrderStatus}
      onWhatsApp={handleWhatsAppMessage}
      onCall={handleCall}
      onEmail={handleEmail}
      onSMS={handleSMS}
      isUpdating={isUpdating}
      userActivity={userActivity}
      statusConfig={statusConfig}
      t={t}
      locale={locale}
      backIcon={BackIcon}
    />
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Link href={buildHref("/admin")}>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <BackIcon className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">{t("ordersPage.title")}</h1>
                <p className="text-sm text-muted-foreground">
                  {filteredOrders.length === 1
                    ? t("ordersPage.countSingle")
                    : t("ordersPage.countMultiple", { count: filteredOrders.length })}
                </p>
              </div>
            </div>
            
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={() => {
                triggerHaptic("light")
                setShowFilters(!showFilters)
              }}
            >
              <Filter className="w-5 h-5" />
            </Button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder={t("ordersPage.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full ps-10 pe-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                  <FilterButton
                    label={t("ordersPage.filters.all")}
                    active={filterStatus === "all"}
                    onClick={() => setFilterStatus("all")}
                    count={orders.length}
                  />
                  {Object.entries(statusConfig).map(([status, config]) => (
                    <FilterButton
                      key={status}
                      label={config.label}
                      active={filterStatus === status}
                      onClick={() => setFilterStatus(status)}
                      count={orders.filter((o) => o.status === status).length}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Orders List */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredOrders.map((order, index) => (
            <OrderCard
              key={order.id}
              order={order}
              index={index}
              onClick={() => {
                triggerHaptic("light")
                setSelectedOrder(order)
              }}
              statusConfig={statusConfig}
              t={t}
              locale={locale}
            />
          ))}
        </div>

        {filteredOrders.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">{t("ordersPage.emptyTitle")}</h3>
            <p className="text-muted-foreground">
              {searchQuery || filterStatus !== "all"
                ? t("ordersPage.emptyFiltered")
                : t("ordersPage.emptyDefault")}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}

function FilterButton({ label, active, onClick, count }: any) {
  return (
    <button
      onClick={() => {
        triggerHaptic("light")
        onClick()
      }}
      className={`
        px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors
        ${active ? "bg-foreground text-background" : "bg-muted hover:bg-muted/80"}
      `}
    >
      {label} {count > 0 && `(${count})`}
    </button>
  )
}

function OrderCard({ order, index, onClick, statusConfig, t, locale }: any) {
  const config = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className="bg-card border rounded-2xl p-4 cursor-pointer hover:shadow-lg transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="text-xs text-muted-foreground mb-1">{t("ordersPage.orderNumber")}</p>
          <p className="font-mono font-semibold">{order.order_number}</p>
        </div>
        <div className={`p-2 rounded-full ${config.color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <User className="w-4 h-4 text-muted-foreground" />
          <span>{order.customer_name}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Phone className="w-4 h-4 text-muted-foreground" />
          <span>{order.customer_phone}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <DollarSign className="w-4 h-4 text-muted-foreground" />
          <span className="font-semibold">
            {t("ordersPage.currency", { amount: (order.total || 0).toLocaleString(locale) })}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t">
        <span className={`text-xs font-medium px-3 py-1 rounded-full ${config.color}`}>
          {config.label}
        </span>
        <span className="text-xs text-muted-foreground">
          {new Date(order.created_at).toLocaleDateString(locale)}
        </span>
      </div>
    </motion.div>
  )
}

function OrderDetailsView({ order, onBack, onStatusUpdate, onWhatsApp, onCall, onEmail, onSMS, isUpdating, userActivity, statusConfig, t, locale, backIcon }: any) {
  const [newStatus, setNewStatus] = useState(order.status)
  const [comment, setComment] = useState("")
  const [showHistory, setShowHistory] = useState(false)

  const config = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending
  const Icon = config.icon
  const BackIcon = backIcon

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="rounded-full" onClick={onBack}>
                <BackIcon className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">{order.order_number}</h1>
                <p className="text-sm text-muted-foreground">{t("ordersPage.detailsTitle")}</p>
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                triggerHaptic("light")
                setShowHistory(!showHistory)
              }}
            >
              <History className="w-4 h-4 me-2" />
              {t("ordersPage.history")}
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border rounded-2xl p-6"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className={`p-4 rounded-2xl ${config.color}`}>
              <Icon className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">{t("ordersPage.currentStatus")}</p>
              <p className="text-2xl font-bold">{config.label}</p>
            </div>
          </div>

          {/* Status Update */}
          <div className="space-y-3 pt-4 border-t">
            <label className="text-sm font-medium">{t("ordersPage.updateStatus")}</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {(Object.entries(statusConfig) as Array<[string, StatusConfig]>).map(
                ([status, config]) => (
                <option key={status} value={status}>
                  {config.label}
                </option>
              ))}
            </select>
            
            <textarea
              placeholder={t("ordersPage.addComment")}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              rows={3}
            />
            
            <Button
              onClick={() => {
                onStatusUpdate(order.id, newStatus, comment)
                setComment("")
              }}
              disabled={isUpdating || newStatus === order.status}
              className="w-full h-12 rounded-xl"
            >
              {isUpdating ? t("ordersPage.updating") : t("ordersPage.updateAndNotify")}
              <Bell className="w-4 h-4 ms-2" />
            </Button>
          </div>
        </motion.div>

        {/* Contact Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border rounded-2xl p-6"
        >
          <h3 className="font-semibold mb-4">{t("ordersPage.contactCustomer")}</h3>
          <div className="grid grid-cols-4 gap-3">
            <Button
              variant="outline"
              className="flex-col h-auto py-4 rounded-xl"
              onClick={() => onWhatsApp(order.customer_phone, order.order_number)}
            >
              <MessageCircle className="w-6 h-6 mb-2 text-green-500" />
              <span className="text-xs">{t("ordersPage.channels.whatsapp")}</span>
            </Button>
            
            <Button
              variant="outline"
              className="flex-col h-auto py-4 rounded-xl"
              onClick={() => onSMS(order.customer_phone, order.order_number, order.status)}
            >
              <MessageSquare className="w-6 h-6 mb-2 text-blue-500" />
              <span className="text-xs">{t("ordersPage.channels.sms")}</span>
            </Button>
            
            <Button
              variant="outline"
              className="flex-col h-auto py-4 rounded-xl"
              onClick={() => onCall(order.customer_phone)}
            >
              <Phone className="w-6 h-6 mb-2 text-indigo-500" />
              <span className="text-xs">{t("ordersPage.channels.call")}</span>
            </Button>
            
            {order.customer_email && (
              <Button
                variant="outline"
                className="flex-col h-auto py-4 rounded-xl"
                onClick={() => onEmail(order.customer_email)}
              >
                <Mail className="w-6 h-6 mb-2 text-purple-500" />
                <span className="text-xs">{t("ordersPage.channels.email")}</span>
              </Button>
            )}
          </div>
        </motion.div>

        {/* Customer Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border rounded-2xl p-6"
        >
          <h3 className="font-semibold mb-4">{t("ordersPage.customerInfo")}</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">{t("ordersPage.customerFields.name")}</p>
                <p className="font-medium">{order.customer_name}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">{t("ordersPage.customerFields.phone")}</p>
                <p className="font-medium">{order.customer_phone}</p>
              </div>
            </div>
            {order.customer_email && (
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">{t("ordersPage.customerFields.email")}</p>
                  <p className="font-medium">{order.customer_email}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">{t("ordersPage.customerFields.shippingAddress")}</p>
                <p className="font-medium">
                  {typeof order.shipping_address === "string"
                    ? order.shipping_address
                    : JSON.stringify(order.shipping_address, null, 2)}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Order Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border rounded-2xl p-6"
        >
          <h3 className="font-semibold mb-4">{t("ordersPage.itemsTitle")}</h3>
          <div className="space-y-3">
            {Array.isArray(order.items) && order.items.map((item: any, index: number) => (
              <div key={index} className="flex items-center justify-between py-3 border-b last:border-0">
                <div>
                  <p className="font-medium">{item.name || item.product_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.size
                      ? t("ordersPage.itemMetaWithSize", { count: item.quantity, size: item.size })
                      : t("ordersPage.itemMeta", { count: item.quantity })}
                  </p>
                </div>
                <p className="font-semibold">
                  {t("ordersPage.currency", { amount: Number(item.price).toLocaleString(locale) })}
                </p>
              </div>
            ))}
            <div className="flex items-center justify-between pt-3 text-lg font-bold">
              <span>{t("ordersPage.total")}</span>
              <span>{t("ordersPage.currency", { amount: (order.total || 0).toLocaleString(locale) })}</span>
            </div>
          </div>
        </motion.div>

        {/* Activity History */}
        {showHistory && userActivity.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border rounded-2xl p-6"
          >
            <h3 className="font-semibold mb-4">{t("ordersPage.activityHistory")}</h3>
            <div className="space-y-3">
              {userActivity.map((activity: any) => (
                <div key={activity.id} className="flex items-start gap-3 py-2">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div className="flex-1">
                    <p className="text-sm font-medium capitalize">
                      {activity.action_type.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.created_at).toLocaleString(locale)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
