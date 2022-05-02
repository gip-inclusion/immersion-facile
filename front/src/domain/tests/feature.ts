import { EventType } from "../events/ApplicationEvent";

export const feature = (eventType: EventType, clientScenarios: void[]) =>
  describe(`Feature - ${eventType}`, () => {
    clientScenarios.forEach((clientScenario) => clientScenario);
  });

export const featureRedux = (
  description: string,
  clientScenarios: void[],
): void => {
  describe(`Feature - ${description}`, () => {
    clientScenarios.forEach((clientScenario) => clientScenario);
  });
};
