import { HttpFormEstablishmentGateway } from "src/core-logic/adapters/HttpFormEstablishmentGateway";
import { HttpImmersionApplicationGateway } from "src/core-logic/adapters/HttpImmersionApplicationGateway";
import { HttpImmersionSearchGateway } from "src/core-logic/adapters/HttpImmersionSearchGateway";
import { InMemoryFormEstablishmentGateway } from "src/core-logic/adapters/InMemoryFormEstablishmentGateway";
import { InMemoryImmersionApplicationGateway } from "src/core-logic/adapters/InMemoryImmersionApplicationGateway";
import { InMemoryImmersionSearchGateway } from "src/core-logic/adapters/InMemoryImmersionSearchGateway";
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
    : new InMemoryImmersionApplicationGateway(ENV.featureFlags);

export const immersionSearchGateway: ImmersionSearchGateway =
  ENV.gateway === "HTTP"
    ? new HttpImmersionSearchGateway()
    : new InMemoryImmersionSearchGateway();
