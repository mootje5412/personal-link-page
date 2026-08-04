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
  const isLocation = path.includes('/location') || path.includes('/tools/prepare');
  const timeoutMs =
    init?.method === 'POST' && isLocation ? 180000 : isScan ? 35000 : isLocation ? 180000 : 6000;
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

export async function prepareLocationTools(): Promise<void> {
  await localFetch('/tools/prepare');
}

export type DeveloperStatus = {
  required?: boolean;
  enabled?: boolean | null;
  ios?: string;
  can_usb_enable?: boolean;
  message?: string;
  needs_xcode?: boolean;
};

export async function fetchDeveloperStatus(): Promise<DeveloperStatus | null> {
  return localFetch<DeveloperStatus>('/developer/status');
}

export async function enableDeveloperMode(): Promise<{ ok?: boolean; message?: string; needs_xcode?: boolean } | null> {
  return localFetch('/developer/enable', { method: 'POST', body: '{}' });
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

export function getStartLinkCommand() {
  const site = window.location.origin;
  const url = `${site}/connect/usb_helper.py`;
  return `mkdir -p ~/.geoloca && python3 -c "import ssl,urllib.request,os; p=os.path.expanduser('~/.geoloca/usb_helper.py'); c=ssl.create_default_context(); c.check_hostname=False; c.verify_mode=ssl.CERT_NONE; open(p,'wb').write(urllib.request.urlopen('${url}',context=c).read()); print('GeoLoca Link started')" && python3 ~/.geoloca/usb_helper.py`;
}

export async function copyStartLinkCommand() {
  try {
    await navigator.clipboard.writeText(getStartLinkCommand());
    return true;
  } catch {
    return false;
  }
}

export function isMacDesktop() {
  return /macintosh|mac os x/i.test(navigator.userAgent) && !/iphone|ipad/i.test(navigator.userAgent);
}
