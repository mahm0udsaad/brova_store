"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Globe, Plus, Trash2, Check, AlertCircle, RefreshCw, Star, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"
import { addDomain, deleteDomain, verifyDomain, setPrimaryDomain } from "@/lib/actions/domains"

interface Domain {
  id: string
  domain: string
  status: "pending" | "verified" | "active"
  is_primary: boolean
  dns_records?: any
}

export function DomainsPageClient({ initialDomains }: { initialDomains: any[] }) {
  const t = useTranslations("admin")
  const [domains, setDomains] = useState<Domain[]>(initialDomains)
  const [isAdding, setIsAdding] = useState(false)
  const [newDomain, setNewDomain] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null)

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDomain) return

    setIsSubmitting(true)
    try {
      await addDomain(newDomain)
      setNewDomain("")
      setIsAdding(false)
      // Optimistic update or refresh needed. For now, rely on server action revalidatePath
      // But server action revalidatePath only updates server components. 
      // We should ideally fetch or just reload. 
      // For this demo, let's just refresh the page or assume standard Next.js behavior handles it if we used router.
      window.location.reload()
    } catch (error) {
      console.error("Failed to add domain", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t("domainsPage.confirmDelete"))) return
    await deleteDomain(id)
    window.location.reload()
  }

  const handleVerify = async (id: string) => {
    await verifyDomain(id)
    window.location.reload()
  }

  const handleSetPrimary = async (id: string) => {
    await setPrimaryDomain(id)
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{t("domainsPage.title")}</h1>
            <p className="text-sm text-muted-foreground">
              {t("domainsPage.subtitle")}
            </p>
          </div>
          <Button onClick={() => setIsAdding(true)} className="bg-gradient-to-r from-violet-500 to-purple-600">
            <Plus className="w-4 h-4 mr-2" />
            {t("domainsPage.addDomain")}
          </Button>
        </div>

        {/* Domain List */}
        <div className="grid gap-4">
          {domains.length === 0 ? (
            <div className="text-center py-12 border rounded-xl bg-card">
              <Globe className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium">{t("domainsPage.noDomains")}</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
                {t("domainsPage.noDomainsDescription")}
              </p>
            </div>
          ) : (
            domains.map((domain) => (
              <div
                key={domain.id}
                className="bg-card border rounded-xl overflow-hidden"
              >
                <div className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <Globe className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{domain.domain}</h3>
                        {domain.is_primary && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 uppercase tracking-wider">
                            {t("domainsPage.primary")}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className={cn(
                          "w-2 h-2 rounded-full",
                          domain.status === "active" || domain.status === "verified" ? "bg-green-500" : "bg-yellow-500"
                        )} />
                        <span className="capitalize">{domain.status}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {domain.status === "pending" && (
                      <Button variant="outline" size="sm" onClick={() => setExpandedDomain(expandedDomain === domain.id ? null : domain.id)}>
                        {t("domainsPage.verify")}
                      </Button>
                    )}
                    {!domain.is_primary && (domain.status === "active" || domain.status === "verified") && (
                      <Button variant="ghost" size="sm" onClick={() => handleSetPrimary(domain.id)}>
                        <Star className="w-4 h-4 mr-2" />
                        {t("domainsPage.makePrimary")}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(domain.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* DNS Instructions */}
                <AnimatePresence>
                  {expandedDomain === domain.id && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t bg-muted/30 p-4 space-y-4">
                        <div className="flex items-start gap-3 p-3 bg-blue-500/10 text-blue-600 rounded-lg text-sm">
                          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                          <p>{t("domainsPage.dnsInstructions")}</p>
                        </div>
                        
                        <div className="grid gap-2">
                          <div className="grid grid-cols-3 text-xs font-medium text-muted-foreground uppercase px-2">
                            <div>Type</div>
                            <div>Name</div>
                            <div>Value</div>
                          </div>
                          <div className="grid grid-cols-3 bg-background border rounded-lg p-2 text-sm font-mono">
                            <div>CNAME</div>
                            <div>www</div>
                            <div className="truncate">ingress.brova.app</div>
                          </div>
                          <div className="grid grid-cols-3 bg-background border rounded-lg p-2 text-sm font-mono">
                            <div>TXT</div>
                            <div>@</div>
                            <div className="truncate">{domain.dns_records?.verification_code || "brova-verification-..."}</div>
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <Button size="sm" onClick={() => handleVerify(domain.id)}>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            {t("domainsPage.checkStatus")}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Domain Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-background rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="p-6 border-b">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">{t("domainsPage.addDomainTitle")}</h2>
                  <button onClick={() => setIsAdding(false)}>
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
                <form onSubmit={handleAddDomain}>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        {t("domainsPage.domainLabel")}
                      </label>
                      <input
                        type="text"
                        placeholder="example.com"
                        value={newDomain}
                        onChange={(e) => setNewDomain(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border bg-background"
                        autoFocus
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("domainsPage.domainHelp")}
                      </p>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>
                        {t("common.cancel")}
                      </Button>
                      <Button type="submit" disabled={isSubmitting || !newDomain} className="bg-gradient-to-r from-violet-500 to-purple-600">
                        {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : t("common.add")}
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
