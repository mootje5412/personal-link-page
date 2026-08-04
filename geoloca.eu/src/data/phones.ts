export type DetectedDevice = {
  name: string;
  model?: string;
  connection: 'usb';
};

export type ConnectionStatus =
  | 'waiting'
  | 'detecting_usb'
  | 'connecting'
  | 'connected';

export function deviceLabel(device: DetectedDevice) {
  return `${device.name} · USB`;
}
