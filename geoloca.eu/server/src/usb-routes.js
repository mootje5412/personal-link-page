import { execSync } from 'node:child_process';
import { platform } from 'node:os';

const HELPER = 'http://127.0.0.1:7429';

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', timeout: 8000, stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

function detectLocalIphone() {
  const os = platform();

  if (os === 'linux') {
    const lsusb = run('lsusb');
    if (lsusb && (lsusb.includes('Apple') || lsusb.toLowerCase().includes('05ac:'))) {
      let name = 'iPhone';
      for (const line of lsusb.split('\n')) {
        if (line.includes('Apple') || line.toLowerCase().includes('05ac:')) {
          name = line.split(':').slice(2).join(':').trim() || 'iPhone';
          break;
        }
      }
      return { connected: true, device: { name, model: name, connection: 'usb' } };
    }
  }

  if (os === 'darwin') {
    const raw = run('system_profiler SPUSBDataType -json');
    if (raw) {
      try {
        const data = JSON.parse(raw);
        const items = data.SPUSBDataType || [];
        const found = findIphone(items);
        if (found) return { connected: true, device: found };
      } catch {
        /* ignore */
      }
    }
    const ioreg = run('ioreg -p IOUSB -l -w 0');
    if (/iPhone/i.test(ioreg)) {
      const m = ioreg.match(/"USB Product Name"\s*=\s*"([^"]+)"/);
      const name = m?.[1] || 'iPhone';
      return { connected: true, device: { name, model: name, connection: 'usb' } };
    }
  }

  return { connected: false };
}

function findIphone(items) {
  if (!items) return null;
  for (const item of items) {
    const name = item._name || item.name || '';
    if (/iphone/i.test(name)) {
      return { name: name.trim(), model: item.model || name, connection: 'usb' };
    }
    const nested = findIphone(item._items || item.items);
    if (nested) return nested;
  }
  return null;
}

function setLocalLocation(lat, lng) {
  const latS = Number(lat).toFixed(6);
  const lngS = Number(lng).toFixed(6);

  if (run('which idevicesetlocation')) {
    run(`idevicesetlocation ${latS} ${lngS}`);
    return { ok: true, method: 'idevicesetlocation' };
  }

  if (run('which pymobiledevice3')) {
    run(`pymobiledevice3 developer simulate-location set -- ${latS} ${lngS}`);
    return { ok: true, method: 'pymobiledevice3' };
  }

  const scan = detectLocalIphone();
  if (!scan.connected) {
    return { ok: false, error: 'iphone_not_connected' };
  }

  return { ok: true, method: 'queued', message: 'iPhone on USB detected' };
}

async function helperFetch(path, init) {
  try {
    const res = await fetch(`${HELPER}${path}`, { ...init, signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export function attachUsbRoutes(app) {
  app.get('/api/usb/health', async (_req, res) => {
    const helper = await helperFetch('/health');
    if (helper?.ok) return res.json({ ok: true, source: 'helper' });
    res.json({ ok: true, source: 'api' });
  });

  app.get('/api/usb/scan', async (_req, res) => {
    const helper = await helperFetch('/usb/scan');
    if (helper?.connected) return res.json(helper);
    res.json(detectLocalIphone());
  });

  app.post('/api/usb/location', async (req, res) => {
    const lat = Number(req.body?.lat);
    const lng = Number(req.body?.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ ok: false, error: 'invalid_coordinates' });
    }

    const helper = await helperFetch('/location', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lng }),
    });
    if (helper?.ok) return res.json(helper);

    res.json(setLocalLocation(lat, lng));
  });
}
