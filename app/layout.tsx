import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import Script from "next/script"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "Brova | بروڤه - Egyptian Streetwear Fashion Store",
    template: "%s | Brova",
  },
  description:
    "Brova (بروڤه / بروفه ستور / بورفه شوب) is your go-to Egyptian fashion destination for modern streetwear. Shop hoodies, joggers, t-shirts, and accessories with AI-powered try-on experience. Fast delivery to Cairo and Giza.",
  keywords: [
    "Brova",
    "بروڤه",
    "بروفه ستور",
    "بورفه شوب",
    "Egyptian fashion",
    "streetwear Egypt",
    "online clothing store Egypt",
    "Cairo fashion",
    "Giza shopping",
    "Egyptian streetwear",
    "modern clothing Egypt",
    "try-on experience",
  ],
  authors: [{ name: "Brova" }],
  creator: "Brova",
  publisher: "Brova",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://brova.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Brova | بروڤه - Egyptian Streetwear Fashion",
    description:
      "Modern streetwear fashion for Egypt. Shop the latest collections with AI try-on. Fast delivery to Cairo & Giza.",
    url: "https://brova.vercel.app",
    siteName: "Brova",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Brova - Egyptian Fashion Store",
      },
    ],
    locale: "en_US",
    alternateLocale: ["ar_EG"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Brova | بروڤه - Egyptian Streetwear",
    description: "Modern streetwear fashion for Egypt with AI try-on experience",
    images: ["/twitter-card.jpg"],
    creator: "@brova",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-32x32.jpg", type: "image/png", sizes: "32x32" },
      { url: "/icon-16x16.jpg", type: "image/png", sizes: "16x16" },
    ],
    apple: [{ url: "/apple-touch-icon.jpg", sizes: "180x180", type: "image/png" }],
    other: [
      {
        rel: "mask-icon",
        url: "/safari-pinned-tab.svg",
      },
    ],
  },
  manifest: "/site.webmanifest",
  generator: "v0.app",
}

export const viewport: Viewport = {
  themeColor: "#1a1a1a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://brova.vercel.app/#organization",
      name: "Brova",
      alternateName: ["بروڤه", "بروفه ستور", "بورفه شوب"],
      url: "https://brova.vercel.app",
      logo: "https://brova.vercel.app/brova-logo-full.png",
      description: "Egyptian streetwear fashion store offering modern clothing with AI-powered try-on experience",
      areaServed: {
        "@type": "Country",
        name: "Egypt",
      },
      availableLanguage: ["en", "ar"],
      inLanguage: ["en-US", "ar-EG"],
    },
    {
      "@type": "WebSite",
      "@id": "https://brova.vercel.app/#website",
      url: "https://brova.vercel.app",
      name: "Brova",
      description: "Egyptian Streetwear Fashion Store with AI Try-On",
      publisher: {
        "@id": "https://brova.vercel.app/#organization",
      },
      inLanguage: "en-US",
    },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <Script id="json-ld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
