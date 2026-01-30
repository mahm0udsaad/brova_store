import { getDomains } from "@/lib/actions/domains"
import { DomainsPageClient } from "./domains-page-client"
import { getTranslations } from "next-intl/server"

export default async function DomainsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const domains = await getDomains()
  
  return <DomainsPageClient initialDomains={domains} />
}
