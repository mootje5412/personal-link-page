import { COUNTRIES } from './countries';

export type MapSpot = {
  x: number;
  y: number;
  lat: string;
  lng: string;
  latNum: number;
  lngNum: number;
};

export const MAP_SPOTS: Record<(typeof COUNTRIES)[number], MapSpot> = {
  Canada: { x: 72, y: 62, lat: '43.653° N', lng: '79.383° W', latNum: 43.653, lngNum: -79.383 },
  Netherlands: { x: 198, y: 86, lat: '52.367° N', lng: '4.904° E', latNum: 52.367, lngNum: 4.904 },
  Germany: { x: 208, y: 92, lat: '52.520° N', lng: '13.405° E', latNum: 52.52, lngNum: 13.405 },
  France: { x: 182, y: 98, lat: '48.857° N', lng: '2.352° E', latNum: 48.857, lngNum: 2.352 },
  Japan: { x: 318, y: 96, lat: '35.676° N', lng: '139.650° E', latNum: 35.676, lngNum: 139.65 },
  Brazil: { x: 118, y: 148, lat: '23.550° S', lng: '46.633° W', latNum: -23.55, lngNum: -46.633 },
  Australia: { x: 328, y: 162, lat: '33.868° S', lng: '151.209° E', latNum: -33.868, lngNum: 151.209 },
  'United Kingdom': { x: 168, y: 78, lat: '51.507° N', lng: '0.128° W', latNum: 51.507, lngNum: -0.128 },
  Spain: { x: 168, y: 108, lat: '40.417° N', lng: '3.703° W', latNum: 40.417, lngNum: -3.703 },
  Italy: { x: 210, y: 108, lat: '41.902° N', lng: '12.496° E', latNum: 41.902, lngNum: 12.496 },
  Mexico: { x: 88, y: 118, lat: '19.433° N', lng: '99.133° W', latNum: 19.433, lngNum: -99.133 },
  Sweden: { x: 214, y: 62, lat: '59.329° N', lng: '18.069° E', latNum: 59.329, lngNum: 18.069 },
  Norway: { x: 200, y: 54, lat: '59.913° N', lng: '10.752° E', latNum: 59.913, lngNum: 10.752 },
  Portugal: { x: 152, y: 108, lat: '38.722° N', lng: '9.139° W', latNum: 38.722, lngNum: -9.139 },
  'United States': { x: 86, y: 96, lat: '40.713° N', lng: '74.006° W', latNum: 40.713, lngNum: -74.006 },
};
