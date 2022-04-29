import { EventType } from "../events/ApplicationEvent";

export const feature = (eventType: EventType, clientScenarios: void[]) =>
  describe(`Feature - ${eventType}`, () => {
    clientScenarios.forEach((clientScenario) => clientScenario);
  });
