import { HttpApiAdresseGateway } from "src/core-logic/adapters/HttpApiAdresseGateway";
import { HttpFormEstablishmentGateway } from "src/core-logic/adapters/HttpFormEstablishmentGateway";
import { HttpImmersionApplicationGateway } from "src/core-logic/adapters/HttpImmersionApplicationGateway";
import { HttpImmersionSearchGateway } from "src/core-logic/adapters/HttpImmersionSearchGateway";
import { InMemoryApiAdresseGateway } from "src/core-logic/adapters/InMemoryApiAdresseGateway";
import { InMemoryFeatureFlagGateway } from "src/core-logic/adapters/InMemoryFeatureFlagGateway";
import { InMemoryFormEstablishmentGateway } from "src/core-logic/adapters/InMemoryFormEstablishmentGateway";
import { InMemoryImmersionApplicationGateway } from "src/core-logic/adapters/InMemoryImmersionApplicationGateway";
import { InMemoryImmersionSearchGateway } from "src/core-logic/adapters/InMemoryImmersionSearchGateway";
import { ApiAdresseGateway } from "src/core-logic/ports/ApiAdresseGateway";
import { FeatureFlagsGateway } from "src/core-logic/ports/FeatureFlagsGateway";
import { FormEstablishmentGateway } from "src/core-logic/ports/FormEstablishmentGateway";
import { ImmersionApplicationGateway } from "src/core-logic/ports/ImmersionApplicationGateway";
import { ImmersionSearchGateway } from "src/core-logic/ports/ImmersionSearchGateway";
import { ENV } from "src/environmentVariables";

export const formEstablishmentGateway: FormEstablishmentGateway =
  ENV.gateway === "HTTP"
    ? new HttpFormEstablishmentGateway()
    : new InMemoryFormEstablishmentGateway();

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
  new InMemoryFeatureFlagGateway();
