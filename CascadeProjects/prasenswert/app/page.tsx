import Header from './components/Header'
import HeroSection from './components/HeroSection'
import ServicesSection from './components/ServicesSection'
import BenefitsSection from './components/BenefitsSection'
import DisclaimerSection from './components/DisclaimerSection'
import ContactSection from './components/ContactSection'
import Footer from './components/Footer'

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <HeroSection />
      <ServicesSection />
      <BenefitsSection />
      <DisclaimerSection />
      <ContactSection />
      <Footer />
    </main>
  )
}
