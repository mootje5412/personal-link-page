import type { SavedLocation } from './location';

type GeoSuccess = PositionCallback;
type GeoError = PositionErrorCallback;

export interface PositionResult {
  lat: number;
  lng: number;
  source: 'gps' | 'ip';
  label?: string;
}

let spoofLocation: SavedLocation | null = null;
let spoofActive = false;
let patched = false;

let originalGet: (
  success: GeoSuccess,
  error?: GeoError | null,
  options?: PositionOptions
) => void;

let originalWatch: (
  success: GeoSuccess,
  error?: GeoError | null,
  options?: PositionOptions
) => number;

function buildPosition(lat: number, lng: number): GeolocationPosition {
  const coords: GeolocationCoordinates = {
    latitude: lat,
    longitude: lng,
    accuracy: 8,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
    toJSON() {
      return {
        latitude: lat,
        longitude: lng,
        accuracy: 8,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      };
    },
  };

  return {
    coords,
    timestamp: Date.now(),
    toJSON() {
      return { coords: coords.toJSON(), timestamp: Date.now() };
    },
  };
}

function patchGeolocation(): void {
  if (patched || !navigator.geolocation) return;
  patched = true;

  originalGet = navigator.geolocation.getCurrentPosition.bind(navigator.geolocation);
  originalWatch = navigator.geolocation.watchPosition.bind(navigator.geolocation);

  navigator.geolocation.getCurrentPosition = (
    success: GeoSuccess,
    error?: GeoError | null,
    options?: PositionOptions
  ) => {
    if (spoofActive && spoofLocation) {
      success(buildPosition(spoofLocation.lat, spoofLocation.lng));
      return;
    }
    originalGet(success, error ?? undefined, options);
  };

  navigator.geolocation.watchPosition = (
    success: GeoSuccess,
    error?: GeoError | null,
    options?: PositionOptions
  ) => {
    if (spoofActive && spoofLocation) {
      success(buildPosition(spoofLocation.lat, spoofLocation.lng));
      return 1;
    }
    return originalWatch(success, error ?? undefined, options);
  };
}

export function applyGeolocationSpoof(active: boolean, location: SavedLocation | null): void {
  patchGeolocation();
  spoofActive = active;
  spoofLocation = location;
}

function getNativeGps(): Promise<PositionResult> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    if (!patched) {
      patchGeolocation();
    }

    originalGet(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          source: 'gps',
          label: 'My GPS location',
        });
      },
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  });
}

async function getIpLocation(): Promise<PositionResult> {
  const res = await fetch('https://ipapi.co/json/');
  if (!res.ok) throw new Error('IP lookup failed');
  const data = (await res.json()) as {
    latitude?: number;
    longitude?: number;
    city?: string;
    region?: string;
    country_name?: string;
  };

  if (typeof data.latitude !== 'number' || typeof data.longitude !== 'number') {
    throw new Error('Invalid IP location');
  }

  const parts = [data.city, data.region, data.country_name].filter(Boolean);
  return {
    lat: data.latitude,
    lng: data.longitude,
    source: 'ip',
    label: parts.length ? parts.join(', ') : 'Approximate location',
  };
}

export async function getRealPosition(options?: {
  preferIp?: boolean;
}): Promise<PositionResult> {
  const canUseGps = window.isSecureContext && !!navigator.geolocation;

  if (canUseGps && !options?.preferIp) {
    try {
      return await getNativeGps();
    } catch {
      /* fall back to IP-based location */
    }
  }

  return getIpLocation();
}

export function isGpsAvailable(): boolean {
  return window.isSecureContext && !!navigator.geolocation;
}
