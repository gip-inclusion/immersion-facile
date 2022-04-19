import { SiretDto } from "src/shared/siret";
import { ApplicationEvent, EventType } from "../ApplicationEvent";

export class VerifySiretEvent extends ApplicationEvent {
  constructor(
    public readonly siret:SiretDto
  ){super()}
  public eventType: EventType = EventType.VERIFY_SIRET;
}
