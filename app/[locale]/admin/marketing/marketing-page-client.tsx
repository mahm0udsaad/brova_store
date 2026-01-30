"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Megaphone,
  Plus,
  Search,
  Instagram,
  Mail,
  MessageSquare,
  Facebook,
  FileText,
  Calendar,
  Clock,
  CheckCircle2,
  Pause,
  XCircle,
  Sparkles,
  Wand2,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAdminAssistant } from "@/components/admin-assistant/AdminAssistantProvider"
import { InlineMarketingGenerator } from "@/components/admin/inline-marketing-generator"
import { CampaignStats } from "@/components/admin/marketing/campaign-stats"
import { CampaignCard } from "@/components/admin/marketing/campaign-card"
import { useTranslations } from "next-intl"

interface Campaign {
  id: string
  name: string
  type: "email" | "sms" | "instagram" | "facebook" | "general"
  status: "draft" | "scheduled" | "active" | "paused" | "completed" | "cancelled"
  content: any
  target: any
  schedule: any
  products: string[]
  metrics: any
  created_at: string
  updated_at: string
  published_at: string | null
}

interface Product {
  id: string
  name: string
  image_url: string | null
  price: number | null
  category_id: string | null
}

interface MarketingPageClientProps {
  initialCampaigns: Campaign[]
  products: Product[]
}

const typeConfig = {
  email: { icon: Mail, labelKey: "marketingPage.types.email", color: "text-blue-500 bg-blue-500/10" },
  sms: { icon: MessageSquare, labelKey: "marketingPage.types.sms", color: "text-green-500 bg-green-500/10" },
  instagram: { icon: Instagram, labelKey: "marketingPage.types.instagram", color: "text-pink-500 bg-pink-500/10" },
  facebook: { icon: Facebook, labelKey: "marketingPage.types.facebook", color: "text-indigo-500 bg-indigo-500/10" },
  general: { icon: FileText, labelKey: "marketingPage.types.general", color: "text-gray-500 bg-gray-500/10" },
}

const statusConfig = {
  draft: { icon: FileText, labelKey: "marketingPage.statuses.draft", color: "text-muted-foreground bg-muted" },
  scheduled: { icon: Calendar, labelKey: "marketingPage.statuses.scheduled", color: "text-yellow-500 bg-yellow-500/10" },
  active: { icon: CheckCircle2, labelKey: "marketingPage.statuses.active", color: "text-green-500 bg-green-500/10" },
  paused: { icon: Pause, labelKey: "marketingPage.statuses.paused", color: "text-orange-500 bg-orange-500/10" },
  completed: { icon: CheckCircle2, labelKey: "marketingPage.statuses.completed", color: "text-blue-500 bg-blue-500/10" },
  cancelled: { icon: XCircle, labelKey: "marketingPage.statuses.cancelled", color: "text-red-500 bg-red-500/10" },
}

export function MarketingPageClient({ initialCampaigns, products }: MarketingPageClientProps) {
  const t = useTranslations("admin")
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [showNewCampaign, setShowNewCampaign] = useState(false)
  const [activeView, setActiveView] = useState<"campaigns" | "generator">("campaigns")
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" | "info" } | null>(null)
  const { setPageContext } = useAdminAssistant()

  // Set page context for AI assistant
  useEffect(() => {
    setPageContext({
      pageName: t("marketingPage.title"),
      pageType: "marketing",
      selectedItems: [],
      filters: { type: filterType, status: filterStatus, search: searchQuery },
      capabilities: [
        t("marketingPage.capabilities.instagram"),
        t("marketingPage.capabilities.email"),
        t("marketingPage.capabilities.descriptions"),
        t("marketingPage.capabilities.promos"),
        t("marketingPage.capabilities.hashtags"),
        t("marketingPage.capabilities.abTests"),
      ],
    })
  }, [filterType, filterStatus, searchQuery, setPageContext, t])

  // Toast notification handler
  const showToast = (message: string, variant: "success" | "error" | "info") => {
    setToast({ message, variant })
    setTimeout(() => setToast(null), 5000)
  }

  // Listen for AI navigation events to switch views and refresh
  useEffect(() => {
    const handleNavigate = (event: CustomEvent) => {
      const { path, params } = event.detail
      
      // Check if navigating to marketing page with specific view
      if (path === "/admin/marketing" && params) {
        if (params.view === "generator") {
          setActiveView("generator")
        }
        
        // Trigger refresh if requested
        if (params.refresh) {
          // Dispatch a custom event to refresh the generator component
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent("marketing-refresh-drafts"))
          }, 500)
        }
      }
    }

    const handleToast = (event: CustomEvent) => {
      const { message, variant } = event.detail
      showToast(message, variant)
    }

    window.addEventListener("ai-navigate" as any, handleNavigate)
    window.addEventListener("ai-show-toast" as any, handleToast)

    return () => {
      window.removeEventListener("ai-navigate" as any, handleNavigate)
      window.removeEventListener("ai-show-toast" as any, handleToast)
    }
  }, [])

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch = !searchQuery ||
      campaign.name.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesType = filterType === "all" || campaign.type === filterType
    const matchesStatus = filterStatus === "all" || campaign.status === filterStatus

    return matchesSearch && matchesType && matchesStatus
  })

  const stats = {
    total: campaigns.length,
    active: campaigns.filter((c) => c.status === "active").length,
    draft: campaigns.filter((c) => c.status === "draft").length,
    scheduled: campaigns.filter((c) => c.status === "scheduled").length,
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 right-4 z-50 max-w-md"
          >
            <div
              className={cn(
                "px-6 py-4 rounded-lg shadow-lg border",
                toast.variant === "success" && "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400",
                toast.variant === "error" && "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400",
                toast.variant === "info" && "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400"
              )}
            >
              <div className="flex items-center gap-3">
                {toast.variant === "success" && <CheckCircle2 className="w-5 h-5" />}
                {toast.variant === "error" && <XCircle className="w-5 h-5" />}
                {toast.variant === "info" && <Sparkles className="w-5 h-5" />}
                <p className="font-medium">{toast.message}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{t("marketingPage.title")}</h1>
            <p className="text-sm text-muted-foreground">
              {t("marketingPage.subtitle")}
            </p>
          </div>
          
          {/* View Toggle */}
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border bg-muted/50 p-1">
              <button
                onClick={() => setActiveView("campaigns")}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium transition-all",
                  activeView === "campaigns"
                    ? "bg-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                {t("marketingPage.view.campaigns")}
              </button>
              <button
                onClick={() => setActiveView("generator")}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium transition-all",
                  activeView === "generator"
                    ? "bg-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Sparkles className="w-4 h-4 inline mr-2" />
                {t("marketingPage.view.generator")}
              </button>
            </div>
            
            {activeView === "campaigns" && (
              <Button
                onClick={() => setShowNewCampaign(true)}
                className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t("marketingPage.newCampaign")}
              </Button>
            )}
          </div>
        </div>

        {/* Conditional Content */}
        {activeView === "generator" ? (
          <InlineMarketingGenerator products={products} />
        ) : (
          <>
            <CampaignStats
              total={stats.total}
              active={stats.active}
              scheduled={stats.scheduled}
              draft={stats.draft}
            />

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="relative flex-1 w-full sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={t("marketingPage.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 rounded-xl border bg-background text-sm"
                >
                  <option value="all">{t("marketingPage.filters.allTypes")}</option>
                  {Object.entries(typeConfig).map(([value, config]) => (
                    <option key={value} value={value}>{t(config.labelKey)}</option>
                  ))}
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 rounded-xl border bg-background text-sm"
                >
                  <option value="all">{t("marketingPage.filters.allStatus")}</option>
                  {Object.entries(statusConfig).map(([value, config]) => (
                    <option key={value} value={value}>{t(config.labelKey)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Action Banner */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-violet-500/20 bg-gradient-to-r from-violet-500/5 to-purple-500/5 p-4"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{t("marketingPage.quickAction.title")}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("marketingPage.quickAction.subtitle")}
                  </p>
                </div>
                <Button 
                  onClick={() => setActiveView("generator")}
                  className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                  size="sm"
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  {t("marketingPage.quickAction.cta")}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </motion.div>

            {/* Campaigns List */}
            <div className="space-y-4">
              {filteredCampaigns.map((campaign, index) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  typeConfig={{
                    ...typeConfig[campaign.type],
                    label: t(typeConfig[campaign.type].labelKey),
                  }}
                  statusConfig={{
                    ...statusConfig[campaign.status],
                    label: t(statusConfig[campaign.status].labelKey),
                  }}
                  index={index}
                />
              ))}
            </div>

            {/* Empty State */}
            {filteredCampaigns.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16"
              >
                <Megaphone className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">{t("marketingPage.empty.title")}</h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery || filterType !== "all" || filterStatus !== "all"
                    ? t("marketingPage.empty.filtered")
                    : t("marketingPage.empty.default")}
                </p>
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={() => setActiveView("generator")}
                    className="bg-gradient-to-r from-violet-500 to-purple-600"
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    {t("marketingPage.empty.generate")}
                  </Button>
                  <Button
                    onClick={() => setShowNewCampaign(true)}
                    variant="outline"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {t("marketingPage.empty.create")}
                  </Button>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
