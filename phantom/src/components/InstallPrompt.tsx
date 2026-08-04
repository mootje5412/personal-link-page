import { useEffect, useState } from 'react';
import './InstallPrompt.css';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIos, setShowIos] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;

    if (isIos()) {
      setShowIos(true);
      return;
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  if (dismissed || isStandalone()) return null;

  if (showIos) {
    return (
      <div className="install-prompt">
        <ol className="ios-steps">
          <li>
            Tap <strong>Share</strong> <span className="ios-icon">⎋</span> in Safari
          </li>
          <li>
            Scroll and tap <strong>Add to Home Screen</strong>
          </li>
          <li>
            Tap <strong>Add</strong> — the Phantom icon appears on your home screen
          </li>
        </ol>
        <button type="button" className="install-dismiss" onClick={() => setDismissed(true)}>
          Got it
        </button>
      </div>
    );
  }

  if (!deferred) {
    return (
      <div className="install-prompt">
        <p className="install-fallback">
          Open this page in Chrome on your phone, then use the browser menu →{' '}
          <strong>Install app</strong> or <strong>Add to Home screen</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="install-prompt">
      <button
        type="button"
        className="install-btn"
        onClick={async () => {
          await deferred.prompt();
          await deferred.userChoice;
          setDeferred(null);
        }}
      >
        Add Phantom to Home Screen
      </button>
      <button type="button" className="install-dismiss" onClick={() => setDismissed(true)}>
        Not now
      </button>
    </div>
  );
}
