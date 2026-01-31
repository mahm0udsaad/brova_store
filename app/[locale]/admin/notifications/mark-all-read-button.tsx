'use client'

import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { markAllNotificationsAsRead } from "@/lib/actions/notifications"
import { useRouter } from "next/navigation"

export function MarkAllReadButton() {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleMarkAllRead = () => {
    startTransition(async () => {
      await markAllNotificationsAsRead()
      router.refresh()
    })
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleMarkAllRead}
      disabled={isPending}
    >
      {isPending ? "Marking..." : "Mark all as read"}
    </Button>
  )
}
