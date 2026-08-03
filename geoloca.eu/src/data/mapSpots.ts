import { COUNTRIES } from './countries';

export type MapSpot = {
  x: number;
  y: number;
  lat: string;
  lng: string;
};

export const MAP_SPOTS: Record<(typeof COUNTRIES)[number], MapSpot> = {
  Canada: { x: 72, y: 62, lat: '43.653° N', lng: '79.383° W' },
  Netherlands: { x: 198, y: 86, lat: '52.367° N', lng: '4.904° E' },
  Germany: { x: 208, y: 92, lat: '52.520° N', lng: '13.405° E' },
  France: { x: 182, y: 98, lat: '48.857° N', lng: '2.352° E' },
  Japan: { x: 318, y: 96, lat: '35.676° N', lng: '139.650° E' },
  Brazil: { x: 118, y: 148, lat: '23.550° S', lng: '46.633° W' },
  Australia: { x: 328, y: 162, lat: '33.868° S', lng: '151.209° E' },
  'United Kingdom': { x: 168, y: 78, lat: '51.507° N', lng: '0.128° W' },
  Spain: { x: 168, y: 108, lat: '40.417° N', lng: '3.703° W' },
  Italy: { x: 210, y: 108, lat: '41.902° N', lng: '12.496° E' },
  Mexico: { x: 88, y: 118, lat: '19.433° N', lng: '99.133° W' },
  Sweden: { x: 214, y: 62, lat: '59.329° N', lng: '18.069° E' },
  Norway: { x: 200, y: 54, lat: '59.913° N', lng: '10.752° E' },
  Portugal: { x: 152, y: 108, lat: '38.722° N', lng: '9.139° W' },
  'United States': { x: 86, y: 96, lat: '40.713° N', lng: '74.006° W' },
};
