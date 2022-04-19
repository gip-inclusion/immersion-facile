import { ApplicationEvent } from "src/core-logic/events/ApplicationEvent";
import { ClientApplication } from "../../../clientApplication/ClientApplication";

export const whenTheEventIsSent = (application:ClientApplication, event:ApplicationEvent) => {
  it(`When the event ${event.eventType} is sent on event gateway.`,()=>{
    return application.onEvent(event)
  })
}