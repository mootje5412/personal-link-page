import { useEffect, useState } from 'react';
import './InstallPrompt.css';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallPromptProps {
  onDismiss?: () => void;
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export default function InstallPrompt({ onDismiss }: InstallPromptProps) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isIos()) return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  if (isIos()) {
    return (
      <div className="install-banner">
        <p>
          <strong>Add to Home Screen</strong> — Share → Add to Home Screen
        </p>
        <button type="button" onClick={onDismiss}>
          ✕
        </button>
      </div>
    );
  }

  if (!deferred) {
    return (
      <div className="install-banner">
        <p>
          <strong>Add to Home Screen</strong> for the full app experience
        </p>
        <button type="button" onClick={onDismiss}>
          ✕
        </button>
      </div>
    );
  }

  return (
    <div className="install-banner">
      <p>Add Phantom to your home screen</p>
      <div className="install-actions">
        <button
          type="button"
          className="install-go"
          onClick={async () => {
            await deferred.prompt();
            await deferred.userChoice;
            onDismiss?.();
          }}
        >
          Add
        </button>
        <button type="button" className="install-close" onClick={onDismiss}>
          ✕
        </button>
      </div>
    </div>
  );
}
