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
import { AgencyGateway } from "src/core-logic/ports/AgencyGateway";
import { ApiAdresseGateway } from "src/core-logic/ports/ApiAdresseGateway";
import { FeatureFlagsGateway } from "src/core-logic/ports/FeatureFlagsGateway";
import { FormEstablishmentGateway } from "src/core-logic/ports/FormEstablishmentGateway";
import { ImmersionApplicationGateway } from "src/core-logic/ports/ImmersionApplicationGateway";
import { ImmersionSearchGateway } from "src/core-logic/ports/ImmersionSearchGateway";
import { RomeAutocompleteGateway } from "src/core-logic/ports/RomeAutocompleteGateway";
import { ENV } from "src/environmentVariables";

export const formEstablishmentGateway: FormEstablishmentGateway =
  ENV.gateway === "HTTP"
    ? new HttpFormEstablishmentGateway()
    : new InMemoryFormEstablishmentGateway(["12345678901238"]);

export const immersionApplicationGateway: ImmersionApplicationGateway =
  ENV.gateway === "HTTP"
    ? new HttpImmersionApplicationGateway()
    : new InMemoryImmersionApplicationGateway();

export const immersionSearchGateway: ImmersionSearchGateway =
  ENV.gateway === "HTTP"
    ? new HttpImmersionSearchGateway()
    : new InMemoryImmersionSearchGateway();

export const apiAdresseGateway: ApiAdresseGateway =
  ENV.gateway === "HTTP"
    ? new HttpApiAdresseGateway()
    : new InMemoryApiAdresseGateway();

export const featureFlagsGateway: FeatureFlagsGateway =
  ENV.gateway === "HTTP"
    ? new HttpFeatureFlagGateway()
    : new InMemoryFeatureFlagGateway();

export const agencyGateway: AgencyGateway =
  ENV.gateway === "HTTP"
    ? new HttpAgencyGateway()
    : new InMemoryAgencyGateway();

export const romeAutocompleteGateway: RomeAutocompleteGateway =
  ENV.gateway === "HTTP"
    ? new HttpRomeAutocompleteGateway()
    : new InMemoryRomeAutocompleteGateway();
