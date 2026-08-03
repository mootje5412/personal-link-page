import Navbar from './components/Navbar';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import Countries from './components/Countries';
import Setup from './components/Setup';
import Footer from './components/Footer';
import './App.css';

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <Countries />
        <Setup />
      </main>
      <Footer />
    </>
  );
}
