import { getAdminStoreContext } from "@/lib/supabase/queries/admin-store"
import { VoiceAssistantClient } from "./voice-assistant-client"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Voice Assistant",
  description: "Manage your store with voice commands",
}

export default async function VoiceAssistantPage() {
  const storeContext = await getAdminStoreContext()

  if (!storeContext) {
    redirect("/auth/login")
  }

  return <VoiceAssistantClient storeId={storeContext.store.id} />
}
