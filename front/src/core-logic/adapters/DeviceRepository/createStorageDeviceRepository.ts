import {
  DeviceRepository,
  GenericStorage,
  KeyInDevice,
} from "src/core-logic/ports/DeviceRepository";

type StorageKind = "localStorage" | "sessionStorage";

export const createStorageDeviceRepository = <S extends GenericStorage>(
  storageKind: StorageKind,
): DeviceRepository<S> => {
  const storage = window[storageKind];
  return {
    set: ((key: KeyInDevice<S>, value: any) => {
      const valueAsString = JSON.stringify(value);
      storage.setItem(key, valueAsString);
    }) as any,
    get(key) {
      const valueAsString = storage.getItem(key);
      if (!valueAsString) return;
      return JSON.parse(valueAsString);
    },
    delete(key) {
      storage.removeItem(key);
    },
  };
};
