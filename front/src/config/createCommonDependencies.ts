import { asyncScheduler } from "rxjs";
import { createStorageDeviceRepository } from "src/core-logic/adapters/DeviceRepository/createStorageDeviceRepository";
import { ReactNavigationGateway } from "src/core-logic/adapters/NavigationGateway/ReactNavigationGateway";
import {
  LocalStoragePair,
  SessionStoragePair,
} from "src/core-logic/ports/DeviceRepository";

export const createCommonDependencies = () => ({
  navigationGateway: new ReactNavigationGateway(),
  sessionDeviceRepository:
    createStorageDeviceRepository<SessionStoragePair>("sessionStorage"),
  localDeviceRepository:
    createStorageDeviceRepository<LocalStoragePair>("localStorage"),
  minSearchResultsToPreventRefetch: 10,
  scheduler: asyncScheduler,
});
