export type DetectedDevice = {
  name: string;
  model?: string;
  connection: 'usb';
};

export type UsbScanResult = {
  connected: boolean;
  device?: DetectedDevice;
  linkOnline?: boolean;
  error?: 'link_offline' | 'no_device';
};

export type LocationResult = {
  ok: boolean;
  method?: string;
  message?: string;
  error?: string;
};

const LOCAL = 'http://127.0.0.1:7429';
const APPLE_VENDOR = 0x05ac;

async function localFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
  const isScan = path.includes('/usb/scan');
  const timeoutMs = init?.method === 'POST' ? 20000 : isScan ? 30000 : 5000;
  try {
    const res = await fetch(`${LOCAL}${path}`, {
      ...init,
      mode: 'cors',
      headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function isLinkOnline(): Promise<boolean> {
  const health = await localFetch<{ ok?: boolean }>('/health');
  return Boolean(health?.ok);
}

export async function scanLocalUsb(): Promise<UsbScanResult> {
  const online = await isLinkOnline();
  if (!online) {
    return { connected: false, linkOnline: false, error: 'link_offline' };
  }

  const result = await localFetch<{ connected?: boolean; device?: DetectedDevice }>('/usb/scan');
  if (result?.connected && result.device) {
    return { connected: true, device: result.device, linkOnline: true };
  }

  return { connected: false, linkOnline: true, error: 'no_device' };
}

export async function burstScanLocal(tries = 12, gapMs = 400): Promise<UsbScanResult> {
  for (let i = 0; i < tries; i += 1) {
    const scan = await scanLocalUsb();
    if (scan.connected) return scan;
    if (scan.linkOnline && scan.error === 'no_device') {
      await new Promise((r) => window.setTimeout(r, gapMs));
      continue;
    }
    if (!scan.linkOnline) return scan;
    await new Promise((r) => window.setTimeout(r, gapMs));
  }
  return scanLocalUsb();
}

export async function setDeviceLocation(lat: number, lng: number): Promise<LocationResult> {
  const body = JSON.stringify({ lat, lng });
  const local = await localFetch<LocationResult>('/location', { method: 'POST', body });
  return local ?? { ok: false, error: 'link_offline' };
}

function deviceFromUsb(usbDevice: USBDevice): DetectedDevice {
  const name = usbDevice.productName || 'iPhone';
  return { name, model: name, connection: 'usb' };
}

export async function tryExistingWebUsb(): Promise<UsbScanResult> {
  if (!('usb' in navigator)) return { connected: false, error: 'no_device' };
  try {
    const devices = await navigator.usb!.getDevices();
    const iphone = devices.find((d) => d.vendorId === APPLE_VENDOR);
    if (iphone) {
      return { connected: true, device: deviceFromUsb(iphone), linkOnline: await isLinkOnline() };
    }
  } catch {
    /* ignore */
  }
  return { connected: false, error: 'no_device' };
}

export async function requestWebUsb(): Promise<UsbScanResult> {
  if (!('usb' in navigator)) return { connected: false, error: 'no_device' };

  const existing = await tryExistingWebUsb();
  if (existing.connected) return existing;

  try {
    const device = await navigator.usb!.requestDevice({
      filters: [{ vendorId: APPLE_VENDOR }],
    });
    return { connected: true, device: deviceFromUsb(device), linkOnline: await isLinkOnline() };
  } catch {
    /* try showing all USB devices so user can pick iPhone */
  }

  try {
    const device = await navigator.usb!.requestDevice({ filters: [] });
    if (device.vendorId === APPLE_VENDOR) {
      return { connected: true, device: deviceFromUsb(device), linkOnline: await isLinkOnline() };
    }
  } catch {
    /* user cancelled or no device */
  }

  return { connected: false, error: 'no_device' };
}
