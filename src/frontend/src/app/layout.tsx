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
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
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
