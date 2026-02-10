import { getTranslations } from "next-intl/server"
import type { ThemeComponentProps } from "@/types/theme"

interface StoreInfoConfig {
  titleKey?: string
  aboutKey?: string
  address?: string
  phone?: string
  email?: string
}

export async function StoreInfo({
  config,
  locale,
}: ThemeComponentProps<StoreInfoConfig>) {
  const t = await getTranslations({ locale, namespace: "storefront" })
  const {
    titleKey = "storeInfo.title",
    aboutKey = "storeInfo.about",
    address,
    phone,
    email,
  } = config

  return (
    <section className="bg-[var(--theme-background)] py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 grid gap-8 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-start">{t(titleKey)}</h2>
          <p className="text-sm text-[var(--theme-muted)] text-start">{t(aboutKey)}</p>
        </div>
        <div className="rounded-2xl border border-[var(--theme-border)] bg-white p-6 space-y-3 text-sm">
          <div className="flex items-start justify-between gap-4">
            <span className="text-[var(--theme-muted)]">{t("storeInfo.address")}</span>
            <span className="text-start">{address || t("storeInfo.addressValue")}</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <span className="text-[var(--theme-muted)]">{t("storeInfo.phone")}</span>
            <span dir="ltr">{phone || t("storeInfo.phoneValue")}</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <span className="text-[var(--theme-muted)]">{t("storeInfo.email")}</span>
            <span dir="ltr">{email || t("storeInfo.emailValue")}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
