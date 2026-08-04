import './PhantomLogo.css';

interface PhantomLogoProps {
  size?: number;
  glow?: boolean;
}

export default function PhantomLogo({ size = 48, glow = false }: PhantomLogoProps) {
  return (
    <div
      className={`phantom-logo ${glow ? 'phantom-logo--glow' : ''}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="phantom-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#534BB1" />
            <stop offset="50%" stopColor="#6E56CF" />
            <stop offset="100%" stopColor="#551BF9" />
          </linearGradient>
        </defs>
        <rect width="512" height="512" rx="112" fill="url(#phantom-bg)" />
        <g transform="translate(256 248)">
          <path
            fill="#FFFFFF"
            d="M-78 -92 C-78 -132 -44 -158 0 -158 C44 -158 78 -132 78 -92 C78 -72 68 -54 52 -42 C68 -28 78 -8 78 14 C78 54 44 80 0 80 C-44 80 -78 54 -78 14 C-78 -8 -68 -28 -52 -42 C-68 -54 -78 -72 -78 -92 Z"
          />
          <circle cx="-28" cy="-78" r="16" fill="#534BB1" />
          <circle cx="28" cy="-78" r="16" fill="#534BB1" />
          <path
            fill="#FFFFFF"
            d="M-52 42 C-36 58 -18 66 0 66 C18 66 36 58 52 42 C44 52 30 58 0 58 C-30 58 -44 52 -52 42 Z"
          />
        </g>
      </svg>
    </div>
  );
}
