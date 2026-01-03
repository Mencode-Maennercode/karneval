'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowDown } from 'lucide-react'
import Image from 'next/image'

export default function HeroSection() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Calculate logo position and scale based on scroll - reverse the initial animation
  const scrollProgress = Math.min(1, scrollY * 0.003)
  
  // Reverse the initial animation: start at normal (1) and go back to initial state (0.5 scale, -100 y, -50 x)
  const logoScale = 1 - scrollProgress * 0.5
  const logoOpacity = 1 - scrollProgress
  const logoY = -scrollProgress * 100
  const logoX = -scrollProgress * 50

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image Layer */}
      <div 
        className="absolute inset-0"
        style={{
          opacity: Math.max(0, 1 - scrollY * 0.002)
        }}
      >
        <Image
          src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2000"
          alt="Professional workspace background"
          fill
          className="object-cover"
          priority
        />
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/80 to-brand-navy/70"></div>
      </div>

      {/* Logo as Background Overlay - Large, Left-Aligned, Semi-transparent with scroll animation */}
      <div className="absolute inset-0 flex items-start justify-start pointer-events-none pl-8 sm:pl-16 pt-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: -100, x: -50 }}
          animate={{ 
            opacity: logoOpacity * 0.3, 
            scale: logoScale,
            y: logoY,
            x: logoX
          }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="relative w-full max-w-4xl hidden sm:block"
        >
          <Image
            src="/Gehirn_Transparent.png"
            alt="PräsenzWert Logo Background"
            width={1600}
            height={800}
            className="w-full h-auto opacity-30"
          />
        </motion.div>
      </div>

      {/* Mobile Logo Overlay - Positioned over title */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none sm:hidden overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 1 }}
          animate={{ opacity: 0.4, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[280px] max-w-[80vw]"
        >
          <Image
            src="/Gehirn_Transparent.png"
            alt="PräsenzWert Logo Mobile"
            width={800}
            height={400}
            className="w-full h-auto opacity-40"
          />
        </motion.div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="max-w-5xl mx-auto text-center">
          {/* Main Heading */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mb-8"
          >
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white mb-4 sm:mb-6 leading-tight drop-shadow-2xl">
              Präsenz<span className="text-brand-cyan">W</span>ert
            </h1>
            <div className="hidden sm:block">
              <p className="text-2xl sm:text-3xl text-white/90 font-semibold mb-4 drop-shadow-xl">
                Innovation für Digitale Sichtbarkeit
              </p>
              <p className="text-xl sm:text-2xl text-gray-200 drop-shadow-lg">
                Eine professionelle Online-Präsenz in der Region Rhein · Ahr · Eifel
              </p>
            </div>
          </motion.div>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-base sm:text-lg sm:text-xl text-gray-300 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed px-4 sm:px-0"
          >
            <span className="sm:hidden">Informative Unternehmenswebsites für kleine und mittelständische Organisationen.</span>
            <span className="hidden sm:inline">Ich erstelle informative Unternehmenswebsites für kleine und mittelständische Organisationen. 
            Klare Struktur, ansprechendes Design, faire Preise.</span>
          </motion.p>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="mb-12 sm:mb-20"
          >
            <a
              href="#leistungen"
              className="inline-flex items-center gap-2 bg-brand-cyan text-white px-6 sm:px-10 py-3 sm:py-5 rounded-lg font-semibold text-base sm:text-lg hover:bg-white hover:text-brand-navy transition-all duration-300 shadow-2xl hover:shadow-brand-cyan/50 hover:scale-105"
            >
              Mehr Erfahren
            </a>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.2 }}
            className="text-center"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-flex flex-col items-center gap-2 text-gray-300"
            >
              <span className="hidden sm:inline text-sm">Nach unten scrollen</span>
              <ArrowDown size={24} className="text-brand-cyan" />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}