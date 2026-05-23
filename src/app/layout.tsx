import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Coach Carrière IA — Découvre ta voie',
  description:
    'Une expérience de coaching carrière IA immersive qui aide les étudiants à trouver leur parcours professionnel idéal à Madagascar.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={`${inter.variable} h-full`}>
      <body className="min-h-full" style={{ background: '#050510', color: '#e2e8f0' }}>
        {children}
      </body>
    </html>
  )
}
