export abstract class ApplicationEvent {
  public abstract readonly eventType: EventType;
}
export type EventType =
  | "SIRET_VERIFICATION_REQUESTED"
  | "ESTABLISHMENT_MODIFICATION_REQUEST";
