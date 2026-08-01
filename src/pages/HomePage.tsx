import SiteHeader from '../components/SiteHeader'
import Hero from '../components/Hero'
import SearchDemo from '../components/SearchDemo'
import StatsBar from '../components/StatsBar'
import Features from '../components/Features'
import HowItWorks from '../components/HowItWorks'
import Pricing from '../components/Pricing'
import CtaBanner from '../components/CtaBanner'
import Footer from '../components/Footer'
import MobileNav from '../components/MobileNav'

const HomePage = () => {
  return (
    <>
      <SiteHeader />
      <Hero />
      <SearchDemo />
      <StatsBar />
      <Features />
      <HowItWorks />
      <Pricing />
      <CtaBanner />
      <Footer />
      <MobileNav />
    </>
  )
}

export default HomePage
