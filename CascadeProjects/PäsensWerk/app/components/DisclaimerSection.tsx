'use client'

import { motion } from 'framer-motion'
import { AlertCircle, FileText, Shield, Users } from 'lucide-react'

export default function DisclaimerSection() {
  return (
    <section id="hinweise" className="py-24 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-brand-navy mb-4">
            Rechtliche Klarheit
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Transparente Informationen zu Leistungsumfang und Verantwortlichkeiten
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white border-2 border-brand-cyan/30 rounded-2xl p-8 mb-8"
          >
            <div className="flex items-start gap-4 mb-6">
              <div className="bg-brand-cyan/10 p-3 rounded-xl flex-shrink-0">
                <AlertCircle className="w-8 h-8 text-brand-cyan" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-brand-navy mb-4">
                  Wichtiger Hinweis
                </h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Erstellung von informativen Unternehmenswebsites als technische Dienstleistung. 
                  Das Angebot umfasst die Website-Erstellung mit modernen Frameworks, Templates und CMS-Systemen.
                </p>
                <p className="text-gray-700 leading-relaxed font-semibold">
                  Es handelt sich nicht um Programmierung, Softwareentwicklung oder IT-Beratung im klassischen Sinne. 
                  Es wird keine individuelle Softwareentwicklung angeboten.
                </p>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white p-6 rounded-xl border border-gray-200"
            >
              <div className="flex items-start gap-3 mb-4">
                <FileText className="w-6 h-6 text-brand-cyan flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-brand-navy mb-2">Rechtliche Texte</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Impressum, Datenschutzerklärung und alle rechtlich relevanten Texte werden vom Auftraggeber bereitgestellt. 
                    Es wird keine Rechtsberatung oder Haftung für rechtliche Inhalte übernommen.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white p-6 rounded-xl border border-gray-200"
            >
              <div className="flex items-start gap-3 mb-4">
                <Shield className="w-6 h-6 text-brand-cyan flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-brand-navy mb-2">Keine Garantien</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Es werden keine Sicherheitsaudits, DSGVO-Garantien oder Gewährleistungen für fehlerfreien Betrieb angeboten. 
                    Die Website wird nach bestem Wissen erstellt, aber ohne rechtliche oder technische Zusicherungen.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-white p-6 rounded-xl border border-gray-200"
            >
              <div className="flex items-start gap-3 mb-4">
                <Users className="w-6 h-6 text-brand-cyan flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-brand-navy mb-2">Verantwortung</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Der Auftraggeber ist verantwortlich für die Richtigkeit aller bereitgestellten Inhalte, Bilder und Informationen. 
                    Die rechtliche Konformität der Website liegt in der Verantwortung des Auftraggebers.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="bg-white p-6 rounded-xl border border-gray-200"
            >
              <div className="flex items-start gap-3 mb-4">
                <FileText className="w-6 h-6 text-brand-cyan flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-brand-navy mb-2">Leistungsumfang</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Die Leistung umfasst die technische Umsetzung informativer Unternehmenswebsites. 
                    Keine Shops, keine Benutzer-Logins, keine komplexen Webanwendungen.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
