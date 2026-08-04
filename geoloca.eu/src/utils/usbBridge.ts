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
  const timeoutMs = init?.method === 'POST' ? 20000 : isScan ? 35000 : 6000;
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

export async function burstScanLocal(tries = 20, gapMs = 350): Promise<UsbScanResult> {
  for (let i = 0; i < tries; i += 1) {
    const scan = await scanLocalUsb();
    if (scan.connected) return scan;
    if (scan.linkOnline) {
      await new Promise((r) => window.setTimeout(r, gapMs));
      continue;
    }
    return scan;
  }
  return scanLocalUsb();
}

export async function waitForLink(seconds = 25): Promise<boolean> {
  const tries = seconds * 2;
  for (let i = 0; i < tries; i += 1) {
    if (await isLinkOnline()) return true;
    await new Promise((r) => window.setTimeout(r, 500));
  }
  return false;
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
    const device = await navigator.usb!.requestDevice({ filters: [{ vendorId: APPLE_VENDOR }] });
    return { connected: true, device: deviceFromUsb(device), linkOnline: await isLinkOnline() };
  } catch {
    /* fall through */
  }

  return { connected: false, error: 'no_device' };
}

export function launchGeoLocaLink() {
  const href = `${window.location.origin}/connect/GeoLoca-Link.command`;
  const a = document.createElement('a');
  a.href = href;
  a.download = 'GeoLoca-Link.command';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function isMacDesktop() {
  return /macintosh|mac os x/i.test(navigator.userAgent) && !/iphone|ipad/i.test(navigator.userAgent);
}
