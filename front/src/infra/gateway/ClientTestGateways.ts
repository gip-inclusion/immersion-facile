import { InMemoryEstablishmentGateway } from "src/core-logic/adapters/InMemoryEstablishmentGateway";
import { SimulatedSiretGatewayThroughBack } from "src/core-logic/adapters/SimulatedSiretGatewayThroughBack";
import { ClientGateways } from "src/core-logic/ports/ClientGateways";
import { InMemoryNavigationGateway } from "src/core-logic/adapters/InMemoryNavigationGateway";
import { InMemoryEventGateway } from "./EventGateway/InMemoryEventGateway";

export interface ClientTestGateways extends ClientGateways {
  siretGatewayThroughBack: SimulatedSiretGatewayThroughBack;
  navigation: InMemoryNavigationGateway;
  event: InMemoryEventGateway;
  establishments: InMemoryEstablishmentGateway;
}
