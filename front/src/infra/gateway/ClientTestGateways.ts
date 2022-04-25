import { InMemoryEstablishmentGateway } from "src/core-logic/adapters/InMemoryEstablishmentGateway";
import { ClientGateways } from "src/core-logic/ports/ClientGateways";
import { InMemoryEstablishmentUiGateway } from "src/infra/gateway/EstablishmentUiGateway.ts/InMemoryEstablishmentUiGaetway";
import { InMemoryEventGateway } from "./EventGateway/InMemoryEventGateway";

export interface ClientTestGateways extends ClientGateways {
  establishmentsUi: InMemoryEstablishmentUiGateway;
  event: InMemoryEventGateway;
  establishments: InMemoryEstablishmentGateway;
}
