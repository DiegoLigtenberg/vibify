import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { StoreProvider } from '../components/providers/store-provider'
import { MobileLayout } from '../components/layout/mobile-layout'

// Disable static generation for this layout
export const dynamic = 'force-dynamic'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Vibify - Music Streaming Platform',
  description: 'A professional Spotify clone built with Next.js and FastAPI',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="shortcut icon" href="/favicon.ico" />
      </head>
      <body className={`${inter.className} bg-black text-white`}>
        <StoreProvider>
          <MobileLayout>
            {children}
          </MobileLayout>
        </StoreProvider>
      </body>
    </html>
  )
}
