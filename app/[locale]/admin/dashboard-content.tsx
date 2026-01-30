"use client"

import {
  ShoppingCart,
  Package,
  Users,
  Sparkles,
  Plus,
  Image as ImageIcon,
  Megaphone,
} from "lucide-react"
import { StatCard, StatCardGrid } from "@/components/admin/dashboard/stat-card"
import { ActionCard, ActionCardGrid } from "@/components/admin/dashboard/action-card"
import { StoreStatusBanners } from "@/components/admin/dashboard/status-banner"

// =============================================================================
// TYPES
// =============================================================================

interface DashboardStats {
  totalProducts: number
  activeProducts: number
  draftProducts: number
  totalUsers: number
  tryOnUsage: number
  totalOrders: number
  pendingOrders: number
  deliveredOrders: number
}

interface DashboardContentProps {
  stats: DashboardStats
  locale: string
  translations: {
    overview: string
    quickActions: string
    totalOrders: string
    totalProducts: string
    totalUsers: string
    tryOnUsage: string
    pending: string
    active: string
    registeredProfiles: string
    totalHistoryEvents: string
    addProduct: string
    addProductDesc: string
    manageOrders: string
    manageOrdersDesc: string
    mediaLibrary: string
    mediaLibraryDesc: string
    marketing: string
    marketingDesc: string
    new: string
  }
}

// =============================================================================
// COMPONENT
// =============================================================================

export function DashboardContent({ 
  stats, 
  locale,
  translations: t,
}: DashboardContentProps) {
  return (
    <div className="space-y-8">
      {/* Status Banner */}
      <StoreStatusBanners 
        productsCount={stats.totalProducts} 
        ordersCount={stats.pendingOrders}
        locale={locale}
      />

      {/* Stats Grid */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground mb-4">
          {t.overview}
        </h2>
        <StatCardGrid>
          <StatCard
            title={t.totalOrders}
            value={stats.totalOrders}
            subtitle={`${t.pending}: ${stats.pendingOrders}`}
            icon={ShoppingCart}
            variant={stats.pendingOrders > 0 ? "warning" : "default"}
          />
          <StatCard
            title={t.totalProducts}
            value={stats.totalProducts}
            subtitle={`${t.active}: ${stats.activeProducts}`}
            icon={Package}
          />
          <StatCard
            title={t.totalUsers}
            value={stats.totalUsers}
            subtitle={t.registeredProfiles}
            icon={Users}
          />
          <StatCard
            title={t.tryOnUsage}
            value={stats.tryOnUsage}
            subtitle={t.totalHistoryEvents}
            icon={Sparkles}
            variant="info"
          />
        </StatCardGrid>
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground mb-4">
          {t.quickActions}
        </h2>
        <ActionCardGrid columns={2}>
          <ActionCard
            title={t.addProduct}
            description={t.addProductDesc}
            icon={Plus}
            href={`/${locale}/admin/inventory`}
            variant="primary"
          />
          <ActionCard
            title={t.manageOrders}
            description={t.manageOrdersDesc}
            icon={ShoppingCart}
            href={`/${locale}/admin/orders`}
            badge={stats.pendingOrders > 0 ? String(stats.pendingOrders) : undefined}
          />
          <ActionCard
            title={t.mediaLibrary}
            description={t.mediaLibraryDesc}
            icon={ImageIcon}
            href={`/${locale}/admin/media`}
          />
          <ActionCard
            title={t.marketing}
            description={t.marketingDesc}
            icon={Megaphone}
            href={`/${locale}/admin/marketing`}
            badge={t.new}
          />
        </ActionCardGrid>
      </section>
    </div>
  )
}
