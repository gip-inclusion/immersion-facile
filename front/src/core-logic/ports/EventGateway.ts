import { ApplicationEvent } from "../../domain/events/ApplicationEvent";

export interface EventGateway {
  onEvent(event: ApplicationEvent): Promise<void>;
}
