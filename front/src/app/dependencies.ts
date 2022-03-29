import { HttpAgencyGateway } from "src/core-logic/adapters/HttpAgencyGateway";
import { HttpApiAdresseGateway } from "src/core-logic/adapters/HttpApiAdresseGateway";
import { HttpFeatureFlagGateway } from "src/core-logic/adapters/HttpFeatureFlagGateway";
import { HttpFormEstablishmentGateway } from "src/core-logic/adapters/HttpFormEstablishmentGateway";
import { HttpImmersionApplicationGateway } from "src/core-logic/adapters/HttpImmersionApplicationGateway";
import { HttpImmersionSearchGateway } from "src/core-logic/adapters/HttpImmersionSearchGateway";
import { HttpRomeAutocompleteGateway } from "src/core-logic/adapters/HttpRomeAutocompleteGateway";
import { InMemoryAgencyGateway } from "src/core-logic/adapters/InMemoryAgencyGateway";
import { InMemoryApiAdresseGateway } from "src/core-logic/adapters/InMemoryApiAdresseGateway";
import { InMemoryFeatureFlagGateway } from "src/core-logic/adapters/InMemoryFeatureFlagGateway";
import { InMemoryFormEstablishmentGateway } from "src/core-logic/adapters/InMemoryFormEstablishmentGateway";
import { InMemoryImmersionApplicationGateway } from "src/core-logic/adapters/InMemoryImmersionApplicationGateway";
import { InMemoryImmersionSearchGateway } from "src/core-logic/adapters/InMemoryImmersionSearchGateway";
import { InMemoryRomeAutocompleteGateway } from "src/core-logic/adapters/InMemoryRomeAutocompleteGateway";
import { createSearchEpic } from "src/core-logic/epics/search.epic";
import { AgencyGateway } from "src/core-logic/ports/AgencyGateway";
import { ApiAdresseGateway } from "src/core-logic/ports/ApiAdresseGateway";
import { FeatureFlagsGateway } from "src/core-logic/ports/FeatureFlagsGateway";
import { FormEstablishmentGateway } from "src/core-logic/ports/FormEstablishmentGateway";
import { ImmersionApplicationGateway } from "src/core-logic/ports/ImmersionApplicationGateway";
import { ImmersionSearchGateway } from "src/core-logic/ports/ImmersionSearchGateway";
import { RomeAutocompleteGateway } from "src/core-logic/ports/RomeAutocompleteGateway";
import { ENV } from "src/environmentVariables";

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
    ? new InMemoryImmersionSearchGateway()
    : new HttpImmersionSearchGateway();

export const apiAdresseGateway: ApiAdresseGateway =
  ENV.gateway === "IN_MEMORY"
    ? new InMemoryApiAdresseGateway()
    : new HttpApiAdresseGateway();

export const featureFlagsGateway: FeatureFlagsGateway =
  ENV.gateway === "IN_MEMORY"
    ? new InMemoryFeatureFlagGateway()
    : new HttpFeatureFlagGateway();

export const agencyGateway: AgencyGateway =
  ENV.gateway === "IN_MEMORY"
    ? new InMemoryAgencyGateway()
    : new HttpAgencyGateway();

export const romeAutocompleteGateway: RomeAutocompleteGateway =
  ENV.gateway === "IN_MEMORY"
    ? new InMemoryRomeAutocompleteGateway()
    : new HttpRomeAutocompleteGateway();

export const searchEpic = createSearchEpic({ immersionSearchGateway });
