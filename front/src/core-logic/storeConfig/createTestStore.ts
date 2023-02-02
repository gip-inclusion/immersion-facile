import { VirtualTimeScheduler } from "rxjs";
import { TestAdminGateway } from "src/core-logic/adapters/AdminGateway/TestAdminGateway";

import { InMemoryConventionGateway } from "src/core-logic/adapters/Convention/InMemoryConventionGateway";
import { createTestDeviceRepository } from "src/core-logic/adapters/DeviceRepository/createTestDeviceRepository";
import { TestSentEmailGateway } from "src/core-logic/adapters/EmailGateway/TestSentEmailGateway";
import { InMemoryEstablishmentGateway } from "src/core-logic/adapters/EstablishmentGateway/InMemoryEstablishmentGateway";
import { InMemoryImmersionSearchGateway } from "src/core-logic/adapters/ImmersionSearchGateway/InMemoryImmersionSearchGateway";
import { InMemoryNavigationGateway } from "src/core-logic/adapters/NavigationGateway/InMemoryNavigationGateway";
import { InMemoryRomeAutocompleteGateway } from "src/core-logic/adapters/RomeAutocompleteGateway/InMemoryRomeAutocompleteGateway";
import { TestTechnicalGateway } from "src/core-logic/adapters/TechnicalGateway/TestTechnicalGateway";
import { DeviceRepository } from "src/core-logic/ports/DeviceRepository";
import { createStore, RootState } from "src/core-logic/storeConfig/store";
import { TestAddressGateway } from "../adapters/AddressGateway/TestAddressGateway";
import { TestAgencyGateway } from "../adapters/AgencyGateway/TestAgencyGateway";
import { TestImmersionAssessmentGateway } from "../adapters/AssessmentGateway/TestImmersionAssessmentGateway";
import { TestSiretGatewayThroughBack } from "../adapters/SiretGatewayThroughBack/TestSiretGatewayThroughBack";

export interface TestDependencies {
  adminGateway: TestAdminGateway;
  immersionAssessmentGateway: TestImmersionAssessmentGateway;
  siretGatewayThroughBack: TestSiretGatewayThroughBack;
  agencyGateway: TestAgencyGateway;
  addressGateway: TestAddressGateway;
  technicalGateway: TestTechnicalGateway;
  establishmentGateway: InMemoryEstablishmentGateway;
  conventionGateway: InMemoryConventionGateway;
  immersionSearchGateway: InMemoryImmersionSearchGateway;
  romeAutocompleteGateway: InMemoryRomeAutocompleteGateway;
  deviceRepository: DeviceRepository;
  navigationGateway: InMemoryNavigationGateway;
  sentEmailGateway: TestSentEmailGateway;
  scheduler: VirtualTimeScheduler;
  minSearchResultsToPreventRefetch: number;
}

export const createTestStore = (preloadedState?: Partial<RootState>) => {
  const dependencies: TestDependencies = {
    adminGateway: new TestAdminGateway(),
    immersionAssessmentGateway: new TestImmersionAssessmentGateway(),
    siretGatewayThroughBack: new TestSiretGatewayThroughBack(),
    immersionSearchGateway: new InMemoryImmersionSearchGateway(),
    establishmentGateway: new InMemoryEstablishmentGateway(),
    conventionGateway: new InMemoryConventionGateway(),
    addressGateway: new TestAddressGateway(),
    technicalGateway: new TestTechnicalGateway(),
    agencyGateway: new TestAgencyGateway(),
    romeAutocompleteGateway: new InMemoryRomeAutocompleteGateway(),
    deviceRepository: createTestDeviceRepository(),
    navigationGateway: new InMemoryNavigationGateway(),
    sentEmailGateway: new TestSentEmailGateway(),
    scheduler: new VirtualTimeScheduler(),
    minSearchResultsToPreventRefetch: 2,
  };
  return { store: createStore({ dependencies, preloadedState }), dependencies };
};

export type StoreAndDeps = ReturnType<typeof createTestStore>;
