import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Hero } from '@/components/sections/Hero'
import { Features } from '@/components/sections/Features'
import { Ecosystem } from '@/components/sections/Ecosystem'
import { SDKs } from '@/components/sections/SDKs'
import { HowItWorks } from '@/components/sections/HowItWorks'
import { Architecture } from '@/components/sections/Architecture'
import { Download } from '@/components/sections/Download'
import { CallToAction } from '@/components/sections/CallToAction'

export default function HomePage() {
  return (
    <>
      <Header />
      <main id="main-content">
        <Hero />
        <Features />
        <Ecosystem />
        <SDKs />
        <HowItWorks />
        <Architecture />
        <Download />
        <CallToAction />
      </main>
      <Footer />
    </>
  )
}
