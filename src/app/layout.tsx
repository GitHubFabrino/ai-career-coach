import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'AI Career Coach — Discover Your Path',
  description:
    'An immersive AI-powered career coaching experience that helps students find their ideal career path.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full" style={{ background: '#050510', color: '#e2e8f0' }}>
        {children}
      </body>
    </html>
  )
}
