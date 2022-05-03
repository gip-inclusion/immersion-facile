import { EstablishmentGateway } from "./EstablishmentGateway";
import { EstablishmentUiGateway } from "./EstablishmentUiGateway";
import { EventGateway } from "./EventGateway";
import { SiretGatewayThroughBack } from "./SiretGatewayThroughBack";

export interface ClientGateways {
  siretGatewayThroughBack: SiretGatewayThroughBack;
  establishments: EstablishmentGateway;
  establishmentsUi: EstablishmentUiGateway;
  event: EventGateway;
}

export type ClientTestGateways = ClientGateways;
