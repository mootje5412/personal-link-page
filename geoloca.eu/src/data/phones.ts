export type IPhoneModel = {
  id: string;
  name: string;
  generation: string;
};

/** iPhone only — location spoofing requires a USB cable. Wi‑Fi will not work. */
export const IPHONE_MODELS: IPhoneModel[] = [
  { id: 'iphone-16-pro', name: 'iPhone 16 Pro', generation: '2024' },
  { id: 'iphone-16', name: 'iPhone 16', generation: '2024' },
  { id: 'iphone-15-pro', name: 'iPhone 15 Pro', generation: '2023' },
  { id: 'iphone-15', name: 'iPhone 15', generation: '2023' },
  { id: 'iphone-14', name: 'iPhone 14', generation: '2022' },
  { id: 'iphone-13', name: 'iPhone 13', generation: '2021' },
  { id: 'iphone-se', name: 'iPhone SE', generation: '2022' },
];

export type ConnectionStatus =
  | 'waiting'
  | 'detecting_usb'
  | 'connecting'
  | 'connected'
  | 'usb_not_found';

export type SetupStep = 1 | 2 | 3 | 4;

export const USB_SETUP_STEPS = [
  {
    step: 1 as SetupStep,
    title: 'Plug in with USB',
    text: 'Connect your iPhone to this computer using a Lightning or USB‑C cable.',
    icon: '🔌',
  },
  {
    step: 2 as SetupStep,
    title: 'Trust this computer',
    text: 'Unlock your iPhone and tap Trust when asked. Location spoofing only works over USB.',
    icon: '🔐',
  },
  {
    step: 3 as SetupStep,
    title: 'Choose your iPhone',
    text: 'Select the model connected to your USB port.',
    icon: '📱',
  },
  {
    step: 4 as SetupStep,
    title: 'Detect USB link',
    text: 'We scan for your iPhone on the USB bus. Wi‑Fi connections are not supported.',
    icon: '⚡',
  },
] as const;

export function iphoneLabel(model: IPhoneModel) {
  return `${model.name} · USB`;
}

/** @deprecated use IPhoneModel */
export type PhoneDevice = IPhoneModel & { type: 'iPhone'; link: 'USB' };

export type ConnectionStatusLegacy = ConnectionStatus;

export function phoneLabel(model: IPhoneModel) {
  return iphoneLabel(model);
}
