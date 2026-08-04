import { useState } from 'react';
import type { ConnectionStatus, DetectedDevice } from '../data/phones';
import { deviceLabel } from '../data/phones';
import { useLanguage } from '../i18n/LanguageContext';
import { copyStartLinkCommand, getStartLinkCommand } from '../utils/usbBridge';
import './PhoneConnection.css';

type Props = {
  status: ConnectionStatus;
  connectedDevice: DetectedDevice | null;
  linkOnline: boolean;
  bridgeStarting: boolean;
  needsStartLink: boolean;
  onDisconnect: () => void;
  onConnect: () => void;
  onStartLink: () => void;
  open?: boolean;
  onClose?: () => void;
};

export default function PhoneConnection({
  status,
  connectedDevice,
  linkOnline,
  bridgeStarting,
  needsStartLink,
  onDisconnect,
  onConnect,
  onStartLink,
  open = true,
  onClose,
}: Props) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const isWaiting = status === 'waiting' || status === 'detecting_usb' || status === 'connecting';
  const isConnected = status === 'connected' && connectedDevice;

  const statusText = bridgeStarting
    ? t('usb.bridge_starting')
    : status === 'connecting'
      ? t('usb.establishing')
      : status === 'detecting_usb'
        ? t('usb.scanning_ports')
        : linkOnline
          ? t('usb.listening')
          : t('usb.plug_scan');

  const handleCopyStart = () => {
    void copyStartLinkCommand().then((ok) => {
      setCopied(ok);
      if (ok) {
        onStartLink();
        window.setTimeout(() => setCopied(false), 3000);
      }
    });
  };

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
              {statusText}
            </div>

            {needsStartLink && (
              <div className="phone-link-banner">
                <p>{t('usb.no_download')}</p>
                <ol className="phone-start-steps">
                  <li>{t('usb.start_step1')}</li>
                  <li>{t('usb.start_step2')}</li>
                  <li>{t('usb.start_step3')}</li>
                </ol>
                <button type="button" className="btn btn-secondary phone-link-btn" onClick={handleCopyStart}>
                  {copied ? t('usb.copied_paste') : t('usb.copy_start')}
                </button>
                <code className="phone-link-cmd">{getStartLinkCommand()}</code>
              </div>
            )}

            {bridgeStarting && (
              <p className="phone-bridge-tip">{t('usb.paste_terminal')}</p>
            )}

            {linkOnline && !bridgeStarting && (
              <p className="phone-bridge-tip">{t('usb.allow_local')}</p>
            )}

            <ul className="phone-waiting-tips">
              <li>{t('usb.tip_cable')}</li>
              <li>{t('usb.tip_trust')}</li>
              <li>{t('usb.tip_unlock')}</li>
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
