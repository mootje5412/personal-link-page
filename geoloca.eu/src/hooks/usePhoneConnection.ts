import { useCallback, useEffect, useRef, useState } from 'react';
import type { ConnectionStatus, DetectedDevice, SetupStep } from '../data/phones';
import { isBridgeOnline, scanUsbDevice, setDeviceLocation } from '../utils/usbBridge';

export type AppliedLocation = {
  country: string;
  lat: number;
  lng: number;
  label: string;
};

export function usePhoneConnection() {
  const [status, setStatus] = useState<ConnectionStatus>('waiting');
  const [setupStep, setSetupStep] = useState<SetupStep>(1);
  const [connectedDevice, setConnectedDevice] = useState<DetectedDevice | null>(null);
  const [appliedLocation, setAppliedLocation] = useState<AppliedLocation | null>(null);
  const [applyingLocation, setApplyingLocation] = useState(false);
  const [usbError, setUsbError] = useState<string | null>(null);
  const [bridgeOnline, setBridgeOnline] = useState<boolean | null>(null);
  const [autoScanning, setAutoScanning] = useState(false);
  const scanRef = useRef<number | null>(null);

  const checkBridge = useCallback(async () => {
    const online = await isBridgeOnline();
    setBridgeOnline(online);
    return online;
  }, []);

  useEffect(() => {
    void checkBridge();
  }, [checkBridge]);

  const stopAutoScan = useCallback(() => {
    if (scanRef.current) {
      window.clearInterval(scanRef.current);
      scanRef.current = null;
    }
    setAutoScanning(false);
  }, []);

  const runUsbScan = useCallback(async (): Promise<boolean> => {
    setUsbError(null);
    setStatus('detecting_usb');

    const online = await checkBridge();
    if (!online) {
      setStatus('usb_not_found');
      setUsbError('bridge_offline');
      return false;
    }

    const scan = await scanUsbDevice();

    if (!scan.connected || !scan.device) {
      setStatus('usb_not_found');
      setUsbError(scan.error === 'bridge_offline' ? 'bridge_offline' : 'no_device');
      return false;
    }

    setStatus('connecting');
    await new Promise((r) => window.setTimeout(r, 800));
    setConnectedDevice(scan.device);
    setStatus('connected');
    setAppliedLocation(null);
    stopAutoScan();
    return true;
  }, [checkBridge, stopAutoScan]);

  const detectUsb = useCallback(async () => {
    await runUsbScan();
  }, [runUsbScan]);

  const startAutoScan = useCallback(() => {
    stopAutoScan();
    setAutoScanning(true);
    void runUsbScan();
    scanRef.current = window.setInterval(() => {
      void runUsbScan();
    }, 2500);
  }, [runUsbScan, stopAutoScan]);

  useEffect(() => () => stopAutoScan(), [stopAutoScan]);

  const nextStep = useCallback(() => {
    setSetupStep((s) => {
      const next = s < 3 ? ((s + 1) as SetupStep) : s;
      if (next === 3) {
        window.setTimeout(() => startAutoScan(), 300);
      }
      return next;
    });
  }, [startAutoScan]);

  const prevStep = useCallback(() => {
    stopAutoScan();
    setSetupStep((s) => (s > 1 ? ((s - 1) as SetupStep) : s));
  }, [stopAutoScan]);

  const retryUsb = useCallback(() => {
    setStatus('waiting');
    setSetupStep(3);
    setUsbError(null);
    startAutoScan();
  }, [startAutoScan]);

  const disconnect = useCallback(() => {
    stopAutoScan();
    setStatus('waiting');
    setSetupStep(1);
    setConnectedDevice(null);
    setAppliedLocation(null);
    setApplyingLocation(false);
    setUsbError(null);
  }, [stopAutoScan]);

  const applyLocation = useCallback(
    async (country: string, lat: number, lng: number, label: string) => {
      if (status !== 'connected' || !connectedDevice) return false;

      setApplyingLocation(true);
      setAppliedLocation(null);

      const result = await setDeviceLocation(lat, lng);

      if (!result.ok && result.error === 'bridge_offline') {
        setApplyingLocation(false);
        setUsbError('bridge_offline');
        return false;
      }

      if (!result.ok && result.error === 'iphone_not_connected') {
        setApplyingLocation(false);
        setStatus('usb_not_found');
        setConnectedDevice(null);
        setUsbError('no_device');
        return false;
      }

      setAppliedLocation({ country, lat, lng, label });
      setApplyingLocation(false);
      return true;
    },
    [status, connectedDevice],
  );

  return {
    status,
    setupStep,
    connectedDevice,
    appliedLocation,
    applyingLocation,
    usbError,
    bridgeOnline,
    autoScanning,
    connected: status === 'connected',
    nextStep,
    prevStep,
    detectUsb,
    retryUsb,
    disconnect,
    applyLocation,
    checkBridge,
  };
}
