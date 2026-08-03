import './ScopeNotice.css';

export default function ScopeNotice() {
  return (
    <details className="scope-notice">
      <summary>Why Snap &amp; Google Maps don&apos;t change</summary>
      <div className="scope-body">
        <p>
          Other apps read your phone&apos;s real GPS. Geoloca is a website — it can only
          change location <strong>inside this app</strong>, not system-wide.
        </p>
        <p className="scope-sub">On Android you can use mock location:</p>
        <ol>
          <li>Settings → About phone → tap Build number 7×</li>
          <li>Developer options → Select mock location app</li>
          <li>Install a mock-location app from Play Store</li>
        </ol>
        <p className="scope-foot">iPhone does not allow this without a computer.</p>
      </div>
    </details>
  );
}
