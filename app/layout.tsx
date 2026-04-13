import { Geist, Geist_Mono, Merriweather, Instrument_Sans, Lora, JetBrains_Mono, Inter } from "next/font/google"
import { Metadata } from "next"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import { Analytics } from '@vercel/analytics/next'

const instrumentSansHeading = Instrument_Sans({subsets:['latin'],variable:'--font-heading'});

const lora = Lora({subsets:['latin'],variable:'--font-serif'});

const inter = Inter({subsets:['latin'],variable:'--font-sans'})

const jetbrainsMono = JetBrains_Mono({subsets:['latin'],variable:'--font-mono'})

export const metadata: Metadata = {
  title: "Recharge",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
                          "antialiased"
                        , lora.variable, instrumentSansHeading.variable, jetbrainsMono.variable, "font-sans", inter.variable)}
    >
      <body>
        <ThemeProvider>{children}</ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
