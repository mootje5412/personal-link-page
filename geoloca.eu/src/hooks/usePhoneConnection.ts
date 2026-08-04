import { useCallback, useState } from 'react';
import {
  IPHONE_MODELS,
  type ConnectionStatus,
  type IPhoneModel,
  type SetupStep,
} from '../data/phones';

export type AppliedLocation = {
  country: string;
  lat: number;
  lng: number;
  label: string;
};

export function usePhoneConnection() {
  const [status, setStatus] = useState<ConnectionStatus>('waiting');
  const [setupStep, setSetupStep] = useState<SetupStep>(1);
  const [selectedPhone, setSelectedPhone] = useState<IPhoneModel | null>(null);
  const [connectedPhone, setConnectedPhone] = useState<IPhoneModel | null>(null);
  const [appliedLocation, setAppliedLocation] = useState<AppliedLocation | null>(null);
  const [applyingLocation, setApplyingLocation] = useState(false);
  const [usbError, setUsbError] = useState<string | null>(null);

  const selectPhone = useCallback((phone: IPhoneModel) => {
    setSelectedPhone(phone);
    setUsbError(null);
  }, []);

  const nextStep = useCallback(() => {
    setSetupStep((s) => (s < 4 ? ((s + 1) as SetupStep) : s));
  }, []);

  const prevStep = useCallback(() => {
    setSetupStep((s) => (s > 1 ? ((s - 1) as SetupStep) : s));
  }, []);

  const detectUsb = useCallback(async () => {
    if (!selectedPhone) {
      setUsbError('Choose your iPhone model first.');
      return;
    }

    setUsbError(null);
    setStatus('detecting_usb');
    await new Promise((r) => window.setTimeout(r, 1800));

    setStatus('connecting');
    await new Promise((r) => window.setTimeout(r, 1200));

    setConnectedPhone(selectedPhone);
    setStatus('connected');
    setAppliedLocation(null);
  }, [selectedPhone]);

  const retryUsb = useCallback(() => {
    setStatus('waiting');
    setSetupStep(4);
    setUsbError('No iPhone found on USB. Check the cable and tap Trust on your iPhone, then try again.');
  }, []);

  const disconnect = useCallback(() => {
    setStatus('waiting');
    setSetupStep(1);
    setConnectedPhone(null);
    setSelectedPhone(null);
    setAppliedLocation(null);
    setApplyingLocation(false);
    setUsbError(null);
  }, []);

  const applyLocation = useCallback(
    async (country: string, lat: number, lng: number, label: string) => {
      if (status !== 'connected' || !connectedPhone) return false;

      setApplyingLocation(true);
      setAppliedLocation(null);
      await new Promise((r) => window.setTimeout(r, 1500));
      setAppliedLocation({ country, lat, lng, label });
      setApplyingLocation(false);
      return true;
    },
    [status, connectedPhone],
  );

  return {
    status,
    setupStep,
    selectedPhone,
    connectedPhone,
    appliedLocation,
    applyingLocation,
    usbError,
    phones: IPHONE_MODELS,
    connected: status === 'connected',
    isUsbConnected: status === 'connected',
    selectPhone,
    nextStep,
    prevStep,
    detectUsb,
    retryUsb,
    disconnect,
    applyLocation,
  };
}
