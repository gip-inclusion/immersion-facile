import { asyncScheduler } from "rxjs";

import { createLocalStorageDeviceRepository } from "src/core-logic/adapters/DeviceRepository/createLocalStorageDeviceRepository";
import { ReactNavigationGateway } from "src/core-logic/adapters/NavigationGateway/ReactNavigationGateway";

export const createCommonDependencies = () => ({
  navigationGateway: new ReactNavigationGateway(),
  deviceRepository: createLocalStorageDeviceRepository(),
  minSearchResultsToPreventRefetch: 10,
  scheduler: asyncScheduler,
});
