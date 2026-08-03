import { useEffect, useState } from 'react';
import './InstallPrompt.css';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    if (isStandalone) return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    const onInstalled = () => {
      setVisible(false);
      setDeferred(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (!visible || !deferred) return null;

  return (
    <div className="install-bar">
      <p>Add to home screen for quick access</p>
      <div className="install-btns">
        <button type="button" onClick={() => setVisible(false)}>
          Not now
        </button>
        <button
          type="button"
          className="go"
          onClick={async () => {
            await deferred.prompt();
            await deferred.userChoice;
            setVisible(false);
            setDeferred(null);
          }}
        >
          Add
        </button>
      </div>
    </div>
  );
}
