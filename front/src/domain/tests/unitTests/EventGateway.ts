import { ApplicationEvent } from "src/domain/events/ApplicationEvent";
import { ClientApplication } from "../../../infra/application/ClientApplication";

export const whenTheEventIsSent =
  (event: ApplicationEvent) => (application: ClientApplication) => {
    it(`When the event ${event.eventType} occurs.`, () =>
      application.onEvent(event));
  };
