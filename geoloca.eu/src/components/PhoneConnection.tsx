import { useState } from 'react';
import type { ConnectionStatus, DetectedDevice } from '../data/phones';
import { deviceLabel } from '../data/phones';
import { useLanguage } from '../i18n/LanguageContext';
import { copyGeoLocaLinkCommand, getGeoLocaLinkTerminalCommand } from '../utils/usbBridge';
import './PhoneConnection.css';

type Props = {
  status: ConnectionStatus;
  connectedDevice: DetectedDevice | null;
  linkOnline: boolean;
  needsLink: boolean;
  scanHints: string[];
  onDisconnect: () => void;
  onConnect: () => void;
  onDownloadLink: () => void;
  open?: boolean;
  onClose?: () => void;
};

export default function PhoneConnection({
  status,
  connectedDevice,
  linkOnline,
  needsLink,
  scanHints,
  onDisconnect,
  onConnect,
  onDownloadLink,
  open = true,
  onClose,
}: Props) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const isMac = /mac/i.test(navigator.userAgent);

  if (!open) return null;

  const isWaiting = status === 'waiting' || status === 'detecting_usb' || status === 'connecting';
  const isConnected = status === 'connected' && connectedDevice;

  return (
    <>
      {onClose && (
        <button type="button" className="phone-backdrop" onClick={onClose} aria-label="Close" />
      )}
      <div className={`phone-panel ${status}`}>
        {onClose && (
          <button type="button" className="phone-panel-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        )}

        {isWaiting && (
          <div className="phone-waiting">
            <div className="phone-waiting-rings" aria-hidden>
              <span className="phone-ring phone-ring-1" />
              <span className="phone-ring phone-ring-2" />
              <span className="phone-ring phone-ring-3" />
              <span className="phone-ring-core">📱</span>
            </div>

            <h3 className="phone-waiting-title">{t('usb.waiting_title')}</h3>
            <p className="phone-waiting-sub">{t('usb.waiting_sub')}</p>

            <div className="phone-waiting-status">
              <span className="phone-waiting-dot" />
              {status === 'connecting'
                ? t('usb.establishing')
                : status === 'detecting_usb'
                  ? t('usb.scanning_ports')
                  : linkOnline
                    ? t('usb.listening')
                    : t('usb.link_offline')}
            </div>

            {needsLink && !linkOnline && (
              <div className="phone-link-banner">
                <p>{t('usb.link_needed')}</p>
                {isMac ? (
                  <>
                    <p className="phone-link-mac-tip">{t('usb.mac_gatekeeper')}</p>
                    <code className="phone-link-cmd">{getGeoLocaLinkTerminalCommand()}</code>
                    <button
                      type="button"
                      className="btn btn-secondary phone-link-btn"
                      onClick={() => {
                        void copyGeoLocaLinkCommand().then((ok) => {
                          setCopied(ok);
                          if (ok) window.setTimeout(() => setCopied(false), 2500);
                        });
                      }}
                    >
                      {copied ? t('usb.copied') : t('usb.copy_terminal')}
                    </button>
                    <p className="phone-link-mac-tip">{t('usb.mac_terminal_steps')}</p>
                  </>
                ) : (
                  <button type="button" className="btn btn-secondary phone-link-btn" onClick={onDownloadLink}>
                    {t('usb.download_link')}
                  </button>
                )}
              </div>
            )}

            {linkOnline && !needsLink && scanHints.length > 0 && (
              <div className="phone-link-banner phone-link-banner--warn">
                <p>{t('usb.no_device_title')}</p>
                <ul className="phone-hint-list">
                  {scanHints.map((hint) => (
                    <li key={hint}>{hint}</li>
                  ))}
                </ul>
                {isMac && (
                  <p className="phone-link-mac-tip">{t('usb.restart_link')}</p>
                )}
              </div>
            )}

            <ul className="phone-waiting-tips">
              <li>{t('usb.tip_cable')}</li>
              <li>{t('usb.tip_trust')}</li>
              <li>{t('usb.tip_same_pc')}</li>
            </ul>

            <button type="button" className="btn btn-primary phone-allow-btn" onClick={onConnect}>
              {t('usb.connect_iphone')}
            </button>
          </div>
        )}

        {isConnected && (
          <div className="phone-connected">
            <div className="phone-connected-badge" aria-hidden>
              <span className="phone-connected-check">✓</span>
            </div>

            <h3 className="phone-connected-title">{t('usb.success_title')}</h3>

            <div className="phone-device-card">
              <span className="phone-device-icon">📱</span>
              <div>
                <strong>{connectedDevice.name}</strong>
                <span>{deviceLabel(connectedDevice)}</span>
              </div>
              <span className="phone-usb-badge">USB</span>
            </div>

            <p className="phone-connected-hint">{t('usb.connected_hint')}</p>

            <button type="button" className="btn btn-secondary phone-change-btn" onClick={onDisconnect}>
              {t('usb.disconnect')}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
