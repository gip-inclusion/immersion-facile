import { DeviceRepository } from "src/core-logic/ports/DeviceRepository";

export const createLocalStorageDeviceRepository = (): DeviceRepository => ({
  set(key, value) {
    const valueAsString = JSON.stringify(value);
    localStorage.setItem(key, valueAsString);
  },
  get(key) {
    const valueAsString = localStorage.getItem(key);
    if (!valueAsString) return;
    return JSON.parse(valueAsString);
  },
  delete(key) {
    localStorage.removeItem(key);
  },
});
