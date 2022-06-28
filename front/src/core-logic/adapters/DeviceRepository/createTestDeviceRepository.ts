import type { DeviceRepository } from "src/core-logic/ports/DeviceRepository";

export const createTestDeviceRepository = (): DeviceRepository => {
  const fakeStorage: Partial<Record<string, any>> = {};

  return {
    delete(key): void {
      delete fakeStorage[key];
    },
    get(key) {
      return fakeStorage[key];
    },
    set: ((key: string, value: any) => {
      fakeStorage[key] = value;
    }) as any,
  };
};
