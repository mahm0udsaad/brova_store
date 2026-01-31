import { getTranslations } from "next-intl/server"
import { Users, Mail, Phone, ShoppingBag } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getCustomers, getCustomerStats } from "@/lib/supabase/queries/admin-customers"
import { formatDistanceToNow } from "date-fns"

export const dynamic = "force-dynamic"

export default async function CustomersPage() {
  const t = await getTranslations("admin.customersPage")

  // Fetch customers from database
  const { customers, total } = await getCustomers({ limit: 50 })
  const stats = await getCustomerStats()

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("totalCustomers")}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("newThisMonth")}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newThisMonth}</div>
          </CardContent>
        </Card>
      </div>

      {/* Customers Table/List */}
      <Card>
        <CardHeader>
          <CardTitle>{t("customersList")}</CardTitle>
        </CardHeader>
        <CardContent>
          {customers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-1">{t("empty")}</h3>
              <p className="text-sm text-muted-foreground">{t("emptySubtitle")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {customers.map((customer) => (
                <div
                  key={customer.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {customer.first_name && customer.last_name
                          ? `${customer.first_name} ${customer.last_name}`
                          : customer.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {customer.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span>{customer.email}</span>
                        </div>
                      )}
                      {customer.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <span>{customer.phone}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t("joined")} {formatDistanceToNow(new Date(customer.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="flex items-center gap-1 text-sm">
                      <ShoppingBag className="h-3 w-3" />
                      <span className="font-medium">{customer.total_orders} {t("orders")}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      EGP {customer.total_spent.toFixed(2)} {t("spent")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
