'use client'

import { motion } from 'framer-motion'
import { Mail, Phone, MapPin, Send } from 'lucide-react'
import { useState } from 'react'

export default function ContactSection() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    message: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.name.trim()) {
      alert('Name ist ein Pflichtfeld.')
      return
    }
    
    if (!formData.email.trim()) {
      alert('E-Mail ist ein Pflichtfeld.')
      return
    }
    
    if (!formData.message.trim()) {
      alert('Nachricht ist ein Pflichtfeld.')
      return
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      alert('Bitte geben Sie eine gültige E-Mail-Adresse ein.')
      return
    }
    
    console.log('Form submitted:', formData)
    // Here you would typically send the data to your backend
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <section id="kontakt" className="py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-brand-navy mb-4">
            Jetzt Kontakt aufnehmen
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Vereinbarung eines unverbindlichen Beratungsgesprächs für das Website-Projekt
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-2xl font-bold text-brand-navy mb-6">
              Anfrage
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-brand-navy mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-brand-cyan focus:outline-none transition-colors"
                  placeholder="Vorname Nachname"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-brand-navy mb-2">
                  E-Mail *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-brand-cyan focus:outline-none transition-colors"
                  placeholder="beispiel@email.de"
                />
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-semibold text-brand-navy mb-2">
                  Unternehmen
                </label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-brand-cyan focus:outline-none transition-colors"
                  placeholder="Name des Unternehmens"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-brand-navy mb-2">
                  Telefon
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-brand-cyan focus:outline-none transition-colors"
                  placeholder="Telefonnummer"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-semibold text-brand-navy mb-2">
                  Nachricht *
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  value={formData.message}
                  onChange={handleChange}
                  rows={5}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-brand-cyan focus:outline-none transition-colors resize-none"
                  placeholder="Kurze Projektbeschreibung und Vorstellungen..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-brand-cyan text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-brand-navy transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                Unverbindliche Anfrage senden
                <Send size={20} />
              </button>
            </form>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div>
              <h3 className="text-2xl font-bold text-brand-navy mb-6">
                Ihre Region Rhein · Ahr · Eifel
              </h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-brand-cyan/10 p-3 rounded-lg">
                    <Mail className="w-6 h-6 text-brand-cyan" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-brand-navy mb-1">E-Mail</h4>
                    <p className="text-gray-600">info@praesenzwert.de</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-brand-cyan/10 p-3 rounded-lg">
                    <Phone className="w-6 h-6 text-brand-cyan" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-brand-navy mb-1">Telefon</h4>
                    <p className="text-gray-600">+49 (0) 123 456789</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-brand-cyan/10 p-3 rounded-lg">
                    <MapPin className="w-6 h-6 text-brand-cyan" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-brand-navy mb-1">Einzugsgebiet</h4>
                    <p className="text-gray-600">Rhein, Ahr, Eifel & Umgebung</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-brand-light to-white p-8 rounded-2xl border border-brand-cyan/20">
              <h4 className="font-bold text-brand-navy mb-4 text-xl">
                Unverbindliches Erstgespräch
              </h4>
              <p className="text-gray-600 leading-relaxed mb-4">
                Wir besprechen die Anforderungen und ich erstelle ein transparentes Angebot. 
                Keine versteckten Kosten, faire Preise für regionale Betriebe & Organisationen.
              </p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-brand-cyan rounded-full"></div>
                  Unverbindliche Beratung
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-brand-cyan rounded-full"></div>
                  Klare Leistungsbeschreibung
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-brand-cyan rounded-full"></div>
                  Faire, transparente Preise
                </li>
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
