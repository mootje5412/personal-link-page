import { useEffect, useState } from 'react';
import { COUNTRIES } from '../data/countries';
import './CountryRotator.css';

export default function CountryRotator() {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<'in' | 'out'>('in');

  useEffect(() => {
    const hold = window.setTimeout(() => setPhase('out'), 2800);
    return () => window.clearTimeout(hold);
  }, [index]);

  useEffect(() => {
    if (phase !== 'out') return;
    const swap = window.setTimeout(() => {
      setIndex((i) => (i + 1) % COUNTRIES.length);
      setPhase('in');
    }, 480);
    return () => window.clearTimeout(swap);
  }, [phase]);

  return (
    <span className="country-rotator" aria-live="polite">
      <span key={index} className={`country-word country-${phase}`}>
        {COUNTRIES[index]}
      </span>
    </span>
  );
}
