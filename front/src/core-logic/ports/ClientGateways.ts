import { SimulatedSiretGatewayThroughBack } from "src/core-logic/adapters/SimulatedSiretGatewayThroughBack";
import { EstablishmentGateway } from "./EstablishmentGateway";
import { NavigationGateway } from "./NavigationGateway";
import { EventGateway } from "./EventGateway";

export interface ClientGateways {
  siretGatewayThroughBack: SimulatedSiretGatewayThroughBack;
  establishments: EstablishmentGateway;
  navigation: NavigationGateway;
  event: EventGateway;
}

export type ClientTestGateways = ClientGateways;
