import './Background.css';

export default function Background() {
  return (
    <div className="page-bg" aria-hidden>
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="grid-overlay" />
      <div className="noise" />
    </div>
  );
}
