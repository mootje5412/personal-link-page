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
  try {
    const res = await fetch(`${LOCAL}${path}`, {
      ...init,
      mode: 'cors',
      headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
      signal: AbortSignal.timeout(init?.method === 'POST' ? 20000 : 5000),
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

/** Only scans the computer running the browser — not the remote server. */
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

export async function requestWebUsb(): Promise<UsbScanResult> {
  if (!('usb' in navigator)) return { connected: false, error: 'no_device' };
  try {
    const device = await navigator.usb!.requestDevice({ filters: [{ vendorId: APPLE_VENDOR }] });
    const name = device.productName || 'iPhone';
    return { connected: true, device: { name, model: name, connection: 'usb' }, linkOnline: await isLinkOnline() };
  } catch {
    return { connected: false, error: 'no_device' };
  }
}

export function downloadGeoLocaLink() {
  const ua = navigator.userAgent.toLowerCase();
  const base = `${window.location.origin}/connect/`;
  const href = ua.includes('win') ? `${base}GeoLoca-Link.bat` : `${base}GeoLoca-Link.command`;
  const a = document.createElement('a');
  a.href = href;
  a.download = href.includes('.bat') ? 'GeoLoca-Link.bat' : 'GeoLoca-Link.command';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function openGeoLocaLink() {
  downloadGeoLocaLink();
}

export function getGeoLocaLinkTerminalCommand() {
  const site = window.location.origin;
  const url = `${site}/connect/usb_helper.py`;
  return `mkdir -p ~/.geoloca && python3 -c "import ssl,urllib.request,os; p=os.path.expanduser('~/.geoloca/usb_helper.py'); c=ssl.create_default_context(); c.check_hostname=False; c.verify_mode=ssl.CERT_NONE; open(p,'wb').write(urllib.request.urlopen('${url}',context=c).read()); print('Saved to',p)" && python3 ~/.geoloca/usb_helper.py`;
}

export async function copyGeoLocaLinkCommand() {
  const cmd = getGeoLocaLinkTerminalCommand();
  try {
    await navigator.clipboard.writeText(cmd);
    return true;
  } catch {
    return false;
  }
}
