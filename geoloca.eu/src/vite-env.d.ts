/// <reference types="vite/client" />

interface Navigator {
  usb?: {
    getDevices(): Promise<USBDevice[]>;
    requestDevice(options: { filters: USBDeviceFilter[] }): Promise<USBDevice>;
  };
}

interface USBDeviceFilter {
  vendorId?: number;
}

interface USBDevice {
  vendorId: number;
  productName?: string;
}
