import { useCallback, useEffect, useRef, useState } from 'react';
import type { ConnectionStatus, DetectedDevice } from '../data/phones';
import {
  burstScanLocal,
  isLinkOnline,
  isMacDesktop,
  enableDeveloperMode,
  fetchDeveloperStatus,
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
  const [developerStatus, setDeveloperStatus] = useState<{
    required: boolean;
    enabled: boolean | null;
    message: string;
    ios?: string;
    canUsbEnable?: boolean;
  } | null>(null);
  const scanRef = useRef<number | null>(null);
  const connectedRef = useRef(false);

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
      void prepareLocationTools().then(() =>
        fetchDeveloperStatus().then((s) => {
          if (s) setDeveloperStatus({
            required: Boolean(s.required),
            enabled: s.enabled ?? null,
            message: s.message || '',
            ios: s.ios,
            canUsbEnable: s.can_usb_enable,
          });
        }),
      );
    },
    [stopScan],
  );

  const runScan = useCallback(async (): Promise<boolean> => {
    if (connectedRef.current) return true;

    const online = await isLinkOnline();
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

  const waitForBridge = useCallback(async () => {
    setBridgeStarting(true);
    const ready = await waitForLink(45);
    setBridgeStarting(false);
    setLinkOnline(ready);
    return ready;
  }, []);

  const connectIphone = useCallback(async () => {
    setStatus('detecting_usb');
    setLinkOnline(await isLinkOnline());

    const web = await requestWebUsb();
    if (web.connected && web.device) {
      connectDevice(web.device);
      return true;
    }

    if (await isLinkOnline()) {
      const scan = await burstScanLocal(25, 300);
      if (scan.connected && scan.device) {
        connectDevice(scan.device);
        return true;
      }
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

  const enableDevMode = useCallback(async () => {
    const result = await enableDeveloperMode();
    if (result?.message) setLocationError(result.ok ? null : result.message);
    const status = await fetchDeveloperStatus();
    if (status) setDeveloperStatus({
      required: Boolean(status.required),
      enabled: status.enabled ?? null,
      message: status.message || '',
      ios: status.ios,
      canUsbEnable: status.can_usb_enable,
    });
    return Boolean(result?.ok);
  }, []);

  return {
    status,
    connectedDevice,
    appliedLocation,
    applyingLocation,
    linkOnline,
    bridgeStarting,
    locationError,
    developerStatus,
    needsStartLink: !linkOnline && isMacDesktop(),
    connected: status === 'connected',
    disconnect,
    applyLocation,
    connectIphone,
    waitForBridge,
    enableDevMode,
  };
}
