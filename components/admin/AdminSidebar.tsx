"use client"

import { useState, useEffect, useMemo, memo } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { springConfigs } from "@/lib/ui/motion-presets"
import {
  LayoutDashboard,
  Package,
  Image as ImageIcon,
  Megaphone,
  Layers,
  ShoppingCart,
  BarChart3,
  Palette,
  Settings,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Globe,
  Wallet,
  Users,
  Bell,
  Truck,
  Rocket,
  CreditCard,
  Mic,
  Blocks,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLocale, useTranslations } from "next-intl"

// =============================================================================
// TYPES
// =============================================================================

interface NavItem {
  id: string
  label: string
  href: string
  icon: LucideIcon
  badge?: string
  badgeVariant?: "default" | "new" | "count"
  group?: "main" | "content" | "settings"
}

interface NavGroup {
  id: string
  label: string
  items: NavItem[]
}

// =============================================================================
// COMPONENT
// =============================================================================

export const AdminSidebar = memo(function AdminSidebar({ storeName }: { storeName?: string }) {
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations("admin")
  const isRtl = locale === "ar"
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const normalizedPathname = pathname.replace(/^\/(en|ar)(?=\/|$)/, "") || "/"
  const buildHref = (href: string) => (href === "/" ? `/${locale}` : `/${locale}${href}`)
  const CollapseIcon = isRtl ? ChevronRight : ChevronLeft

  const sidebarTitle = storeName ? `${storeName} Admin` : t("title")

  // Group navigation items
  const navGroups: NavGroup[] = useMemo(() => [
    {
      id: "main",
      label: t("navGroups.main"),
      items: [
        { id: "dashboard", label: t("dashboardLabel"), href: "/admin", icon: LayoutDashboard, group: "main" },
        { id: "orders", label: t("orders"), href: "/admin/orders", icon: ShoppingCart, group: "main" },
        { id: "customers", label: t("customers"), href: "/admin/customers", icon: Users, group: "main" },
      ],
    },
    {
      id: "content",
      label: t("navGroups.content"),
      items: [
        { id: "products", label: t("products.label"), href: "/admin/products", icon: Package, group: "content" },
        { id: "categories", label: t("sidebarCategories"), href: "/admin/categories", icon: Layers, group: "content" },
        { id: "media", label: t("media"), href: "/admin/media", icon: ImageIcon, group: "content" },
        { id: "marketing", label: t("marketing"), href: "/admin/marketing", icon: Megaphone, badge: t("new"), badgeVariant: "new", group: "content" },
        { id: "bulk-deals", label: t("bulkDeals"), href: "/admin/bulk-deals", icon: Layers, group: "content" },
      ],
    },
    {
      id: "ai-tools",
      label: t("navGroups.aiTools"),
      items: [
        { id: "voice-assistant", label: t("voiceAssistant"), href: "/admin/voice-assistant", icon: Mic, badge: t("new"), badgeVariant: "new", group: "content" },
        { id: "store-builder", label: t("storeBuilder"), href: "/admin/store-builder", icon: Blocks, badge: t("new"), badgeVariant: "new", group: "content" },
      ],
    },
    {
      id: "analytics",
      label: t("navGroups.analytics"),
      items: [
        { id: "insights", label: t("insights"), href: "/admin/insights", icon: BarChart3, group: "settings" },
        { id: "wallet", label: t("wallet"), href: "/admin/wallet", icon: Wallet, group: "settings" },
      ],
    },
    {
      id: "settings",
      label: t("navGroups.settings"),
      items: [
        { id: "appearance", label: t("appearance"), href: "/admin/appearance", icon: Palette, group: "settings" },
        { id: "shipping", label: t("shipping"), href: "/admin/settings/shipping", icon: Truck, group: "settings" },
        { id: "publishing", label: t("publishing"), href: "/admin/settings/publish", icon: Rocket, group: "settings" },
        { id: "domains", label: t("domains"), href: "/admin/domains", icon: Globe, group: "settings" },
        { id: "billing", label: "Billing", href: "/admin/settings/billing", icon: CreditCard, group: "settings" },
        { id: "settings", label: t("settings"), href: "/admin/settings", icon: Settings, group: "settings" },
        { id: "notifications", label: t("notifications"), href: "/admin/notifications", icon: Bell, group: "settings" },
      ],
    },
  ], [t, isRtl])

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false)
      }
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const isActive = (href: string) => {
    if (href === "/admin") {
      return normalizedPathname === "/admin"
    }
    return normalizedPathname.startsWith(href)
  }

  // =============================================================================
  // SIDEBAR CONTENT
  // =============================================================================

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="flex h-full flex-col bg-sidebar/50 backdrop-blur-xl border-r border-white/5">
      {/* Logo Header */}
      <div className={cn(
        "flex items-center justify-between border-b border-white/5",
        isCollapsed && !isMobile ? "h-16 px-2" : "h-16 px-4"
      )}>
        <Link href={buildHref("/admin")} className="flex items-center gap-3">
          {/* Logo Icon */}
          <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-sidebar-accent flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-sidebar-primary" />
          </div>
          
          {/* Logo Text */}
          <AnimatePresence mode="wait">
            {(!isCollapsed || isMobile) && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="text-lg font-bold text-sidebar-foreground whitespace-nowrap overflow-hidden"
              >
                {sidebarTitle}
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
        
        {/* Collapse Button (Desktop Only) */}
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon-sm"
            className="hidden lg:flex text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <CollapseIcon className={cn(
              "h-4 w-4 transition-transform duration-200",
              isCollapsed && "rotate-180"
            )} />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 custom-scrollbar">
        {navGroups.map((group, groupIndex) => (
          <div key={group.id} className={cn("mb-4", groupIndex > 0 && "mt-4")}>
            {/* Group Label */}
            <AnimatePresence mode="wait">
              {(!isCollapsed || isMobile) && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-4 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  {group.label}
                </motion.p>
              )}
            </AnimatePresence>
            
            {/* Group Items */}
            <div className="px-2 space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)

                return (
                  <Link
                    key={item.id}
                    href={buildHref(item.href)}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300",
                      active
                        ? "bg-primary/10 text-primary shadow-[0_0_20px_-5px_rgba(var(--primary),0.3)] border border-primary/20"
                        : "text-muted-foreground hover:bg-white/5 hover:text-foreground hover:shadow-[0_0_15px_-5px_rgba(255,255,255,0.1)]",
                      isCollapsed && !isMobile && "justify-center px-2"
                    )}
                  >
                    <Icon className={cn(
                      "h-[18px] w-[18px] flex-shrink-0 transition-transform duration-300 group-hover:scale-110",
                      active ? "text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]" : "text-muted-foreground group-hover:text-foreground"
                    )} strokeWidth={1.75} />
                    
                    <AnimatePresence mode="wait">
                      {(!isCollapsed || isMobile) && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          className="flex-1 whitespace-nowrap overflow-hidden"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    
                    {/* Badge */}
                    {item.badge && (!isCollapsed || isMobile) && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className={cn(
                          "px-1.5 py-0.5 text-[10px] font-semibold rounded-full border",
                          active
                            ? "bg-primary/20 border-primary/30 text-primary"
                            : item.badgeVariant === "new"
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                              : "bg-white/5 border-white/10 text-muted-foreground"
                        )}
                      >
                        {item.badge}
                      </motion.span>
                    )}

                    {/* Active Indicator (Collapsed) */}
                    {active && isCollapsed && !isMobile && (
                      <motion.div
                        layoutId="sidebar-active-indicator"
                        className="absolute ltr:-right-2 rtl:-left-2 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.8)]"
                        transition={springConfigs.snappy}
                      />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-2">
        <Link
          href={buildHref("/")}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all",
            isCollapsed && !isMobile && "justify-center px-2"
          )}
        >
          <ExternalLink className="h-[18px] w-[18px] flex-shrink-0" strokeWidth={1.75} />
          <AnimatePresence mode="wait">
            {(!isCollapsed || isMobile) && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="whitespace-nowrap overflow-hidden"
              >
                {t("backToStore")}
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>
    </div>
  )

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed ltr:left-4 rtl:right-4 top-4 z-50 lg:hidden bg-background/80 backdrop-blur-sm border border-border shadow-sm"
        onClick={() => setIsMobileOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm lg:hidden"
              onClick={() => setIsMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: isRtl ? "100%" : "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: isRtl ? "100%" : "-100%" }}
              transition={springConfigs.smooth}
              className="fixed ltr:left-0 rtl:right-0 top-0 z-50 h-full w-72 border-r rtl:border-l rtl:border-r-0 border-sidebar-border bg-sidebar shadow-xl lg:hidden"
            >
              <Button
                variant="ghost"
                size="icon"
                className="absolute ltr:right-3 rtl:left-3 top-3 text-sidebar-foreground hover:bg-sidebar-accent"
                onClick={() => setIsMobileOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
              <SidebarContent isMobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 72 : 256 }}
        transition={springConfigs.smooth}
        className="hidden lg:flex flex-col fixed ltr:left-0 rtl:right-0 top-0 h-full border-r rtl:border-l rtl:border-r-0 border-sidebar-border bg-sidebar z-30"
      >
        <SidebarContent />
      </motion.aside>

      {/* Spacer for content */}
      <motion.div
        initial={false}
        animate={{ width: isCollapsed ? 72 : 256 }}
        transition={springConfigs.smooth}
        className="hidden lg:block flex-shrink-0"
      />
    </>
  )
})
