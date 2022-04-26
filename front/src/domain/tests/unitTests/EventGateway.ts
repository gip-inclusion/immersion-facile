import { ApplicationEvent } from "src/domain/events/ApplicationEvent";
import { ClientApplication } from "../../../infra/application/ClientApplication";

export const whenTheEventIsSent = (
  application: ClientApplication,
  event: ApplicationEvent,
) => {
  it(`When the event ${event.eventType} is sent on event gateway.`, () =>
    application.onEvent(event));
};
