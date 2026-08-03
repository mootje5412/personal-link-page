import type { SavedLocation } from './location';

type GeoSuccess = PositionCallback;
type GeoError = PositionErrorCallback;

let spoofLocation: SavedLocation | null = null;
let spoofActive = false;
let patched = false;

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

  const originalGet = navigator.geolocation.getCurrentPosition.bind(navigator.geolocation);
  const originalWatch = navigator.geolocation.watchPosition.bind(navigator.geolocation);

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

export async function getRealPosition(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    const tempActive = spoofActive;
    spoofActive = false;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        spoofActive = tempActive;
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        spoofActive = tempActive;
        reject(err);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}
