import { SiretDto } from "shared/src/siret";
import { ApplicationEvent, EventType } from "../ApplicationEvent";

export class VerifySiretEvent extends ApplicationEvent {
  constructor(public readonly siret: SiretDto) {
    super();
  }
  public eventType: EventType = "SIRET_VERIFICATION_REQUESTED";
}
