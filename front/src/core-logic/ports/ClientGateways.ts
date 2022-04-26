import { EstablishmentUiGateway } from "./EstablishmentUiGateway";
import { EstablishmentGateway } from "./EstablishmentGateway";
import { EventGateway } from "./EventGateway";
import { ImmersionApplicationGateway } from "./ImmersionApplicationGateway";

export interface ClientGateways {
  immersionApplication: ImmersionApplicationGateway;
  establishments: EstablishmentGateway;
  establishmentsUi: EstablishmentUiGateway;
  event: EventGateway;
}

export type ClientTestGateways = ClientGateways;
