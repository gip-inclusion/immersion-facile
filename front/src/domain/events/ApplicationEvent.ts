export abstract class ApplicationEvent {
  public abstract readonly eventType: EventType;
}
export enum EventType {
  VERIFY_SIRET = "VERIFY_SIRET",
  MODIFY_ESTABLISHMENT = "MODIFY_ESTABLISHMENT",
}
