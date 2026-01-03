'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileMenuOpen])

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

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 bg-black z-40"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="md:hidden fixed top-0 right-0 h-dvh w-[300px] bg-white shadow-2xl z-50 border-l border-gray-200"
            >
              <div className="flex items-center justify-end h-16 px-5 border-b border-gray-200">
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-gray-600 hover:text-brand-navy"
                  aria-label="Menü schließen"
                >
                  <X size={24} />
                </button>
              </div>
              <nav className="px-5 py-4">
                <ul className="space-y-1">
                  <li>
                    <a href="#home" className="block rounded-md px-3 py-3 text-gray-800 hover:bg-gray-50" onClick={() => setIsMobileMenuOpen(false)}>Home</a>
                  </li>
                  <li>
                    <a href="#leistungen" className="block rounded-md px-3 py-3 text-gray-800 hover:bg-gray-50" onClick={() => setIsMobileMenuOpen(false)}>Leistungen</a>
                  </li>
                  <li>
                    <a href="#arbeitsweise" className="block rounded-md px-3 py-3 text-gray-800 hover:bg-gray-50" onClick={() => setIsMobileMenuOpen(false)}>Arbeitsweise</a>
                  </li>
                  <li>
                    <a href="#hinweise" className="block rounded-md px-3 py-3 text-gray-800 hover:bg-gray-50" onClick={() => setIsMobileMenuOpen(false)}>Hinweise</a>
                  </li>
                  <li>
                    <a href="#kontakt" className="block rounded-md px-3 py-3 text-gray-800 hover:bg-gray-50" onClick={() => setIsMobileMenuOpen(false)}>Kontakt</a>
                  </li>
                </ul>
              </nav>
              <div className="mt-auto px-5 pb-6">
                <a href="#kontakt" className="block w-full text-center rounded-lg bg-brand-cyan text-white font-semibold py-3 hover:bg-brand-navy transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                  Jetzt starten
                </a>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </header>
  )
}
