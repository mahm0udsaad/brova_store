import type React from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { locales } from "@/i18n"
import { resolveTenant } from "@/lib/tenant-resolver"
import { getStorefrontContext } from "@/lib/supabase/queries/storefront"

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "common" })

  const tenantSlug = await resolveTenant()
  const context = await getStorefrontContext(tenantSlug)
  const storeName = context?.contact?.store_name || context?.store.name || "Store"

  return {
    title: {
      default: `${storeName} | ${t("metadata.description")}`,
      template: `%s | ${storeName}`,
    },
    description: t("metadata.description"),
    alternates: {
      languages: {
        en: "/en",
        ar: "/ar",
      },
    },
    openGraph: {
      title: `${storeName}`,
      description: t("metadata.description"),
      locale: locale === "ar" ? "ar_EG" : "en_US",
      siteName: storeName,
    },
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!locales.includes(locale as (typeof locales)[number])) {
    notFound()
  }

  const dir = locale === "ar" ? "rtl" : "ltr"
  const tenantSlug = await resolveTenant()
  const context = await getStorefrontContext(tenantSlug)

  const storeName =
    context?.contact?.store_name ||
    context?.store.name ||
    (tenantSlug === "brova" ? "Brova" : tenantSlug)
  const siteUrl = context?.primary_domain
    ? `https://${context.primary_domain}`
    : `https://${tenantSlug === "brova" ? "brova.vercel.app" : `${tenantSlug}.brova.shop`}`

  const { NextIntlClientProvider } = await import("next-intl")
  const { getMessages } = await import("next-intl/server")

  let messages: Record<string, unknown>

  try {
    messages = await getMessages({ locale })
  } catch (error) {
    console.error(`Error loading messages for locale ${locale}:`, error)
    messages = {}
  }

  const { ThemeProvider } = await import("@/components/theme-provider")
  const { AI } = await import("@/app/actions")
  const { ModalStackProvider } = await import(
    "@/components/modal-stack/modal-stack-context"
  )
  const { ModalStackContainer } = await import(
    "@/components/modal-stack/modal-stack-container"
  )
  const { PageScaleWrapper } = await import(
    "@/components/modal-stack/page-scale-wrapper"
  )
  const { Analytics } = await import("@vercel/analytics/next")
  const { SpeedInsights } = await import("@vercel/speed-insights/next")
  const Script = (await import("next/script")).default

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: storeName,
        url: siteUrl,
        email: context?.contact?.email,
        telephone: context?.contact?.phone,
        address: context?.contact?.address
          ? {
              "@type": "PostalAddress",
              "streetAddress": context.contact.address,
              "addressCountry": context.contact.country,
            }
          : undefined,
        description: "Streetwear fashion store",
        availableLanguage: ["en", "ar"],
        inLanguage: ["en-US", "ar-EG"],
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: storeName,
        publisher: {
          "@id": `${siteUrl}/#organization`,
        },
        inLanguage: "en-US",
      },
    ],
  }

  return (
    <div lang={locale} dir={dir} className="min-h-screen">
      <Script
        id="json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <NextIntlClientProvider messages={messages}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <AI>
            <ModalStackProvider>
              <PageScaleWrapper>
                {children}
                <Analytics />
                <SpeedInsights />
              </PageScaleWrapper>
              <ModalStackContainer />
            </ModalStackProvider>
          </AI>
        </ThemeProvider>
      </NextIntlClientProvider>
    </div>
  )
}
