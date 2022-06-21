import { VirtualTimeScheduler } from "rxjs";
import { InMemoryAgencyGateway } from "src/core-logic/adapters/AgencyGateway/InMemoryAgencyGateway";
import { InMemoryApiAdresseGateway } from "src/core-logic/adapters/InMemoryApiAdresseGateway";
import { InMemoryConventionGateway } from "src/core-logic/adapters/InMemoryConventionGateway";
import { InMemoryEstablishmentGateway } from "src/core-logic/adapters/InMemoryEstablishmentGateway";
import { InMemoryImmersionSearchGateway } from "src/core-logic/adapters/InMemoryImmersionSearchGateway";
import { InMemoryNavigationGateway } from "src/core-logic/adapters/InMemoryNavigationGateway";
import { InMemoryRomeAutocompleteGateway } from "src/core-logic/adapters/InMemoryRomeAutocompleteGateway";
import { TestTechnicalGateway } from "src/core-logic/adapters/TechnicalGateway/TestTechnicalGateway";
import { createStore, RootState } from "src/core-logic/storeConfig/store";
import { TestImmersionAssessmentGateway } from "../adapters/AssessmentGateway/TestImmersionAssessmentGateway";
import { TestSiretGatewayThroughBack } from "../adapters/TestSiretGatewayThroughBack";

export interface TestDependencies {
  immersionAssessmentGateway: TestImmersionAssessmentGateway;
  siretGatewayThroughBack: TestSiretGatewayThroughBack;
  agencyGateway: InMemoryAgencyGateway;
  apiAdresseGateway: InMemoryApiAdresseGateway;
  technicalGateway: TestTechnicalGateway;
  establishmentGateway: InMemoryEstablishmentGateway;
  conventionGateway: InMemoryConventionGateway;
  immersionSearchGateway: InMemoryImmersionSearchGateway;
  romeAutocompleteGateway: InMemoryRomeAutocompleteGateway;
  navigationGateway: InMemoryNavigationGateway;
  scheduler: VirtualTimeScheduler;
  minSearchResultsToPreventRefetch: number;
}

export const createTestStore = (
  preloadedState?: Partial<RootState>,
  message?: "skip" | string,
) => {
  const dependencies: TestDependencies = {
    immersionAssessmentGateway: new TestImmersionAssessmentGateway(),
    siretGatewayThroughBack: new TestSiretGatewayThroughBack(),
    immersionSearchGateway: new InMemoryImmersionSearchGateway(),
    establishmentGateway: new InMemoryEstablishmentGateway(),
    conventionGateway: new InMemoryConventionGateway(),
    apiAdresseGateway: new InMemoryApiAdresseGateway(),
    technicalGateway: new TestTechnicalGateway(),
    agencyGateway: new InMemoryAgencyGateway(),
    romeAutocompleteGateway: new InMemoryRomeAutocompleteGateway(),
    navigationGateway: new InMemoryNavigationGateway(),
    scheduler: new VirtualTimeScheduler(),
    minSearchResultsToPreventRefetch: 2,
  };

  preloadedState &&
    message !== "skip" &&
    it(createMessage(preloadedState, message), () => {
      /* do nothing */
    });

  return { store: createStore({ dependencies, preloadedState }), dependencies };
};

const createMessage = (obj: object, message?: string) => {
  if (message) return message;
  return "creates store with initial values : " + JSON.stringify(obj, null, 2);
};

export type StoreAndDeps = ReturnType<typeof createTestStore>;
