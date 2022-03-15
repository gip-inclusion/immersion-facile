import { spyOnTopic } from "../../_testBuilders/test.helpers";
import type { DomainEvent } from "../../domain/core/eventBus/events";
import { InMemoryEventBus } from "../../adapters/secondary/core/InMemoryEventBus";
import { ImmersionApplicationDtoBuilder } from "../../_testBuilders/ImmersionApplicationDtoBuilder";

const domainEvt: DomainEvent = {
  id: "anId",
  topic: "ImmersionApplicationSubmittedByBeneficiary",
  payload: new ImmersionApplicationDtoBuilder().build(),
  occurredAt: "a date",
};

describe("InMemoryEventBus", () => {
  let anEventBus: InMemoryEventBus;

  beforeEach(() => {
    anEventBus = new InMemoryEventBus();
  });

  describe("Publish to an existing topic", () => {
    it("Publishes to a new topic and check we have only one spyed", () => {
      const publishedEvents = spyOnTopic(
        anEventBus,
        "ImmersionApplicationSubmittedByBeneficiary",
      );
      anEventBus.publish(domainEvt);
      expect(publishedEvents).toHaveLength(1);
    });
  });

  it("Publish to the same topic and check that 2 subscribers get the message", () => {
    const eventsOnFirstHandler = spyOnTopic(
      anEventBus,
      "ImmersionApplicationSubmittedByBeneficiary",
    );

    const eventsOnSecondHandler = spyOnTopic(
      anEventBus,
      "ImmersionApplicationSubmittedByBeneficiary",
    );

    anEventBus.publish(domainEvt);

    expect(eventsOnFirstHandler).toHaveLength(1);
    expect(eventsOnFirstHandler[0]).toEqual(domainEvt);
    expect(eventsOnSecondHandler).toHaveLength(1);
    expect(eventsOnSecondHandler[0]).toEqual(domainEvt);
  });
});
