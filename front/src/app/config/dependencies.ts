import { HttpApiAdresseGateway } from "src/core-logic/adapters/HttpApiAdresseGateway";
import { HttpFeatureFlagGateway } from "src/core-logic/adapters/HttpFeatureFlagGateway";
import { HttpFormEstablishmentGateway } from "src/core-logic/adapters/HttpFormEstablishmentGateway";
import { HttpImmersionApplicationGateway } from "src/core-logic/adapters/HttpImmersionApplicationGateway";
import { HttpImmersionSearchGateway } from "src/core-logic/adapters/HttpImmersionSearchGateway";
import { HttpRomeAutocompleteGateway } from "src/core-logic/adapters/HttpRomeAutocompleteGateway";
import { InMemoryApiAdresseGateway } from "src/core-logic/adapters/InMemoryApiAdresseGateway";
import { InMemoryFeatureFlagGateway } from "src/core-logic/adapters/InMemoryFeatureFlagGateway";
import { InMemoryFormEstablishmentGateway } from "src/core-logic/adapters/InMemoryFormEstablishmentGateway";
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
import { FormEstablishmentGateway } from "src/core-logic/ports/FormEstablishmentGateway";
import { ImmersionApplicationGateway } from "src/core-logic/ports/ImmersionApplicationGateway";
import { ImmersionSearchGateway } from "src/core-logic/ports/ImmersionSearchGateway";
import { RomeAutocompleteGateway } from "src/core-logic/ports/RomeAutocompleteGateway";
import { createStore } from "src/core-logic/storeConfig/store";
import { AgencyGateway } from "src/domain/ports/AgencyGateway";
import { ENV } from "src/environmentVariables";
import { HttpAgencyGateway } from "src/infra/gateway/AgencyGateway/HttpAgencyGateway";
import { InMemoryAgencyGateway } from "src/infra/gateway/AgencyGateway/InMemoryAgencyGateway";

export const formEstablishmentGateway: FormEstablishmentGateway =
  ENV.gateway === "IN_MEMORY"
    ? new InMemoryFormEstablishmentGateway(["12345678901238"])
    : new HttpFormEstablishmentGateway();

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
  formEstablishmentGateway: FormEstablishmentGateway;
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
    formEstablishmentGateway,
    immersionApplicationGateway,
    immersionSearchGateway,
    romeAutocompleteGateway,
    minSearchResultsToPreventRefetch: 10,
  },
});
