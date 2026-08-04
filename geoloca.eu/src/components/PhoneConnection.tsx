import type { ConnectionStatus, DetectedDevice } from '../data/phones';
import { deviceLabel } from '../data/phones';
import { useLanguage } from '../i18n/LanguageContext';
import './PhoneConnection.css';

type Props = {
  status: ConnectionStatus;
  connectedDevice: DetectedDevice | null;
  linkOnline: boolean;
  needsLink: boolean;
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
  onDisconnect,
  onConnect,
  onDownloadLink,
  open = true,
  onClose,
}: Props) {
  const { t } = useLanguage();

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
                <button type="button" className="btn btn-secondary phone-link-btn" onClick={onDownloadLink}>
                  {t('usb.download_link')}
                </button>
                {/mac|iphone|ipad/i.test(navigator.userAgent) && (
                  <p className="phone-link-mac-tip">{t('usb.mac_steps')}</p>
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
