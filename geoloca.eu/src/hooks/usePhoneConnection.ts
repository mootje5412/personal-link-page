import { useCallback, useState } from 'react';
import { PHONE_DEVICES, type ConnectionStatus, type PhoneDevice } from '../data/phones';

export function usePhoneConnection() {
  const [status, setStatus] = useState<ConnectionStatus>('waiting');
  const [selectedPhone, setSelectedPhone] = useState<PhoneDevice | null>(null);
  const [connectedPhone, setConnectedPhone] = useState<PhoneDevice | null>(null);
  const [appliedCountry, setAppliedCountry] = useState<string | null>(null);

  const selectPhone = useCallback((phone: PhoneDevice) => {
    setSelectedPhone(phone);
  }, []);

  const connect = useCallback(async () => {
    if (!selectedPhone) return;
    setStatus('connecting');
    setAppliedCountry(null);
    await new Promise((r) => window.setTimeout(r, 1400));
    setConnectedPhone(selectedPhone);
    setStatus('connected');
  }, [selectedPhone]);

  const disconnect = useCallback(() => {
    setStatus('waiting');
    setConnectedPhone(null);
    setSelectedPhone(null);
    setAppliedCountry(null);
  }, []);

  const applyLocation = useCallback(
    (country: string) => {
      if (status !== 'connected' || !connectedPhone) return;
      setAppliedCountry(country);
    },
    [status, connectedPhone],
  );

  return {
    status,
    selectedPhone,
    connectedPhone,
    appliedCountry,
    phones: PHONE_DEVICES,
    connected: status === 'connected',
    selectPhone,
    connect,
    disconnect,
    applyLocation,
  };
}
