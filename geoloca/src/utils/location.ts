export interface SavedLocation {
  lat: number;
  lng: number;
  label: string;
  address?: string;
}

export interface SpoofState {
  active: boolean;
  location: SavedLocation | null;
}

const STORAGE_KEY = 'geoloca-spoof';

export function loadSpoofState(): SpoofState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { active: false, location: null };
    return JSON.parse(raw) as SpoofState;
  } catch {
    return { active: false, location: null };
  }
}

export function saveSpoofState(state: SpoofState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function formatCoords(lat: number, lng: number): string {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error('Geocode failed');
    const data = (await res.json()) as { display_name?: string };
    return data.display_name ?? formatCoords(lat, lng);
  } catch {
    return formatCoords(lat, lng);
  }
}

export interface SearchResult {
  lat: number;
  lng: number;
  label: string;
}

export async function searchPlaces(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as Array<{
    lat: string;
    lon: string;
    display_name: string;
  }>;
  return data.map((item) => ({
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
    label: item.display_name,
  }));
}
