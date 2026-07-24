import Hero from './components/Hero'
import Features from './components/Features'
import Pricing from './components/Pricing'
import Footer from './components/Footer'
import MobileNav from './components/MobileNav'
import './App.css'

function App() {
  return (
    <div className="app">
      <Hero />
      <Features />
      <Pricing />
      <Footer />
      <MobileNav />
    </div>
  )
}

export default App
