'use client'

import { useState } from 'react'
import Image from 'next/image'
import LegalModal from './LegalModal'

export default function Footer() {
  const [modalOpen, setModalOpen] = useState(false)
  const [modalType, setModalType] = useState<'impressum' | 'datenschutz'>('impressum')

  const openModal = (type: 'impressum' | 'datenschutz') => {
    setModalType(type)
    setModalOpen(true)
  }

  return (
    <>
      <footer className="bg-brand-navy text-white py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="text-left relative -mt-16">
              <Image
                src="/Gehirn_Transparent.png"
                alt="PräsenzWert Logo"
                width={180}
                height={60}
                className="h-56 w-auto brightness-0 invert block object-contain -ml-14"
              />
              <p className="text-gray-400 leading-relaxed absolute bottom-14 left-0 right-0 bg-brand-navy/80 p-2">
                Unternehmenswebsites für kleine und mittelständische Betriebe & Organisationen in der Region Rhein · Ahr · Eifel.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#home" className="text-gray-400 hover:text-brand-cyan transition-colors">
                    Home
                  </a>
                </li>
                <li>
                  <a href="#leistungen" className="text-gray-400 hover:text-brand-cyan transition-colors">
                    Leistungen
                  </a>
                </li>
                <li>
                  <a href="#arbeitsweise" className="text-gray-400 hover:text-brand-cyan transition-colors">
                    Arbeitsweise
                  </a>
                </li>
                <li>
                  <a href="#hinweise" className="text-gray-400 hover:text-brand-cyan transition-colors">
                    Hinweise
                  </a>
                </li>
                <li>
                  <a href="#kontakt" className="text-gray-400 hover:text-brand-cyan transition-colors">
                    Kontakt
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-4">Rechtliches</h4>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => openModal('impressum')}
                    className="text-gray-400 hover:text-brand-cyan transition-colors text-left w-full"
                  >
                    Impressum
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => openModal('datenschutz')}
                    className="text-gray-400 hover:text-brand-cyan transition-colors text-left w-full"
                  >
                    Datenschutz
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} PräsenzWert. Alle Rechte vorbehalten.</p>
          </div>
        </div>
      </footer>

      <LegalModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        type={modalType}
      />
    </>
  )
}
