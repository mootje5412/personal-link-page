import CTA from './components/CTA';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import TrustBar from './components/TrustBar';
import Features from './components/Features';
import HowItWorks from './components/HowItWorks';
import Countries from './components/Countries';
import Pricing from './components/Pricing';
import RefundPolicy from './components/RefundPolicy';
import FAQ from './components/FAQ';
import Footer from './components/Footer';

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <TrustBar />
        <Features />
        <HowItWorks />
        <Countries />
        <Pricing />
        <RefundPolicy />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
