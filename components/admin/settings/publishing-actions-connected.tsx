"use client"

import { useTransition } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { publishStore, unpublishStore } from "@/lib/actions/store-lifecycle"
import { Rocket } from "lucide-react"

interface PublishingActionsConnectedProps {
  storeStatus: "draft" | "active"
  canPublish: boolean
}

export function PublishingActionsConnected({ storeStatus, canPublish }: PublishingActionsConnectedProps) {
  const t = useTranslations("admin.publishingPage")
  const { toast } = useToast()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handlePublish = () => {
    startTransition(async () => {
      const result = await publishStore()
      if (result.success) {
        toast({
          title: t("success"),
          description: "Your store is now live!",
        })
        router.refresh()
      } else {
        toast({
          title: t("error"),
          description: result.error,
          variant: "destructive",
        })
      }
    })
  }

  const handleUnpublish = () => {
    startTransition(async () => {
      const result = await unpublishStore()
      if (result.success) {
        toast({
          title: t("unpublishSuccess"),
          description: "Your store has been unpublished",
        })
        router.refresh()
      } else {
        toast({
          title: t("error"),
          description: result.error,
          variant: "destructive",
        })
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Rocket className="h-5 w-5" />
          {storeStatus === "draft" ? t("publish") : t("unpublish")}
        </CardTitle>
        <CardDescription>
          {storeStatus === "draft"
            ? "Make your store visible to customers"
            : "Hide your store from customers"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {storeStatus === "draft" ? (
          <Button onClick={handlePublish} disabled={!canPublish || isPending} size="lg">
            {isPending ? t("publishing") : t("publish")}
          </Button>
        ) : (
          <Button onClick={handleUnpublish} disabled={isPending} variant="destructive" size="lg">
            {isPending ? t("unpublishing") : t("unpublish")}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
