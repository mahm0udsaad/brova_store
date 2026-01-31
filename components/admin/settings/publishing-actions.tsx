"use client"

import { useTransition } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Rocket } from "lucide-react"
import { publishStore, unpublishStore } from "@/lib/actions/store-lifecycle"
import { useRouter } from "next/navigation"

interface PublishingActionsProps {
  storeStatus: "draft" | "active"
  canPublish: boolean
}

export function PublishingActions({ storeStatus, canPublish }: PublishingActionsProps) {
  const t = useTranslations("admin.publishingPage")
  const { toast } = useToast()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handlePublish = () => {
    startTransition(async () => {
      try {
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
            description: result.error || "Failed to publish store",
            variant: "destructive",
          })
        }
      } catch (error) {
        toast({
          title: t("error"),
          description: "Failed to publish store",
          variant: "destructive",
        })
      }
    })
  }

  const handleUnpublish = () => {
    startTransition(async () => {
      try {
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
            description: result.error || "Failed to unpublish store",
            variant: "destructive",
          })
        }
      } catch (error) {
        toast({
          title: t("error"),
          description: "Failed to unpublish store",
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
