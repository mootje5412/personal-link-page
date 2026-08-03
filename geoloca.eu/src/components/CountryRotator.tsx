import type { COUNTRIES } from '../data/countries';
import './CountryRotator.css';

type Props = {
  country: (typeof COUNTRIES)[number];
  phase: 'in' | 'out';
};

export default function CountryRotator({ country, phase }: Props) {
  return (
    <span className="country-rotator" aria-live="polite">
      <span key={country} className={`country-word country-${phase}`}>
        {country}
      </span>
    </span>
  );
}
