export type PhoneDevice = {
  id: string;
  name: string;
  type: 'iPhone' | 'Android';
  link: 'USB' | 'Wi‑Fi';
};

export const PHONE_DEVICES: PhoneDevice[] = [
  { id: 'iphone-usb', name: 'iPhone 15', type: 'iPhone', link: 'USB' },
  { id: 'iphone-wifi', name: 'iPhone 15', type: 'iPhone', link: 'Wi‑Fi' },
  { id: 'android-usb', name: 'Samsung Galaxy', type: 'Android', link: 'USB' },
  { id: 'android-wifi', name: 'Pixel 8', type: 'Android', link: 'Wi‑Fi' },
];

export type ConnectionStatus = 'waiting' | 'connecting' | 'connected';

export function phoneLabel(phone: PhoneDevice) {
  return `${phone.name} · ${phone.link}`;
}
