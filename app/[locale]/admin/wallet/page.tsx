import { getTranslations } from "next-intl/server"
import { Wallet, CreditCard, TrendingUp, DollarSign } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getStoreWallet, getWalletTransactions } from "@/lib/supabase/queries/admin-wallet"
import { getConnectAccountStatus } from "@/lib/actions/stripe-connect"
import { formatDistanceToNow } from "date-fns"
import { StripeConnectSection } from "./stripe-connect-section"

export const dynamic = "force-dynamic"

export default async function WalletPage() {
  const t = await getTranslations("admin.walletPage")

  // Fetch wallet data from database
  const wallet = await getStoreWallet()
  const { transactions } = await getWalletTransactions({ limit: 20 })
  const connectStatus = await getConnectAccountStatus()

  const walletData = {
    available: wallet?.available_balance || 0,
    pending: wallet?.pending_balance || 0,
    totalEarned: wallet?.total_earned || 0,
    currency: wallet?.currency || "EGP",
    stripeConnected: connectStatus?.connected || false,
  }

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
              {walletData.currency} {walletData.available.toFixed(2)}
            </div>
            <Button size="sm" className="mt-3" disabled>
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
              {walletData.currency} {walletData.pending.toFixed(2)}
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
              {walletData.currency} {walletData.totalEarned.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Connect Payment Provider */}
      <StripeConnectSection connectStatus={connectStatus} />

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
            <div className="space-y-3">
              {transactions.map((txn) => {
                const isCredit = txn.type === 'sale'
                const amountColor = isCredit ? 'text-green-600' : 'text-red-600'
                const amountPrefix = isCredit ? '+' : '-'

                return (
                  <div
                    key={txn.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {txn.description || t(`transactionType.${txn.type}`)}
                        </p>
                        <span className="text-xs px-2 py-1 rounded-full bg-muted">
                          {txn.type}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(txn.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-semibold ${amountColor}`}>
                        {amountPrefix}{txn.currency} {Math.abs(txn.amount).toFixed(2)}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        txn.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : txn.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {txn.status}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
