'use client'

import { motion } from 'framer-motion'
import { Layers, Wrench, Sparkles, Clock } from 'lucide-react'

const workingMethod = [
  {
    icon: Layers,
    title: 'Moderne Templates',
    description: 'Nutzung bewährter Web-Frameworks und Templates als technische Grundlage. Das ermöglicht eine effiziente Umsetzung und faire Preise.',
  },
  {
    icon: Wrench,
    title: 'Standard-Systeme',
    description: 'Die technische Umsetzung erfolgt mit etablierten CMS-Systemen und Tools. Keine maßgeschneiderte Programmierung, sondern solide Standardlösungen.',
  },
  {
    icon: Sparkles,
    title: 'KI-unterstützte Workflows',
    description: 'Einsatz moderner, KI-gestützter Werkzeuge, um Arbeitsabläufe zu optimieren und Kosten niedrig zu halten.',
  },
  {
    icon: Clock,
    title: 'Fokus auf Effizienz',
    description: 'Durch den Einsatz von Standardlösungen kann schnell und kostengünstig gearbeitet werden – ideal für informative Unternehmenswebsites.',
  },
]

export default function BenefitsSection() {
  return (
    <section id="arbeitsweise" className="py-24 bg-gradient-to-br from-brand-navy to-[#0f1b33] relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-cyan rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            So arbeite ich
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Effizient, transparent und mit modernen Werkzeugen
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {workingMethod.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white/10 backdrop-blur-lg border border-white/20 p-8 rounded-2xl hover:bg-white/15 transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="bg-brand-cyan/20 p-3 rounded-xl flex-shrink-0">
                  <benefit.icon className="w-8 h-8 text-brand-cyan" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-3">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 text-center"
        >
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 max-w-3xl mx-auto">
            <p className="text-gray-300 text-lg leading-relaxed">
              <span className="text-brand-cyan font-semibold">Wichtig:</span> Erstellung der technischen Umsetzung der Website. 
              Die Verantwortung für Inhalte, rechtliche Texte (Impressum, Datenschutz) und rechtliche Konformität liegt beim Auftraggeber.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
