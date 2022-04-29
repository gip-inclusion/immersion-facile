import { SiretDto } from "shared/src/siret";
import { ApplicationEvent, EventType } from "../ApplicationEvent";

export class ModifyEstablishmentEvent extends ApplicationEvent {
  constructor(public siret: SiretDto) {
    super();
  }
  public eventType: EventType = "ESTABLISHMENT_MODIFICATION_REQUESTED";
}
