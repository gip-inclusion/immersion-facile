import { VirtualTimeScheduler } from "rxjs";
import { InMemoryApiAdresseGateway } from "src/core-logic/adapters/InMemoryApiAdresseGateway";
import { InMemoryEstablishmentGateway } from "src/core-logic/adapters/InMemoryEstablishmentGateway";
import { InMemoryFeatureFlagGateway } from "src/core-logic/adapters/InMemoryFeatureFlagGateway";
import { InMemoryImmersionApplicationGateway } from "src/core-logic/adapters/InMemoryImmersionApplicationGateway";
import { InMemoryImmersionSearchGateway } from "src/core-logic/adapters/InMemoryImmersionSearchGateway";
import { InMemoryRomeAutocompleteGateway } from "src/core-logic/adapters/InMemoryRomeAutocompleteGateway";
import { createStore, RootState } from "src/core-logic/storeConfig/store";
import { InMemoryAgencyGateway } from "src/infra/gateway/AgencyGateway/InMemoryAgencyGateway";
import { InMemorySiretGatewayThroughBack } from "../adapters/InMemorySiretGatewayThroughBack";

export interface TestDependencies {
  siretGatewayThroughBack: InMemorySiretGatewayThroughBack;
  agencyGateway: InMemoryAgencyGateway;
  apiAdresseGateway: InMemoryApiAdresseGateway;
  featureFlagGateway: InMemoryFeatureFlagGateway;
  establishmentGateway: InMemoryEstablishmentGateway;
  immersionApplicationGateway: InMemoryImmersionApplicationGateway;
  immersionSearchGateway: InMemoryImmersionSearchGateway;
  romeAutocompleteGateway: InMemoryRomeAutocompleteGateway;
  minSearchResultsToPreventRefetch: number;
  scheduler: VirtualTimeScheduler;
}

export const createTestStore = (preloadedState?: Partial<RootState>) => {
  const dependencies: TestDependencies = {
    siretGatewayThroughBack: new InMemorySiretGatewayThroughBack(),
    immersionSearchGateway: new InMemoryImmersionSearchGateway(),
    minSearchResultsToPreventRefetch: 2,
    establishmentGateway: new InMemoryEstablishmentGateway(),
    immersionApplicationGateway: new InMemoryImmersionApplicationGateway(),
    apiAdresseGateway: new InMemoryApiAdresseGateway(),
    featureFlagGateway: new InMemoryFeatureFlagGateway(),
    agencyGateway: new InMemoryAgencyGateway(),
    romeAutocompleteGateway: new InMemoryRomeAutocompleteGateway(),
    scheduler: new VirtualTimeScheduler(),
  };

  return { store: createStore({ dependencies, preloadedState }), dependencies };
};
