import type React from "react"
import "./globals.css"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html suppressHydrationWarning>
      <body className="font-sans antialiased bg-black overflow-hidden">
        {children}
      </body>
    </html>
  )
}
