import { ApplicationEvent } from "../../../core-logic/events/ApplicationEvent";
import { ApplicationPrimaryController } from "../../../core-logic/ports/primaryController/ApplicationPrimaryController";

export class InMemoryEventGateway {
  constructor(
    private applicationPrimaryController: ApplicationPrimaryController,
  ) {}
  onEvent(event: ApplicationEvent): Promise<void> {
    return this.applicationPrimaryController.onEvent(event);
  }
}
