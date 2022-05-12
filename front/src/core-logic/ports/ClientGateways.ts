import { EstablishmentGateway } from "./EstablishmentGateway";
import { NavigationGateway } from "./NavigationGateway";
import { EventGateway } from "./EventGateway";
import { SiretGatewayThroughBack } from "./SiretGatewayThroughBack";

export interface ClientGateways {
  siretGatewayThroughBack: SiretGatewayThroughBack;
  establishments: EstablishmentGateway;
  navigation: NavigationGateway;
  event: EventGateway;
}

export type ClientTestGateways = ClientGateways;
