import { useCallback, useEffect, useRef, useState } from 'react';
import type { ConnectionStatus, DetectedDevice } from '../data/phones';
import {
  burstScanLocal,
  isLinkOnline,
  isMacDesktop,
  launchGeoLocaLink,
  prepareLocationTools,
  requestWebUsb,
  scanLocalUsb,
  setDeviceLocation,
  tryExistingWebUsb,
  waitForLink,
} from '../utils/usbBridge';

export type AppliedLocation = {
  country: string;
  lat: number;
  lng: number;
  label: string;
};

const SCAN_MS = 600;

export function usePhoneConnection() {
  const [status, setStatus] = useState<ConnectionStatus>('waiting');
  const [connectedDevice, setConnectedDevice] = useState<DetectedDevice | null>(null);
  const [appliedLocation, setAppliedLocation] = useState<AppliedLocation | null>(null);
  const [applyingLocation, setApplyingLocation] = useState(false);
  const [linkOnline, setLinkOnline] = useState(false);
  const [bridgeStarting, setBridgeStarting] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const scanRef = useRef<number | null>(null);
  const connectedRef = useRef(false);
  const launchedRef = useRef(false);

  const stopScan = useCallback(() => {
    if (scanRef.current) {
      window.clearInterval(scanRef.current);
      scanRef.current = null;
    }
  }, []);

  const connectDevice = useCallback(
    (device: DetectedDevice) => {
      connectedRef.current = true;
      setConnectedDevice(device);
      setStatus('connected');
      setBridgeStarting(false);
      setAppliedLocation(null);
      setLocationError(null);
      stopScan();
      void prepareLocationTools();
    },
    [stopScan],
  );

  const ensureBridge = useCallback(async () => {
    if (await isLinkOnline()) return true;

    if (isMacDesktop() && !launchedRef.current) {
      launchedRef.current = true;
      setBridgeStarting(true);
      launchGeoLocaLink();
      const ready = await waitForLink(30);
      setBridgeStarting(false);
      return ready;
    }

    return false;
  }, []);

  const runScan = useCallback(async (): Promise<boolean> => {
    if (connectedRef.current) return true;

    let online = await isLinkOnline();
    if (!online && isMacDesktop()) {
      online = await ensureBridge();
    }
    setLinkOnline(online);

    setStatus('detecting_usb');

    const web = await tryExistingWebUsb();
    if (web.connected && web.device) {
      connectDevice(web.device);
      return true;
    }

    if (online) {
      const scan = await scanLocalUsb();
      if (scan.connected && scan.device) {
        setStatus('connecting');
        await new Promise((r) => window.setTimeout(r, 250));
        connectDevice(scan.device);
        return true;
      }
    }

    setStatus('waiting');
    return false;
  }, [connectDevice, ensureBridge]);

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

    await ensureBridge();
    setLinkOnline(await isLinkOnline());

    const web = await requestWebUsb();
    if (web.connected && web.device) {
      connectDevice(web.device);
      return true;
    }

    const scan = await burstScanLocal(25, 300);
    if (scan.connected && scan.device) {
      connectDevice(scan.device);
      return true;
    }

    setStatus('waiting');
    return false;
  }, [connectDevice, ensureBridge]);

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
      setLocationError(null);

      const result = await setDeviceLocation(lat, lng);

      if (!result.ok) {
        setApplyingLocation(false);
        setLocationError(result.message || result.error || 'Location failed');
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
    bridgeStarting,
    locationError,
    connected: status === 'connected',
    disconnect,
    applyLocation,
    connectIphone,
  };
}
