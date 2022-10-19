import { CustomClock } from "../adapters/secondary/core/ClockImplementations";
import { TestUuidGenerator } from "../adapters/secondary/core/UuidGeneratorImplementations";
import { makeCreateNewEvent } from "../domain/core/eventBus/EventBus";

export const makeTestCreateNewEvent = () => {
  const clock = new CustomClock();
  const uuidGenerator = new TestUuidGenerator();
  return makeCreateNewEvent({ clock, uuidGenerator });
};
