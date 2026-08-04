export type DetectedDevice = {
  name: string;
  model?: string;
  connection: 'usb';
};

export type UsbScanResult = {
  connected: boolean;
  device?: DetectedDevice;
  error?: 'bridge_offline' | 'no_device';
};

export type LocationResult = {
  ok: boolean;
  method?: string;
  message?: string;
  error?: string;
};

const BRIDGE_BASE = 'http://127.0.0.1:7429';

async function bridgeFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${BRIDGE_BASE}${path}`, {
      ...init,
      signal: AbortSignal.timeout(init?.method === 'POST' ? 12000 : 4000),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function isBridgeOnline(): Promise<boolean> {
  const health = await bridgeFetch<{ ok?: boolean }>('/health');
  return Boolean(health?.ok);
}

export async function scanUsbDevice(): Promise<UsbScanResult> {
  const online = await isBridgeOnline();
  if (!online) {
    return { connected: false, error: 'bridge_offline' };
  }

  const result = await bridgeFetch<{ connected?: boolean; device?: DetectedDevice }>('/usb/scan');
  if (!result) {
    return { connected: false, error: 'bridge_offline' };
  }

  if (result.connected && result.device) {
    return { connected: true, device: result.device };
  }

  return { connected: false, error: 'no_device' };
}

export async function setDeviceLocation(lat: number, lng: number): Promise<LocationResult> {
  const online = await isBridgeOnline();
  if (!online) {
    return { ok: false, error: 'bridge_offline' };
  }

  const result = await bridgeFetch<LocationResult>('/location', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat, lng }),
  });

  return result ?? { ok: false, error: 'bridge_offline' };
}

export const USB_HELPER_CMD = 'python3 bridge/usb_helper.py';
