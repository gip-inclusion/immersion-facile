import { InMemoryEstablishmentGateway } from "src/core-logic/adapters/InMemoryEstablishmentGateway";
import { InMemorySiretGatewayThroughBack } from "src/core-logic/adapters/InMemorySiretGatewayThroughBack";
import { ClientGateways } from "src/core-logic/ports/ClientGateways";
import { InMemoryNavigationGateway } from "../../core-logic/adapters/InMemoryNavigationGateway";
import { InMemoryEventGateway } from "./EventGateway/InMemoryEventGateway";

export interface ClientTestGateways extends ClientGateways {
  siretGatewayThroughBack: InMemorySiretGatewayThroughBack;
  navigation: InMemoryNavigationGateway;
  event: InMemoryEventGateway;
  establishments: InMemoryEstablishmentGateway;
}
