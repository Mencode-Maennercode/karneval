import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PräsenzWert - Professionelle Unternehmenswebsites für Rhein, Ahr & Eifel',
  description: 'Ich erstelle informative Unternehmenswebsites für kleine und mittelständische Betriebe in der Region Rhein, Ahr und Eifel. Klare Struktur, faire Preise, moderne Umsetzung mit Templates und CMS-Systemen.',
  keywords: 'Unternehmenswebsite, Website erstellen, Rhein, Ahr, Eifel, KMU, Firmenwebsite, Google Business Profile, Webdesign Region',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
