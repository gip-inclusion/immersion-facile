import { InMemoryAgencyGateway } from "src/infra/gateway/AgencyGateway/InMemoryAgencyGateway";
import { InMemoryApiAdresseGateway } from "src/core-logic/adapters/InMemoryApiAdresseGateway";
import { InMemoryFeatureFlagGateway } from "src/core-logic/adapters/InMemoryFeatureFlagGateway";
import { InMemoryFormEstablishmentGateway } from "src/core-logic/adapters/InMemoryFormEstablishmentGateway";
import { InMemoryImmersionApplicationGateway } from "src/core-logic/adapters/InMemoryImmersionApplicationGateway";
import { InMemoryImmersionSearchGateway } from "src/core-logic/adapters/InMemoryImmersionSearchGateway";
import { InMemoryRomeAutocompleteGateway } from "src/core-logic/adapters/InMemoryRomeAutocompleteGateway";
import { createStore, RootState } from "src/core-logic/storeConfig/store";

export interface TestDependencies {
  agencyGateway: InMemoryAgencyGateway;
  apiAdresseGateway: InMemoryApiAdresseGateway;
  featureFlagGateway: InMemoryFeatureFlagGateway;
  formEstablishmentGateway: InMemoryFormEstablishmentGateway;
  immersionApplicationGateway: InMemoryImmersionApplicationGateway;
  immersionSearchGateway: InMemoryImmersionSearchGateway;
  romeAutocompleteGateway: InMemoryRomeAutocompleteGateway;
  minSearchResultsToPreventRefetch: number;
}

export const createTestStore = (preloadedState?: Partial<RootState>) => {
  const dependencies: TestDependencies = {
    immersionSearchGateway: new InMemoryImmersionSearchGateway(),
    minSearchResultsToPreventRefetch: 2,
    formEstablishmentGateway: new InMemoryFormEstablishmentGateway(),
    immersionApplicationGateway: new InMemoryImmersionApplicationGateway(),
    apiAdresseGateway: new InMemoryApiAdresseGateway(),
    featureFlagGateway: new InMemoryFeatureFlagGateway(),
    agencyGateway: new InMemoryAgencyGateway(),
    romeAutocompleteGateway: new InMemoryRomeAutocompleteGateway(),
  };

  return { store: createStore({ dependencies, preloadedState }), dependencies };
};
