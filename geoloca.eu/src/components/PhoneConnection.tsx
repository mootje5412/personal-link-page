import type { ConnectionStatus, DetectedDevice, SetupStep } from '../data/phones';
import { USB_SETUP_STEPS, deviceLabel } from '../data/phones';
import { useLanguage } from '../i18n/LanguageContext';
import { USB_HELPER_CMD } from '../utils/usbBridge';
import './PhoneConnection.css';

type Props = {
  status: ConnectionStatus;
  setupStep: SetupStep;
  connectedDevice: DetectedDevice | null;
  usbError: string | null;
  bridgeOnline: boolean | null;
  autoScanning: boolean;
  onNextStep: () => void;
  onPrevStep: () => void;
  onDetectUsb: () => void;
  onRetryUsb: () => void;
  onDisconnect: () => void;
  onCheckBridge: () => void;
  open?: boolean;
  onClose?: () => void;
};

export default function PhoneConnection({
  status,
  setupStep,
  connectedDevice,
  usbError,
  bridgeOnline,
  autoScanning,
  onNextStep,
  onPrevStep,
  onDetectUsb,
  onRetryUsb,
  onDisconnect,
  onCheckBridge,
  open = true,
  onClose,
}: Props) {
  const { t } = useLanguage();

  if (!open) return null;

  const current = USB_SETUP_STEPS[setupStep - 1];
  const isScanning = status === 'detecting_usb' || status === 'connecting';

  const statusTitle =
    status === 'connected'
      ? t('usb.panel_title_connected')
      : status === 'detecting_usb'
        ? t('usb.panel_title_scanning')
        : status === 'connecting'
          ? t('usb.panel_title_pairing')
          : status === 'usb_not_found'
            ? t('usb.panel_title_fail')
            : t('usb.panel_title');

  const errorMessage =
    usbError === 'bridge_offline'
      ? t('usb.helper_offline')
      : usbError === 'no_device'
        ? t('usb.no_device')
        : usbError;

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

        <div className="phone-panel-head">
          <span className={`phone-status-dot ${status === 'usb_not_found' ? 'waiting' : status}`} />
          <div>
            <p className="phone-status-title">{statusTitle}</p>
            {status === 'connected' && connectedDevice && (
              <p className="phone-status-sub phone-status-sub--usb">
                <span className="phone-usb-badge">USB</span>
                {deviceLabel(connectedDevice)} · {t('usb.sub_connected')}
              </p>
            )}
            {status === 'waiting' && <p className="phone-status-sub">{t('usb.sub_waiting')}</p>}
          </div>
        </div>

        {bridgeOnline === false && status !== 'connected' && (
          <div className="phone-helper-banner">
            <p>{t('usb.helper_offline')}</p>
            <code>{USB_HELPER_CMD}</code>
            <button type="button" className="phone-helper-refresh" onClick={onCheckBridge}>
              ↻
            </button>
          </div>
        )}

        {status === 'connected' && connectedDevice && (
          <div className="phone-usb-connected-card">
            <div className="phone-usb-visual" aria-hidden>
              <span className="phone-usb-laptop">💻</span>
              <span className="phone-usb-cable">
                <span className="phone-usb-cable-line" />
                <span className="phone-usb-cable-label">USB</span>
              </span>
              <span className="phone-usb-device">📱</span>
            </div>
            <div className="phone-usb-connected-info">
              <strong>{connectedDevice.name}</strong>
              <span>{deviceLabel(connectedDevice)}</span>
            </div>
            <p className="phone-connected-hint">{t('usb.connected_hint')}</p>
            <button type="button" className="btn btn-secondary phone-change-btn" onClick={onDisconnect}>
              {t('usb.disconnect')}
            </button>
          </div>
        )}

        {status === 'waiting' && (
          <>
            <div className="phone-step-progress" aria-hidden>
              {USB_SETUP_STEPS.map((s) => (
                <span
                  key={s.step}
                  className={`phone-step-dot ${s.step === setupStep ? 'active' : ''} ${s.step < setupStep ? 'done' : ''}`}
                />
              ))}
            </div>

            <div className="phone-step-card">
              <span className="phone-step-icon">{current.icon}</span>
              <div>
                <p className="phone-step-label">Step {setupStep} / 3</p>
                <h3 className="phone-step-title">{t(current.titleKey)}</h3>
                <p className="phone-step-text">{t(current.textKey)}</p>
              </div>
            </div>

            {setupStep === 1 && (
              <div className="phone-usb-diagram" aria-hidden>
                <span>💻</span>
                <span className="phone-usb-diagram-cable">━━ USB ━━</span>
                <span>📱</span>
              </div>
            )}

            {setupStep === 2 && (
              <div className="phone-trust-hint">
                <span className="phone-trust-icon">✓</span>
                <p>{t('usb.trust_hint')}</p>
              </div>
            )}

            {setupStep === 3 && (
              <div className="phone-detect-block">
                <div className="phone-detect-visual">
                  <span className="phone-detect-pulse" />
                  <span>🔍</span>
                </div>
                <p className="phone-detect-text">{t('usb.step3.text')}</p>
                {autoScanning && <p className="phone-auto-scan">{t('usb.auto_scan')}</p>}
              </div>
            )}

            <div className="phone-step-actions">
              {setupStep > 1 && (
                <button type="button" className="btn btn-secondary phone-step-back" onClick={onPrevStep}>
                  {t('usb.back')}
                </button>
              )}
              {setupStep < 3 ? (
                <button type="button" className="btn btn-primary phone-step-next" onClick={onNextStep}>
                  {setupStep === 1 ? t('usb.step_next1') : t('usb.step_next2')}
                </button>
              ) : (
                <button type="button" className="btn btn-primary phone-connect-btn" onClick={onDetectUsb}>
                  {t('usb.detect_btn')}
                </button>
              )}
            </div>
          </>
        )}

        {isScanning && (
          <div className="phone-connecting">
            <span className="phone-connecting-spinner" aria-hidden />
            <div>
              <strong>{status === 'detecting_usb' ? t('usb.scanning_ports') : t('usb.establishing')}</strong>
              <span>{connectedDevice ? deviceLabel(connectedDevice) : 'USB scan'}</span>
            </div>
          </div>
        )}

        {status === 'usb_not_found' && (
          <div className="phone-usb-fail">
            {errorMessage && <p className="phone-usb-error">{errorMessage}</p>}
            <ul className="phone-usb-checklist">
              <li>{t('usb.checklist1')}</li>
              <li>{t('usb.checklist2')}</li>
              <li>{t('usb.checklist3')}</li>
            </ul>
            <button type="button" className="btn btn-primary phone-connect-btn" onClick={onRetryUsb}>
              {t('usb.retry_btn')}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
