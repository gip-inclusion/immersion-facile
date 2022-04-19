import { HttpApiAdresseGateway } from "src/core-logic/adapters/HttpApiAdresseGateway";
import { HttpFeatureFlagGateway } from "src/core-logic/adapters/HttpFeatureFlagGateway";
import { HttpEstablishmentGateway } from "src/core-logic/adapters/HttpEstablishmentGateway";
import { HttpImmersionApplicationGateway } from "src/core-logic/adapters/HttpImmersionApplicationGateway";
import { HttpImmersionSearchGateway } from "src/core-logic/adapters/HttpImmersionSearchGateway";
import { HttpRomeAutocompleteGateway } from "src/core-logic/adapters/HttpRomeAutocompleteGateway";
import { InMemoryApiAdresseGateway } from "src/core-logic/adapters/InMemoryApiAdresseGateway";
import { InMemoryFeatureFlagGateway } from "src/core-logic/adapters/InMemoryFeatureFlagGateway";
import { InMemoryEstablishmentGateway } from "src/core-logic/adapters/InMemoryEstablishmentGateway";
import { InMemoryImmersionApplicationGateway } from "src/core-logic/adapters/InMemoryImmersionApplicationGateway";
import {
  InMemoryImmersionSearchGateway,
  seedSearchResults,
} from "src/core-logic/adapters/InMemoryImmersionSearchGateway";
import {
  InMemoryRomeAutocompleteGateway,
  seedRomeDtos,
} from "src/core-logic/adapters/InMemoryRomeAutocompleteGateway";
import { ApiAdresseGateway } from "src/core-logic/ports/ApiAdresseGateway";
import { FeatureFlagsGateway } from "src/core-logic/ports/FeatureFlagsGateway";
import { EstablishmentGateway } from "src/core-logic/ports/EstablishmentGateway";
import { ImmersionApplicationGateway } from "src/core-logic/ports/ImmersionApplicationGateway";
import { ImmersionSearchGateway } from "src/core-logic/ports/ImmersionSearchGateway";
import { RomeAutocompleteGateway } from "src/core-logic/ports/RomeAutocompleteGateway";
import { createStore } from "src/core-logic/storeConfig/store";
import { AgencyGateway } from "src/domain/ports/AgencyGateway";
import { ENV } from "src/environmentVariables";
import { HttpAgencyGateway } from "src/infra/gateway/AgencyGateway/HttpAgencyGateway";
import { InMemoryAgencyGateway } from "src/infra/gateway/AgencyGateway/InMemoryAgencyGateway";

export const establishmentGateway: EstablishmentGateway =
  ENV.gateway === "IN_MEMORY"
    ? new InMemoryEstablishmentGateway(["12345678901238"])
    : new HttpEstablishmentGateway();

export const immersionApplicationGateway: ImmersionApplicationGateway =
  ENV.gateway === "IN_MEMORY"
    ? new InMemoryImmersionApplicationGateway()
    : new HttpImmersionApplicationGateway();

export const immersionSearchGateway: ImmersionSearchGateway =
  ENV.gateway === "IN_MEMORY"
    ? new InMemoryImmersionSearchGateway(seedSearchResults, 500)
    : new HttpImmersionSearchGateway();

export const apiAdresseGateway: ApiAdresseGateway =
  ENV.gateway === "IN_MEMORY"
    ? new InMemoryApiAdresseGateway()
    : new HttpApiAdresseGateway();

export const featureFlagGateway: FeatureFlagsGateway =
  ENV.gateway === "IN_MEMORY"
    ? new InMemoryFeatureFlagGateway()
    : new HttpFeatureFlagGateway();

export const agencyGateway: AgencyGateway =
  ENV.gateway === "IN_MEMORY"
    ? new InMemoryAgencyGateway()
    : new HttpAgencyGateway();

export const romeAutocompleteGateway: RomeAutocompleteGateway =
  ENV.gateway === "IN_MEMORY"
    ? new InMemoryRomeAutocompleteGateway(seedRomeDtos, 500)
    : new HttpRomeAutocompleteGateway();

export type Dependencies = {
  agencyGateway: AgencyGateway;
  apiAdresseGateway: ApiAdresseGateway;
  featureFlagGateway: FeatureFlagsGateway;
  establishmentGateway: EstablishmentGateway;
  immersionApplicationGateway: ImmersionApplicationGateway;
  immersionSearchGateway: ImmersionSearchGateway;
  romeAutocompleteGateway: RomeAutocompleteGateway;
  minSearchResultsToPreventRefetch: number;
};

export const store = createStore({
  dependencies: {
    agencyGateway,
    apiAdresseGateway,
    featureFlagGateway,
    establishmentGateway: establishmentGateway,
    immersionApplicationGateway,
    immersionSearchGateway,
    romeAutocompleteGateway,
    minSearchResultsToPreventRefetch: 10,
  },
});
