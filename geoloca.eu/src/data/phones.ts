export type DetectedDevice = {
  name: string;
  model?: string;
  connection: 'usb';
};

export type ConnectionStatus =
  | 'waiting'
  | 'detecting_usb'
  | 'connecting'
  | 'connected'
  | 'usb_not_found';

export type SetupStep = 1 | 2 | 3;

export const USB_SETUP_STEPS = [
  {
    step: 1 as SetupStep,
    titleKey: 'usb.step1.title',
    textKey: 'usb.step1.text',
    icon: '🔌',
  },
  {
    step: 2 as SetupStep,
    titleKey: 'usb.step2.title',
    textKey: 'usb.step2.text',
    icon: '🔐',
  },
  {
    step: 3 as SetupStep,
    titleKey: 'usb.step3.title',
    textKey: 'usb.step3.text',
    icon: '📡',
  },
] as const;

export function deviceLabel(device: DetectedDevice) {
  return `${device.name} · USB`;
}
