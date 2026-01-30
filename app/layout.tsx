import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import { AccessibilityProvider } from '@/components/accessibility'
import AccessibilityFAB from '@/components/accessibility/AccessibilityFAB'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Fernhill Tribe',
  description: 'A secure digital hearth for the Fernhill Ecstatic Dance community',
  manifest: '/manifest.json',
  icons: {
    apple: '/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Fernhill Tribe',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#2D5A27',
  viewportFit: 'cover', // Enables safe-area-inset on iOS
  colorScheme: 'dark',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // suppressHydrationWarning prevents React errors when browser extensions inject HTML
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        {/* GoatCounter Analytics - Privacy-friendly, no cookies */}
        <script
          data-goatcounter="https://fernhill-community.goatcounter.com/count"
          async
          src="//gc.zgo.at/count.js"
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <AccessibilityProvider>
          {/* Skip link for keyboard users */}
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>
          
          <main id="main-content">
            {children}
          </main>
          
          {/* Floating accessibility button - always visible */}
          <AccessibilityFAB />
          
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'white',
              },
            }}
          />
        </AccessibilityProvider>
      </body>
    </html>
  )
}
