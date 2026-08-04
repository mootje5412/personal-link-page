import type { ConnectionStatus, IPhoneModel, SetupStep } from '../data/phones';
import { USB_SETUP_STEPS, iphoneLabel } from '../data/phones';
import './PhoneConnection.css';

type Props = {
  status: ConnectionStatus;
  setupStep: SetupStep;
  phones: IPhoneModel[];
  selectedPhone: IPhoneModel | null;
  connectedPhone: IPhoneModel | null;
  usbError: string | null;
  onSelectPhone: (phone: IPhoneModel) => void;
  onNextStep: () => void;
  onPrevStep: () => void;
  onDetectUsb: () => void;
  onRetryUsb: () => void;
  onDisconnect: () => void;
  open?: boolean;
  onClose?: () => void;
};

export default function PhoneConnection({
  status,
  setupStep,
  phones,
  selectedPhone,
  connectedPhone,
  usbError,
  onSelectPhone,
  onNextStep,
  onPrevStep,
  onDetectUsb,
  onRetryUsb,
  onDisconnect,
  open = true,
  onClose,
}: Props) {
  if (!open) return null;

  const current = USB_SETUP_STEPS[setupStep - 1];
  const isScanning = status === 'detecting_usb' || status === 'connecting';

  const statusTitle =
    status === 'connected'
      ? 'iPhone connected via USB'
      : status === 'detecting_usb'
        ? 'Scanning USB port…'
        : status === 'connecting'
          ? 'Pairing iPhone…'
          : status === 'usb_not_found'
            ? 'USB connection not found'
            : 'Connect your iPhone with USB';

  return (
    <>
      {onClose && (
        <button type="button" className="phone-backdrop" onClick={onClose} aria-label="Close phone panel" />
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
            {status === 'connected' && connectedPhone && (
              <p className="phone-status-sub phone-status-sub--usb">
                <span className="phone-usb-badge">USB</span>
                {iphoneLabel(connectedPhone)} · location ready
              </p>
            )}
            {status === 'waiting' && (
              <p className="phone-status-sub">iPhone only · USB cable required · Wi‑Fi won&apos;t work</p>
            )}
          </div>
        </div>

        {status === 'connected' && connectedPhone && (
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
              <strong>{connectedPhone.name}</strong>
              <span>Connected with USB cable</span>
            </div>
            <p className="phone-connected-hint">
              Pick a country on the map and tap <strong>Use this location</strong> — your iPhone GPS updates
              instantly.
            </p>
            <button type="button" className="btn btn-secondary phone-change-btn" onClick={onDisconnect}>
              Disconnect iPhone
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
                <p className="phone-step-label">Step {setupStep} of 4</p>
                <h3 className="phone-step-title">{current.title}</h3>
                <p className="phone-step-text">{current.text}</p>
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
                <p>If you don&apos;t see Trust, unplug and plug the cable back in.</p>
              </div>
            )}

            {setupStep === 3 && (
              <div className="phone-picker">
                {phones.map((phone) => (
                  <button
                    key={phone.id}
                    type="button"
                    className={`phone-option ${selectedPhone?.id === phone.id ? 'selected' : ''}`}
                    onClick={() => onSelectPhone(phone)}
                  >
                    <span className="phone-option-icon">📱</span>
                    <span className="phone-option-text">
                      <strong>{phone.name}</strong>
                      <span>iPhone · USB only</span>
                    </span>
                    <span className="phone-option-usb">USB</span>
                  </button>
                ))}
              </div>
            )}

            {setupStep === 4 && (
              <div className="phone-detect-block">
                <div className="phone-detect-visual">
                  <span className="phone-detect-pulse" />
                  <span>🔍</span>
                </div>
                <p className="phone-detect-text">
                  Make sure <strong>{selectedPhone?.name ?? 'your iPhone'}</strong> is plugged in via USB, then
                  scan for the device.
                </p>
                {usbError && <p className="phone-usb-error">{usbError}</p>}
              </div>
            )}

            <div className="phone-step-actions">
              {setupStep > 1 && (
                <button type="button" className="btn btn-secondary phone-step-back" onClick={onPrevStep}>
                  Back
                </button>
              )}
              {setupStep < 4 ? (
                <button
                  type="button"
                  className="btn btn-primary phone-step-next"
                  disabled={setupStep === 3 && !selectedPhone}
                  onClick={onNextStep}
                >
                  {setupStep === 1 ? 'Cable connected' : setupStep === 2 ? 'I tapped Trust' : 'Continue'}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary phone-connect-btn"
                  disabled={!selectedPhone}
                  onClick={onDetectUsb}
                >
                  Detect iPhone on USB
                </button>
              )}
            </div>
          </>
        )}

        {isScanning && (
          <div className="phone-connecting">
            <span className="phone-connecting-spinner" aria-hidden />
            <div>
              <strong>{status === 'detecting_usb' ? 'Looking for iPhone on USB…' : 'Establishing USB link…'}</strong>
              <span>{selectedPhone ? iphoneLabel(selectedPhone) : 'Scanning ports'}</span>
            </div>
          </div>
        )}

        {status === 'usb_not_found' && (
          <div className="phone-usb-fail">
            <p className="phone-usb-error">
              {usbError ?? 'No iPhone detected on USB. Plug in your cable and tap Trust on your iPhone.'}
            </p>
            <ul className="phone-usb-checklist">
              <li>Use a data-capable USB cable (not charge-only)</li>
              <li>Unlock iPhone and tap Trust This Computer</li>
              <li>Try a different USB port on your computer</li>
            </ul>
            <button type="button" className="btn btn-primary phone-connect-btn" onClick={onRetryUsb}>
              Try USB detection again
            </button>
          </div>
        )}
      </div>
    </>
  );
}
