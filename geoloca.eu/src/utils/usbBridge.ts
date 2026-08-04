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

const APPLE_VENDOR = 0x05ac;

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`/api/usb${path}`, {
      ...init,
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
      signal: AbortSignal.timeout(init?.method === 'POST' ? 15000 : 6000),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function localBridgeFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`http://127.0.0.1:7429${path}`, {
      ...init,
      mode: 'cors',
      headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
      signal: AbortSignal.timeout(init?.method === 'POST' ? 15000 : 6000),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function scanWebUsb(): Promise<UsbScanResult> {
  if (!('usb' in navigator)) return { connected: false, error: 'no_device' };

  try {
    const devices = await navigator.usb!.getDevices();
    const apple = devices.find((d: USBDevice) => d.vendorId === APPLE_VENDOR);

    if (apple) {
      const name = apple.productName || 'iPhone';
      return { connected: true, device: { name, model: name, connection: 'usb' } };
    }
  } catch {
    /* ignore */
  }

  return { connected: false, error: 'no_device' };
}

export async function scanUsbDevice(): Promise<UsbScanResult> {
  const local = await localBridgeFetch<{ connected?: boolean; device?: DetectedDevice }>('/usb/scan');
  if (local?.connected && local.device) {
    return { connected: true, device: local.device };
  }

  const api = await apiFetch<{ connected?: boolean; device?: DetectedDevice }>('/scan');
  if (api?.connected && api.device) {
    return { connected: true, device: api.device };
  }

  const web = await scanWebUsb();
  if (web.connected) return web;

  return { connected: false, error: 'no_device' };
}

export async function setDeviceLocation(lat: number, lng: number): Promise<LocationResult> {
  const body = JSON.stringify({ lat, lng });

  const local = await localBridgeFetch<LocationResult>('/location', { method: 'POST', body });
  if (local?.ok) return local;

  const api = await apiFetch<LocationResult>('/location', { method: 'POST', body });
  if (api?.ok) return api;

  return api ?? local ?? { ok: false, error: 'bridge_offline' };
}

export async function requestUsbAccess(): Promise<UsbScanResult> {
  if (!('usb' in navigator)) return { connected: false, error: 'no_device' };
  try {
    const device = await navigator.usb!.requestDevice({ filters: [{ vendorId: APPLE_VENDOR }] });
    const name = device.productName || 'iPhone';
    return { connected: true, device: { name, model: name, connection: 'usb' } };
  } catch {
    return { connected: false, error: 'no_device' };
  }
}

export async function isBridgeOnline(): Promise<boolean> {
  const health = await apiFetch<{ ok?: boolean }>('/health');
  if (health?.ok) return true;
  const local = await localBridgeFetch<{ ok?: boolean }>('/health');
  return Boolean(local?.ok);
}
