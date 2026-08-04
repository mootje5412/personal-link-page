import { MAP_SPOTS } from '../data/mapSpots';
import type { COUNTRIES } from '../data/countries';

type Country = (typeof COUNTRIES)[number];

export function countryCoords(country: Country) {
  const spot = MAP_SPOTS[country];
  return { lat: spot.latNum, lng: spot.lngNum, label: `${spot.lat}, ${spot.lng}` };
}
