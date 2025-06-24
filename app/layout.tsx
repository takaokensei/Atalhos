import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "../components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Atalho - Organizador de Links",
  description: "Organize seus links com slugs inteligentes gerados por IA",
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/svg+xml" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/svg+xml" }],
    shortcut: "/favicon.png",
  },
  manifest: "/site.webmanifest",
  generator: "v0.dev",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#3B82F6" },
    { media: "(prefers-color-scheme: dark)", color: "#1E40AF" },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Primary favicon */}
        <link rel="icon" href="/favicon.png" type="image/svg+xml" />

        {/* Fallback favicons for different sizes */}
        <link rel="icon" href="/favicon-32x32.png" sizes="32x32" type="image/svg+xml" />
        <link rel="icon" href="/favicon-16x16.png" sizes="16x16" type="image/svg+xml" />

        {/* Apple touch icon */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* Theme colors */}
        <meta name="theme-color" content="#3B82F6" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#1E40AF" media="(prefers-color-scheme: dark)" />

        {/* Additional meta tags for better favicon support */}
        <meta name="msapplication-TileColor" content="#3B82F6" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body className={inter.className}>
        <ThemeProvider defaultTheme="system" storageKey="atalho-theme">
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
