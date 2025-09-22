import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Atalho Links - Gerador Inteligente de Links Curtos",
  description:
    "Crie links curtos personalizados com IA. Organize, compartilhe e acesse seus links favoritos com facilidade.",
  keywords: ["links curtos", "url shortener", "IA", "organização", "compartilhamento"],
  authors: [{ name: "Atalho Links" }],
  creator: "Atalho Links",
  publisher: "Atalho Links",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://atalho.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Atalho Links - Gerador Inteligente de Links Curtos",
    description:
      "Crie links curtos personalizados com IA. Organize, compartilhe e acesse seus links favoritos com facilidade.",
    url: "https://atalho.vercel.app",
    siteName: "Atalho Links",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Atalho Links - Gerador Inteligente de Links Curtos",
    description:
      "Crie links curtos personalizados com IA. Organize, compartilhe e acesse seus links favoritos com facilidade.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "google-site-verification-code",
  },
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#000000" />
        <meta name="color-scheme" content="light dark" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
          <div className="relative min-h-screen bg-background text-foreground">{children}</div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
