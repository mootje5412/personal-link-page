import { useCallback, useEffect, useRef, useState } from 'react';
import type { ConnectionStatus, DetectedDevice } from '../data/phones';
import {
  burstScanLocal,
  downloadGeoLocaLink,
  isLinkOnline,
  openGeoLocaLink,
  requestWebUsb,
  scanLocalUsb,
  setDeviceLocation,
} from '../utils/usbBridge';

export type AppliedLocation = {
  country: string;
  lat: number;
  lng: number;
  label: string;
};

const SCAN_MS = 1500;

export function usePhoneConnection() {
  const [status, setStatus] = useState<ConnectionStatus>('waiting');
  const [connectedDevice, setConnectedDevice] = useState<DetectedDevice | null>(null);
  const [appliedLocation, setAppliedLocation] = useState<AppliedLocation | null>(null);
  const [applyingLocation, setApplyingLocation] = useState(false);
  const [linkOnline, setLinkOnline] = useState(false);
  const [needsLink, setNeedsLink] = useState(false);
  const [scanHints, setScanHints] = useState<string[]>([]);
  const scanRef = useRef<number | null>(null);
  const connectedRef = useRef(false);

  const stopScan = useCallback(() => {
    if (scanRef.current) {
      window.clearInterval(scanRef.current);
      scanRef.current = null;
    }
  }, []);

  const connectDevice = useCallback((device: DetectedDevice) => {
    connectedRef.current = true;
    setConnectedDevice(device);
    setStatus('connected');
    setNeedsLink(false);
    setAppliedLocation(null);
    stopScan();
  }, [stopScan]);

  const runScan = useCallback(async (): Promise<boolean> => {
    if (connectedRef.current) return true;

    const online = await isLinkOnline();
    setLinkOnline(online);

    if (!online) {
      setNeedsLink(true);
      setStatus('waiting');
      return false;
    }

    setNeedsLink(false);
    setStatus('detecting_usb');
    const scan = await scanLocalUsb();

    if (scan.connected && scan.device) {
      setStatus('connecting');
      await new Promise((r) => window.setTimeout(r, 400));
      connectDevice(scan.device);
      setScanHints([]);
      return true;
    }

    setScanHints(scan.hints ?? []);
    setStatus('waiting');
    return false;
  }, [connectDevice]);

  const startScan = useCallback(() => {
    stopScan();
    void runScan();
    scanRef.current = window.setInterval(() => void runScan(), SCAN_MS);
  }, [runScan, stopScan]);

  useEffect(() => {
    startScan();
    return () => stopScan();
  }, [startScan, stopScan]);

  const connectIphone = useCallback(async () => {
    setStatus('detecting_usb');

    let scan = await burstScanLocal(8, 350);
    if (scan.connected && scan.device) {
      connectDevice(scan.device);
      return true;
    }

    if (!scan.linkOnline) {
      openGeoLocaLink();
      setNeedsLink(true);
      setStatus('waiting');
      scan = await burstScanLocal(20, 500);
      if (scan.connected && scan.device) {
        connectDevice(scan.device);
        return true;
      }
      return false;
    }

    const web = await requestWebUsb();
    if (web.connected && web.device) {
      connectDevice(web.device);
      return true;
    }

    scan = await burstScanLocal(6, 400);
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
    startScan();
  }, [startScan]);

  const applyLocation = useCallback(
    async (country: string, lat: number, lng: number, label: string) => {
      if (!connectedRef.current) return false;

      setApplyingLocation(true);
      setAppliedLocation(null);

      const result = await setDeviceLocation(lat, lng);

      if (!result.ok) {
        setApplyingLocation(false);
        if (result.error === 'iphone_not_connected') {
          connectedRef.current = false;
          setConnectedDevice(null);
          setStatus('waiting');
          startScan();
        }
        return false;
      }

      setAppliedLocation({ country, lat, lng, label });
      setApplyingLocation(false);
      return true;
    },
    [startScan],
  );

  return {
    status,
    connectedDevice,
    appliedLocation,
    applyingLocation,
    linkOnline,
    needsLink,
    scanHints,
    connected: status === 'connected',
    disconnect,
    applyLocation,
    connectIphone,
    downloadLink: downloadGeoLocaLink,
  };
}
