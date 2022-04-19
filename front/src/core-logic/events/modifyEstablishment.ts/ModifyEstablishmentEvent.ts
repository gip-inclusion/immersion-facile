import { SiretDto } from "src/shared/siret";
import { ApplicationEvent, EventType } from "../ApplicationEvent";

export class ModifyEstablishmentEvent extends ApplicationEvent {
  constructor(
    public siret: SiretDto
  ) {super()}
  public eventType: EventType = EventType.MODIFY_ESTABLISHMENT;
}
