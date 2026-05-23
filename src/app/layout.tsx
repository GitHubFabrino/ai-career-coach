import type { Metadata, Viewport } from 'next'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'Coach Carrière IA — Découvre ta voie idéale',
  description:
    'Un agent IA de coaching carrière qui analyse ton profil, détecte tes blocages, propose les meilleurs parcours et construit ta feuille de route — en 5 minutes. Gratuit, sans inscription.',
  keywords: ['coach carrière', 'IA', 'Madagascar', 'parcours professionnel', 'CV', 'entretien', 'Claude AI'],
  openGraph: {
    title: 'Coach Carrière IA',
    description: 'Découvre ta voie professionnelle idéale grâce à une IA de coaching personnalisée.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#05050f',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={`${inter.variable} ${plusJakarta.variable} h-full`}>
      <body className="min-h-full min-h-dvh" style={{ background: '#05050f', color: '#f1f5f9' }}>
        {children}
      </body>
    </html>
  )
}
