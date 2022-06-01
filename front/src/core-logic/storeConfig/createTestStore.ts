import { VirtualTimeScheduler } from "rxjs";
import { InMemoryApiAdresseGateway } from "src/core-logic/adapters/InMemoryApiAdresseGateway";
import { InMemoryEstablishmentGateway } from "src/core-logic/adapters/InMemoryEstablishmentGateway";
import { InMemoryTechnicalGateway } from "src/core-logic/adapters/InMemoryTechnicalGateway";
import { InMemoryImmersionApplicationGateway } from "src/core-logic/adapters/InMemoryImmersionApplicationGateway";
import { InMemoryImmersionSearchGateway } from "src/core-logic/adapters/InMemoryImmersionSearchGateway";
import { InMemoryRomeAutocompleteGateway } from "src/core-logic/adapters/InMemoryRomeAutocompleteGateway";
import { createStore, RootState } from "src/core-logic/storeConfig/store";
import { InMemoryAgencyGateway } from "src/infra/gateway/AgencyGateway/InMemoryAgencyGateway";
import { InMemoryNavigationGateway } from "src/core-logic/adapters/InMemoryNavigationGateway";
import { TestImmersionAssessmentGateway } from "../adapters/AssessmentGateway/TestImmersionAssessmentGateway";
import { TestSiretGatewayThroughBack } from "../adapters/TestSiretGatewayThroughBack";

export interface TestDependencies {
  immersionAssessmentGateway: TestImmersionAssessmentGateway;
  siretGatewayThroughBack: TestSiretGatewayThroughBack;
  agencyGateway: InMemoryAgencyGateway;
  apiAdresseGateway: InMemoryApiAdresseGateway;
  technicalGateway: InMemoryTechnicalGateway;
  establishmentGateway: InMemoryEstablishmentGateway;
  immersionApplicationGateway: InMemoryImmersionApplicationGateway;
  immersionSearchGateway: InMemoryImmersionSearchGateway;
  romeAutocompleteGateway: InMemoryRomeAutocompleteGateway;
  minSearchResultsToPreventRefetch: number;
  scheduler: VirtualTimeScheduler;
  navigationGateway: InMemoryNavigationGateway;
}

export const createTestStore = (
  preloadedState?: Partial<RootState>,
  message?: "skip" | string,
) => {
  const dependencies: TestDependencies = {
    immersionAssessmentGateway: new TestImmersionAssessmentGateway(),
    siretGatewayThroughBack: new TestSiretGatewayThroughBack(),
    immersionSearchGateway: new InMemoryImmersionSearchGateway(),
    minSearchResultsToPreventRefetch: 2,
    establishmentGateway: new InMemoryEstablishmentGateway(),
    immersionApplicationGateway: new InMemoryImmersionApplicationGateway(),
    apiAdresseGateway: new InMemoryApiAdresseGateway(),
    technicalGateway: new InMemoryTechnicalGateway(),
    agencyGateway: new InMemoryAgencyGateway(),
    romeAutocompleteGateway: new InMemoryRomeAutocompleteGateway(),
    scheduler: new VirtualTimeScheduler(),
    navigationGateway: new InMemoryNavigationGateway(),
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
