import { useCallback, useEffect, useRef, useState } from 'react';
import type { ConnectionStatus, DetectedDevice } from '../data/phones';
import { requestUsbAccess, scanUsbDevice, setDeviceLocation } from '../utils/usbBridge';

export type AppliedLocation = {
  country: string;
  lat: number;
  lng: number;
  label: string;
};

const SCAN_INTERVAL_MS = 2500;

export function usePhoneConnection() {
  const [status, setStatus] = useState<ConnectionStatus>('waiting');
  const [connectedDevice, setConnectedDevice] = useState<DetectedDevice | null>(null);
  const [appliedLocation, setAppliedLocation] = useState<AppliedLocation | null>(null);
  const [applyingLocation, setApplyingLocation] = useState(false);
  const [scanning, setScanning] = useState(true);
  const scanRef = useRef<number | null>(null);
  const connectedRef = useRef(false);

  const stopAutoScan = useCallback(() => {
    if (scanRef.current) {
      window.clearInterval(scanRef.current);
      scanRef.current = null;
    }
    setScanning(false);
  }, []);

  const connectDevice = useCallback(
    (device: DetectedDevice) => {
      connectedRef.current = true;
      setConnectedDevice(device);
      setStatus('connected');
      setAppliedLocation(null);
      stopAutoScan();
    },
    [stopAutoScan],
  );

  const runUsbScan = useCallback(async (): Promise<boolean> => {
    if (connectedRef.current) return true;

    setScanning(true);
    setStatus('detecting_usb');

    const scan = await scanUsbDevice();

    if (scan.connected && scan.device) {
      setStatus('connecting');
      await new Promise((r) => window.setTimeout(r, 500));
      connectDevice(scan.device);
      return true;
    }

    setStatus('waiting');
    return false;
  }, [connectDevice]);

  const startAutoScan = useCallback(() => {
    stopAutoScan();
    setScanning(true);
    void runUsbScan();
    scanRef.current = window.setInterval(() => {
      void runUsbScan();
    }, SCAN_INTERVAL_MS);
  }, [runUsbScan, stopAutoScan]);

  useEffect(() => {
    startAutoScan();
    return () => stopAutoScan();
  }, [startAutoScan, stopAutoScan]);

  const requestAccess = useCallback(async () => {
    setStatus('detecting_usb');
    const scan = await requestUsbAccess();
    if (scan.connected && scan.device) {
      connectDevice(scan.device);
      return true;
    }
    setStatus('waiting');
    return false;
  }, [connectDevice]);

  const disconnect = useCallback(() => {
    connectedRef.current = false;
    setConnectedDevice(null);
    setAppliedLocation(null);
    setApplyingLocation(false);
    setStatus('waiting');
    startAutoScan();
  }, [startAutoScan]);

  const applyLocation = useCallback(
    async (country: string, lat: number, lng: number, label: string) => {
      if (!connectedRef.current || !connectedDevice) return false;

      setApplyingLocation(true);
      setAppliedLocation(null);

      const result = await setDeviceLocation(lat, lng);

      if (!result.ok) {
        setApplyingLocation(false);
        if (result.error === 'iphone_not_connected') {
          connectedRef.current = false;
          setConnectedDevice(null);
          setStatus('waiting');
          startAutoScan();
        }
        return false;
      }

      setAppliedLocation({ country, lat, lng, label });
      setApplyingLocation(false);
      return true;
    },
    [connectedDevice, startAutoScan],
  );

  return {
    status,
    connectedDevice,
    appliedLocation,
    applyingLocation,
    scanning,
    connected: status === 'connected',
    disconnect,
    applyLocation,
    requestAccess,
    rescan: runUsbScan,
  };
}
