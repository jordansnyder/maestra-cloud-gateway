import type { Metadata } from 'next'
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import Script from 'next/script'
import './globals.css'

const grotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-grotesk',
  display: 'swap',
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://maestra.cc'),
  title: {
    default: 'Maestra — Build Worlds That Respond',
    template: '%s | Maestra',
  },
  description: 'Open-source orchestration for immersive experiences. Connect devices, locations, and installations with secure, policy-driven message routing.',
  openGraph: {
    title: 'Maestra — Build Worlds That Respond',
    description: 'Open-source orchestration for immersive experiences. Connect devices, locations, and installations.',
    url: 'https://maestra.cc',
    siteName: 'Maestra',
    images: [{ url: '/images/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Maestra — Build Worlds That Respond',
    description: 'Open-source orchestration for immersive experiences.',
    images: ['/images/og-image.png'],
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${grotesk.variable} ${mono.variable}`}>
      <body className="font-sans">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-ink focus:text-paper focus:px-4 focus:py-2"
        >
          Skip to content
        </a>
        {children}
        <Script
          defer
          data-domain="maestra.cc"
          src="https://plausible.io/js/script.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}
