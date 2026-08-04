import type { ConnectionStatus, PhoneDevice } from '../data/phones';
import { phoneLabel } from '../data/phones';
import './PhoneConnection.css';

type Props = {
  status: ConnectionStatus;
  phones: PhoneDevice[];
  selectedPhone: PhoneDevice | null;
  connectedPhone: PhoneDevice | null;
  onSelectPhone: (phone: PhoneDevice) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  open?: boolean;
  onClose?: () => void;
};

export default function PhoneConnection({
  status,
  phones,
  selectedPhone,
  connectedPhone,
  onSelectPhone,
  onConnect,
  onDisconnect,
  open = true,
  onClose,
}: Props) {
  const active = selectedPhone || connectedPhone;

  if (!open) return null;

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
          <span className={`phone-status-dot ${status}`} />
          <div>
            <p className="phone-status-title">
              {status === 'connected'
                ? 'Successfully connected'
                : status === 'connecting'
                  ? 'Connecting…'
                  : 'Waiting to be connected'}
            </p>
            {status === 'connected' && connectedPhone && (
              <p className="phone-status-sub">{phoneLabel(connectedPhone)}</p>
            )}
            {status === 'waiting' && (
              <p className="phone-status-sub">Choose your phone below, then connect</p>
            )}
          </div>
        </div>

        {status !== 'connected' && (
          <div className="phone-picker">
            {phones.map((phone) => (
              <button
                key={phone.id}
                type="button"
                className={`phone-option ${active?.id === phone.id ? 'selected' : ''}`}
                disabled={status === 'connecting'}
                onClick={() => onSelectPhone(phone)}
              >
                <span className="phone-option-icon">{phone.type === 'iPhone' ? '📱' : '🤖'}</span>
                <span className="phone-option-text">
                  <strong>{phone.name}</strong>
                  <span>
                    {phone.type} · {phone.link}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}

        {status === 'waiting' && (
          <button
            type="button"
            className="btn btn-primary phone-connect-btn"
            disabled={!selectedPhone}
            onClick={onConnect}
          >
            Connect phone
          </button>
        )}

        {status === 'connecting' && (
          <div className="phone-connecting">
            <span className="phone-connecting-spinner" aria-hidden />
            Pairing {selectedPhone ? phoneLabel(selectedPhone) : 'device'}…
          </div>
        )}

        {status === 'connected' && (
          <div className="phone-connected-actions">
            <p className="phone-connected-hint">Pick a country on the map — your phone follows.</p>
            <button type="button" className="btn btn-secondary phone-change-btn" onClick={onDisconnect}>
              Change phone
            </button>
          </div>
        )}
      </div>
    </>
  );
}
