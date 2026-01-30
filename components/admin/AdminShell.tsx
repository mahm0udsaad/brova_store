"use client"

import { useAdminAssistant } from "@/components/admin-assistant/AdminAssistantProvider"
import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { AdminAssistantSidePanel } from "@/components/admin-assistant/AdminAssistantSidePanel"
import { AdminHeader } from "@/components/admin/AdminHeader"
import { cn } from "@/lib/utils"

interface AdminShellProps {
  children: React.ReactNode
  storeName?: string
  storeStatus?: string
  storeSlug?: string
}

export function AdminShell({ children, storeName, storeStatus = "draft", storeSlug = "" }: AdminShellProps) {
  const { displayMode } = useAdminAssistant()
  const isSidePanelOpen = displayMode === "side-panel"

  return (
    <div className="flex min-h-screen bg-background isolate">
      <AdminSidebar storeName={storeName} />
      <div className="flex flex-1 min-w-0">
        <main className={cn(
          "flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out",
        )}>
           <AdminHeader storeStatus={storeStatus} storeSlug={storeSlug} />
          <div className="flex-1">
            {children}
          </div>
        </main>
        
        {isSidePanelOpen && (
          <aside className="shrink-0 bg-background z-20 lg:sticky lg:top-0 lg:h-screen">
            <AdminAssistantSidePanel staticMode={true} />
          </aside>
        )}
      </div>
    </div>
  )
}