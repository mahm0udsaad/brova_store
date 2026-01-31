import { getTranslations } from "next-intl/server"
import { Bell, Package, DollarSign, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getNotifications, getUnreadCount, markAllAsRead } from "@/lib/supabase/queries/admin-notifications"
import { formatDistanceToNow } from "date-fns"
import { MarkAllReadButton } from "./mark-all-read-button"

export const dynamic = "force-dynamic"

export default async function NotificationsPage() {
  const t = await getTranslations("admin.notificationsPage")

  // Fetch notifications from database
  const { notifications } = await getNotifications({ limit: 50 })
  const unreadCount = await getUnreadCount()

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <Package className="h-5 w-5" />
      case 'payout':
        return <DollarSign className="h-5 w-5" />
      case 'low_stock':
        return <AlertCircle className="h-5 w-5" />
      default:
        return <Bell className="h-5 w-5" />
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
            {unreadCount > 0 && (
              <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                {unreadCount}
              </span>
            )}
          </div>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        {unreadCount > 0 && <MarkAllReadButton />}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-1">{t("empty")}</h3>
                <p className="text-sm text-muted-foreground">{t("emptySubtitle")}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card
              key={notification.id}
              className={notification.is_read ? "" : "border-l-4 border-l-primary bg-muted/30"}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`rounded-full p-2 ${
                    notification.type === 'order'
                      ? 'bg-blue-100 text-blue-600'
                      : notification.type === 'payout'
                      ? 'bg-green-100 text-green-600'
                      : notification.type === 'low_stock'
                      ? 'bg-orange-100 text-orange-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{notification.title}</p>
                      <span className="text-xs px-2 py-1 rounded-full bg-muted">
                        {notification.type}
                      </span>
                      {!notification.is_read && (
                        <span className="h-2 w-2 rounded-full bg-primary"></span>
                      )}
                    </div>
                    {notification.message && (
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
