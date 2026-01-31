import { getTranslations } from "next-intl/server"
import { Wallet, CreditCard, TrendingUp, DollarSign } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getWalletBalance, getWalletTransactions } from "@/lib/supabase/queries/wallet"
import { formatDistanceToNow } from "date-fns"

export const dynamic = "force-dynamic"

export default async function WalletPageConnected() {
  const t = await getTranslations("admin.walletPage")

  // Fetch wallet data from database
  const wallet = await getWalletBalance()
  const transactions = await getWalletTransactions(20)

  const available = wallet?.available_balance || 0
  const pending = wallet?.pending_balance || 0
  const totalEarned = wallet?.total_earned || 0
  const currency = wallet?.currency || "EGP"
  const stripeConnected = wallet?.stripe_connected || false

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* Balance Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Available Balance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("available")}</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currency} {available.toFixed(2)}
            </div>
            <Button size="sm" className="mt-3" disabled={!stripeConnected || available === 0}>
              {t("withdraw")}
            </Button>
          </CardContent>
        </Card>

        {/* Pending Balance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("pending")}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currency} {pending.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        {/* Total Earned */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("totalEarned")}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currency} {totalEarned.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Connect Payment Provider */}
      <Card>
        <CardHeader>
          <CardTitle>{t("paymentProvider")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="font-medium">{t("connectStripe")}</p>
                <p className="text-sm text-muted-foreground">
                  {stripeConnected ? "Connected" : t("comingSoon")}
                </p>
              </div>
            </div>
            {stripeConnected ? (
              <Badge variant="default" className="bg-green-600">Connected</Badge>
            ) : (
              <Button variant="outline" disabled>
                {t("connectStripe")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>{t("transactionHistory")}</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Wallet className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-1">{t("noTransactions")}</h3>
              <p className="text-sm text-muted-foreground">{t("transactionsEmpty")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div className="flex-1">
                    <p className="font-medium">{tx.description || t(`types.${tx.type}`)}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={tx.status === "completed" ? "default" : "secondary"}>
                      {t(`statuses.${tx.status}`)}
                    </Badge>
                    <p className={`font-semibold ${tx.type === "refund" || tx.type === "fee" ? "text-red-600" : "text-green-600"}`}>
                      {tx.type === "refund" || tx.type === "fee" ? "-" : "+"}
                      {tx.currency} {tx.amount.toFixed(2)}
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
