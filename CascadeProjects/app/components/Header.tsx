'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      setIsScrolled(currentScrollY > 50)
      setScrollY(currentScrollY)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Calculate logo visibility in header
  const logoOpacity = scrollY > 350 ? Math.min(1, (scrollY - 350) * 0.02) : 0
  const logoScale = scrollY > 350 ? Math.min(1.2, 0.8 + (scrollY - 350) * 0.003) : 0.8

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex-shrink-0 relative">
            {/* Brain logo that appears when scrolling */}
            <div 
              className="transition-all duration-300"
              style={{
                opacity: logoOpacity,
                transform: `scale(${logoScale})`,
                filter: scrollY > 350 ? 'invert(0.9) sepia(1) saturate(8) hue-rotate(210deg) brightness(0.7)' : 'invert(1)'
              }}
            >
              <Image
                src="/Gehirn_Transparent.png"
                alt="PräsenzWert Logo"
                width={420}
                height={210}
                className="h-40 w-auto"
              />
            </div>
          </div>

          <nav className="hidden md:flex space-x-8">
            <a
              href="#home"
              className="text-brand-navy hover:text-brand-cyan transition-colors font-medium"
            >
              Home
            </a>
            <a
              href="#leistungen"
              className="text-brand-navy hover:text-brand-cyan transition-colors font-medium"
            >
              Leistungen
            </a>
            <a
              href="#arbeitsweise"
              className="text-brand-navy hover:text-brand-cyan transition-colors font-medium"
            >
              Arbeitsweise
            </a>
            <a
              href="#hinweise"
              className="text-brand-navy hover:text-brand-cyan transition-colors font-medium"
            >
              Hinweise
            </a>
            <a
              href="#kontakt"
              className="text-brand-navy hover:text-brand-cyan transition-colors font-medium"
            >
              Kontakt
            </a>
          </nav>

          <div className="hidden md:block">
            <a
              href="#kontakt"
              className="bg-brand-cyan text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-navy transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Jetzt starten
            </a>
          </div>

          <button
            className="md:hidden text-brand-navy"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <nav className="container mx-auto px-4 py-4 flex flex-col space-y-4">
            <a
              href="#home"
              className="text-brand-navy hover:text-brand-cyan transition-colors font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </a>
            <a
              href="#leistungen"
              className="text-brand-navy hover:text-brand-cyan transition-colors font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Leistungen
            </a>
            <a
              href="#arbeitsweise"
              className="text-brand-navy hover:text-brand-cyan transition-colors font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Arbeitsweise
            </a>
            <a
              href="#hinweise"
              className="text-brand-navy hover:text-brand-cyan transition-colors font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Hinweise
            </a>
            <a
              href="#kontakt"
              className="text-brand-navy hover:text-brand-cyan transition-colors font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Kontakt
            </a>
            <a
              href="#kontakt"
              className="bg-brand-cyan text-white px-6 py-3 rounded-lg font-semibold text-center hover:bg-brand-navy transition-all"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Jetzt starten
            </a>
          </nav>
        </div>
      )}
    </header>
  )
}
