import { ApplicationEvent } from "../events/ApplicationEvent";

export interface EventGateway {
  onEvent(event: ApplicationEvent): Promise<void>;
}
