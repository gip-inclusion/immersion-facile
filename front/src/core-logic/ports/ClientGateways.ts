import { EstablishmentUiGateway } from "./EstablishmentUiGateway";
import { EstablishmentGateway } from "./EstablishmentGateway";
import { EventGateway } from "./EventGateway";

export interface ClientGateways {
  establishments: EstablishmentGateway;
  establishmentsUi: EstablishmentUiGateway;
  event:EventGateway
}


export interface ClientTestGateways extends ClientGateways {

}