'use client'

import { motion } from 'framer-motion'
import { Monitor, Palette, FileText, Mail, MapPin, X } from 'lucide-react'

const servicesIncluded = [
  {
    icon: Monitor,
    title: 'Technische Umsetzung',
    description: 'Erstellung von Websites mit modernen Web-Frameworks und Templates. Die technische Basis ist solide und auf Informationsdarstellung ausgelegt.',
  },
  {
    icon: Palette,
    title: 'Struktur & Design',
    description: 'Klare Seitenstruktur und ansprechendes Design für die Unternehmenspräsentation. Anpassung an die Markenfarben und das Logo.',
  },
  {
    icon: FileText,
    title: 'Content-Integration',
    description: 'Integration der bereitgestellten Inhalte (Texte, Bilder, Unternehmensdaten) strukturiert in die Website.',
  },
  {
    icon: Mail,
    title: 'Kontaktformulare',
    description: 'Einfache Kontaktmöglichkeiten für Kunden – technisch umgesetzt und funktional eingebunden.',
  },
  {
    icon: MapPin,
    title: 'Google Business Profile',
    description: 'Optional: Einrichtung und Pflege des Google Business Profils auf Basis der bereitgestellten Daten.',
  },
]

const servicesNotIncluded = [
  {
    icon: X,
    title: 'Online-Shops',
    description: 'Keine E-Commerce-Lösungen, Zahlungsabwicklung oder Warenwirtschaftssysteme.',
  },
  {
    icon: X,
    title: 'Benutzer-Logins',
    description: 'Keine geschützten Bereiche, Mitgliederverwaltung oder Nutzerdatenbanken.',
  },
  {
    icon: X,
    title: 'Individuelle Software',
    description: 'Keine maßgeschneiderte Programmierung oder komplexe Webanwendungen.',
  },
  {
    icon: X,
    title: 'Rechtliche Beratung',
    description: 'Keine Rechtsberatung, DSGVO-Garantien oder Haftung für rechtliche Inhalte. Rechtliche Texte werden vom Auftraggeber bereitgestellt.',
  },
]

export default function ServicesSection() {
  return (
    <section id="leistungen" className="py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-brand-navy mb-4">
            Was ich anbiete
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Klare Leistungen für informative Unternehmenswebsites
          </p>
        </motion.div>

        <div className="mb-12">
          <h3 className="text-2xl font-bold text-brand-navy mb-8 text-center">
            Das ist enthalten:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {servicesIncluded.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="bg-gradient-to-br from-brand-light to-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-brand-cyan/20"
              >
                <div className="bg-brand-cyan/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                  <service.icon className="w-8 h-8 text-brand-cyan" />
                </div>
                <h3 className="text-xl font-bold text-brand-navy mb-4">
                  {service.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {service.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-2xl font-bold text-brand-navy mb-8 text-center">
            Das ist nicht enthalten:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {servicesNotIncluded.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-gray-50 p-6 rounded-xl border-2 border-gray-200"
              >
                <div className="bg-gray-200 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                  <service.icon className="w-6 h-6 text-gray-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-3">
                  {service.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {service.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
