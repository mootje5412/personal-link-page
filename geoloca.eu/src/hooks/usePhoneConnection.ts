import { useCallback, useEffect, useRef, useState } from 'react';
import type { ConnectionStatus, DetectedDevice } from '../data/phones';
import { isBridgeOnline, scanUsbDevice, setDeviceLocation } from '../utils/usbBridge';

export type AppliedLocation = {
  country: string;
  lat: number;
  lng: number;
  label: string;
};

const SCAN_INTERVAL_MS = 2000;

export function usePhoneConnection() {
  const [status, setStatus] = useState<ConnectionStatus>('waiting');
  const [connectedDevice, setConnectedDevice] = useState<DetectedDevice | null>(null);
  const [appliedLocation, setAppliedLocation] = useState<AppliedLocation | null>(null);
  const [applyingLocation, setApplyingLocation] = useState(false);
  const [bridgeOnline, setBridgeOnline] = useState<boolean | null>(null);
  const [scanning, setScanning] = useState(true);
  const scanRef = useRef<number | null>(null);
  const busyRef = useRef(false);

  const stopAutoScan = useCallback(() => {
    if (scanRef.current) {
      window.clearInterval(scanRef.current);
      scanRef.current = null;
    }
    setScanning(false);
  }, []);

  const runUsbScan = useCallback(async (): Promise<boolean> => {
    if (busyRef.current) return false;
    busyRef.current = true;
    setScanning(true);

    try {
      const online = await isBridgeOnline();
      setBridgeOnline(online);

      if (!online) {
        setStatus('waiting');
        return false;
      }

      setStatus('detecting_usb');
      const scan = await scanUsbDevice();

      if (scan.connected && scan.device) {
        setStatus('connecting');
        await new Promise((r) => window.setTimeout(r, 700));
        setConnectedDevice(scan.device);
        setStatus('connected');
        setAppliedLocation(null);
        stopAutoScan();
        return true;
      }

      setStatus('waiting');
      return false;
    } finally {
      busyRef.current = false;
      setScanning(true);
    }
  }, [stopAutoScan]);

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

  const disconnect = useCallback(() => {
    setConnectedDevice(null);
    setAppliedLocation(null);
    setApplyingLocation(false);
    setStatus('waiting');
    startAutoScan();
  }, [startAutoScan]);

  const applyLocation = useCallback(
    async (country: string, lat: number, lng: number, label: string) => {
      if (status !== 'connected' || !connectedDevice) return false;

      setApplyingLocation(true);
      setAppliedLocation(null);

      const result = await setDeviceLocation(lat, lng);

      if (!result.ok) {
        setApplyingLocation(false);
        if (result.error === 'iphone_not_connected') {
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
    [status, connectedDevice, startAutoScan],
  );

  return {
    status,
    connectedDevice,
    appliedLocation,
    applyingLocation,
    bridgeOnline,
    scanning,
    connected: status === 'connected',
    disconnect,
    applyLocation,
    rescan: runUsbScan,
  };
}
