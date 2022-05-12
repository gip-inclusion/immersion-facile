import { InMemoryEstablishmentGateway } from "src/core-logic/adapters/InMemoryEstablishmentGateway";
import { InMemorySiretGatewayThroughBack } from "src/core-logic/adapters/InMemorySiretGatewayThroughBack";
import { ClientGateways } from "src/core-logic/ports/ClientGateways";
import { InMemoryEstablishmentUiGateway } from "./EstablishmentUiGateway/InMemoryEstablishmentUiGateway";
import { InMemoryEventGateway } from "./EventGateway/InMemoryEventGateway";

export interface ClientTestGateways extends ClientGateways {
  siretGatewayThroughBack: InMemorySiretGatewayThroughBack;
  navigation: InMemoryEstablishmentUiGateway;
  event: InMemoryEventGateway;
  establishments: InMemoryEstablishmentGateway;
}
