import {
  DeviceRepository,
  KeyInDevice,
} from "src/core-logic/ports/DeviceRepository";

export const createLocalStorageDeviceRepository = (): DeviceRepository => ({
  set: ((key: KeyInDevice, value: any) => {
    const valueAsString = JSON.stringify(value);
    localStorage.setItem(key, valueAsString);
  }) as any,
  get(key) {
    const valueAsString = localStorage.getItem(key);
    if (!valueAsString) return;
    return JSON.parse(valueAsString);
  },
  delete(key) {
    localStorage.removeItem(key);
  },
});
