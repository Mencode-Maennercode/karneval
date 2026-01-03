'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface LegalModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'impressum' | 'datenschutz'
}

export default function LegalModal({ isOpen, onClose, type }: LegalModalProps) {
  if (!isOpen) return null

  const impressumContent = (
    <div className="space-y-6">
      <section>
        <h3 className="text-xl font-bold text-brand-navy mb-3">Angaben gemäß § 5 TMG</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-gray-700 text-sm mb-1">
            <strong>PräsenzWert – Dennis Heidenreich</strong>
          </p>
          <p className="text-gray-700 text-sm mb-1">Dennis Heidenreich</p>
          <p className="text-gray-700 text-sm mb-1">[Straße und Hausnummer]</p>
          <p className="text-gray-700 text-sm">[PLZ] [Ort], Deutschland</p>
        </div>
      </section>

      <section>
        <h3 className="text-xl font-bold text-brand-navy mb-3">Kontakt</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-gray-700 text-sm mb-1">
            <strong>Telefon:</strong> [Telefonnummer]
          </p>
          <p className="text-gray-700 text-sm">
            <strong>E-Mail:</strong> info@praesenzwert.de
          </p>
        </div>
      </section>

      <section>
        <h3 className="text-xl font-bold text-brand-navy mb-3">Rechtsform</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-gray-700 text-sm">Einzelunternehmen</p>
        </div>
      </section>

      <section>
        <h3 className="text-xl font-bold text-brand-navy mb-3">Umsatzsteuer</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-gray-700 text-sm">
            Gemäß § 19 UStG wird keine Umsatzsteuer berechnet (Kleinunternehmerregelung).
          </p>
        </div>
      </section>

      <section>
        <h3 className="text-xl font-bold text-brand-navy mb-3">Bildnachweise</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-gray-700 text-sm mb-2">
            <strong>Verwendete Bilder und deren Lizenzen:</strong>
          </p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>
              <strong>Logo und Gehirn-Grafik:</strong> Eigene Grafiken / PräsenzWert
            </li>
            <li>
              <strong>Hero-Hintergrundbild:</strong> Foto von Unsplash<br />
              <span className="text-xs">
                Lizenz: Unsplash License (kostenfreie Nutzung erlaubt)
              </span>
            </li>
          </ul>
        </div>
      </section>

      <section>
        <h3 className="text-xl font-bold text-brand-navy mb-3">Haftung für Inhalte</h3>
        <p className="text-gray-700 text-sm leading-relaxed">
          Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den 
          allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht 
          verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen 
          zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
        </p>
      </section>
    </div>
  )

  const datenschutzContent = (
    <div className="space-y-6">
      <section>
        <h3 className="text-xl font-bold text-brand-navy mb-3">Datenschutz auf einen Blick</h3>
        <p className="text-gray-700 text-sm leading-relaxed mb-4">
          Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten 
          passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie 
          persönlich identifiziert werden können.
        </p>

        <h4 className="text-lg font-semibold text-brand-navy mb-2">Verantwortliche Stelle</h4>
        <p className="text-gray-700 text-sm leading-relaxed mb-3">
          <strong>PräsenzWert – Dennis Heidenreich</strong><br />
          Dennis Heidenreich, [Straße und Hausnummer], [PLZ] [Ort], Deutschland<br />
          E-Mail: info@praesenzwert.de
        </p>
      </section>

      <section>
        <h3 className="text-xl font-bold text-brand-navy mb-3">Hosting und Datenverarbeitung</h3>
        <p className="text-gray-700 text-sm leading-relaxed mb-3">
          Diese Website wird bei netcup gehostet. netcup ist ein deutscher Hosting-Anbieter mit Rechenzentren 
          in Deutschland und Österreich, die vollständig DSGVO-konform betrieben werden.
        </p>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-gray-700 text-sm mb-2">
            <strong>Hosting-Details:</strong>
          </p>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            <li>Anbieter: netcup GmbH</li>
            <li>Serverstandort: Deutschland/Österreich (EU)</li>
            <li>DSGVO-Konformität: Ja, vollständig konform</li>
            <li>ISO 27001 Zertifizierung: Vorhanden</li>
          </ul>
        </div>
        <p className="text-gray-700 text-sm leading-relaxed mt-3">
          Durch die Wahl eines europäischen Hosting-Anbieters stelle ich sicher, dass Ihre Daten nicht unter 
          ausländische Gesetze wie den US CLOUD Act fallen und ausschließlich nach europäischen Datenschutzstandards 
          verarbeitet werden.
        </p>
        <p className="text-gray-700 text-sm leading-relaxed mt-3">
          <strong>Hinweis zu Auftragsverarbeitungsverträgen:</strong> Da auf dieser Website aktuell keine 
          personenbezogenen Daten serverseitig gespeichert werden (das Kontaktformular leitet Daten nur an mich weiter), 
          ist aktuell kein Auftragsverarbeitungsvertrag mit netcup erforderlich. Sollte sich dies in Zukunft ändern, 
          werde ich entsprechende Verträge abschließen.
        </p>
      </section>

      <section>
        <h3 className="text-xl font-bold text-brand-navy mb-3">Kontaktformular</h3>
        <p className="text-gray-700 text-sm leading-relaxed mb-3">
          Wenn Sie mir über das Kontaktformular eine Anfrage senden, werden die von Ihnen eingegebenen Daten 
          ausschließlich zur Bearbeitung Ihrer Anfrage verwendet. Ich speichere diese Daten nur solange, wie es 
          für die Bearbeitung Ihrer Anfrage erforderlich ist.
        </p>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-gray-700 text-sm mb-2">
            <strong>Im Kontaktformular erfasste Daten:</strong>
          </p>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            <li>Name (Pflichtfeld)</li>
            <li>E-Mail-Adresse (Pflichtfeld)</li>
            <li>Unternehmensname (optional)</li>
            <li>Telefonnummer (optional)</li>
            <li>Nachricht (Pflichtfeld)</li>
          </ul>
        </div>
        <p className="text-gray-700 text-sm leading-relaxed mt-3">
          <strong>Wichtiger Hinweis:</strong> Aktuell werden die Formulardaten nur im Browser verarbeitet und 
          an mich weitergeleitet. Es findet keine dauerhafte Speicherung auf einem Server statt. Ich verwende 
          diese Daten ausschließlich zur Kontaktaufnahme mit Ihnen.
        </p>
      </section>

      <section>
        <h3 className="text-xl font-bold text-brand-navy mb-3">Externe Inhalte und Dienste</h3>
        
        <h4 className="text-lg font-semibold text-brand-navy mb-2">Google Fonts (lokales Hosting)</h4>
        <p className="text-gray-700 text-sm leading-relaxed mb-3">
          Diese Seite nutzt zur einheitlichen Darstellung von Schriftarten Google Fonts. Diese sind lokal auf 
          meinem Server installiert, sodass keine Verbindung zu Servern von Google hergestellt wird.
        </p>

        <h4 className="text-lg font-semibold text-brand-navy mb-2">Unsplash (Bildmaterial)</h4>
        <p className="text-gray-700 text-sm leading-relaxed mb-3">
          Diese Website verwendet Bilder von Unsplash. Beim Laden dieser Bilder kann Ihre IP-Adresse an Unsplash übermittelt werden.
          Die Nutzung erfolgt auf Grundlage meines berechtigten Interesses an einer ansprechenden Darstellung 
          meiner Website.
        </p>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-gray-700 text-sm">
            <strong>Lizenzhinweis:</strong> Alle verwendeten Bilder von Unsplash stehen unter der Unsplash-Lizenz und 
            können kostenlos verwendet werden.
          </p>
        </div>
      </section>

      <section>
        <h3 className="text-xl font-bold text-brand-navy mb-3">Ihre Rechte</h3>
        <p className="text-gray-700 text-sm leading-relaxed mb-3">
          Da auf dieser Website aktuell keine personenbezogenen Daten serverseitig gespeichert werden, 
          gibt es auch keine gespeicherten Daten, über die Auskunft erteilt werden könnte.
        </p>
        <p className="text-gray-700 text-sm leading-relaxed mb-3">
          Sollten Sie mir über das Kontaktformular Daten übermitteln, werden diese ausschließlich zur Bearbeitung 
          Ihrer Anfrage verwendet und nicht dauerhaft gespeichert. Sie haben jederzeit das Recht, 
          Löschung dieser Daten zu verlangen.
        </p>
        <p className="text-gray-700 text-sm leading-relaxed">
          Bei Fragen zum Datenschutz können Sie sich jederzeit an mich wenden: info@praesenzwert.de
        </p>
      </section>

      <section>
        <h3 className="text-xl font-bold text-brand-navy mb-3">SSL-Verschlüsselung</h3>
        <p className="text-gray-700 text-sm leading-relaxed">
          Diese Seite nutzt aus Sicherheitsgründen eine SSL/TLS-Verschlüsselung. Eine verschlüsselte Verbindung 
          erkennen Sie daran, dass die Adresszeile des Browsers von „http://" auf „https://" wechselt und an dem 
          Schloss-Symbol in Ihrer Browserzeile.
        </p>
      </section>
    </div>
  )

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-brand-navy to-brand-cyan text-white px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                {type === 'impressum' ? 'Impressum' : 'Datenschutzerklärung'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Schließen"
              >
                <X size={24} />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
              {type === 'impressum' ? impressumContent : datenschutzContent}
              
              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-gray-500 text-xs">
                  Stand: Januar 2026
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
