import { ConventionDtoBuilder } from "shared";
import {
  expectObjectsToMatch,
  expectTypeToMatchAndEqual,
  spyOnTopic,
} from "../../../_testBuilders/test.helpers";
import { createInMemoryUow } from "../../primary/config/uowConfig";
import { CustomClock } from "./ClockImplementations";
import { InMemoryEventBus } from "./InMemoryEventBus";
import { InMemoryOutboxRepository } from "./InMemoryOutboxRepository";
import { InMemoryUowPerformer } from "../InMemoryUowPerformer";
import type {
  DomainEvent,
  EventFailure,
} from "../../../domain/core/eventBus/events";

const domainEvt: DomainEvent = {
  id: "anId",
  topic: "ImmersionApplicationSubmittedByBeneficiary",
  payload: new ConventionDtoBuilder().build(),
  occurredAt: "a date",
  wasQuarantined: false,
  publications: [],
};

describe("InMemoryEventBus", () => {
  let anEventBus: InMemoryEventBus;
  let clock: CustomClock;
  let outboxRepository: InMemoryOutboxRepository;

  beforeEach(() => {
    clock = new CustomClock();
    const uow = createInMemoryUow();
    outboxRepository = uow.outboxRepository;
    const uowPerformer = new InMemoryUowPerformer(uow);
    anEventBus = new InMemoryEventBus(clock, uowPerformer);
  });

  describe("Publish to an existing topic", () => {
    it("Marks event as published even if no-one was subscribed to it", async () => {
      // Prepare
      const publishDate = new Date("2022-01-01");
      clock.setNextDate(publishDate);

      // Act
      await anEventBus.publish(domainEvt);

      // Assert
      expect(outboxRepository.events).toHaveLength(1);

      expectObjectsToMatch(outboxRepository.events[0], {
        ...domainEvt,
        wasQuarantined: false,
        publications: [
          { publishedAt: publishDate.toISOString(), failures: [] },
        ],
      });
    });

    it("Publishes to a new topic and check we have only one spyed event", async () => {
      // Prepare
      const publishDate = new Date("2022-01-01");
      clock.setNextDate(publishDate);
      const publishedEvents = spyOnTopic(
        anEventBus,
        "ImmersionApplicationSubmittedByBeneficiary",
        "subscription1",
      );

      // Act
      await anEventBus.publish(domainEvt);

      // Assert
      expect(publishedEvents).toHaveLength(1);
      expectObjectsToMatch(publishedEvents[0], domainEvt);
      expect(outboxRepository.events).toHaveLength(1);

      expectObjectsToMatch(outboxRepository.events[0], {
        ...domainEvt,
        wasQuarantined: false,
        publications: [
          { publishedAt: publishDate.toISOString(), failures: [] },
        ],
      });
    });
  });

  it("Publish to the same topic and check that 2 subscribers get the message", async () => {
    // Prepare
    const publishDate = new Date("2022-01-01");
    clock.setNextDate(publishDate);
    const eventsOnFirstHandler = spyOnTopic(
      anEventBus,
      "ImmersionApplicationSubmittedByBeneficiary",
      "subscription1",
    );
    const eventsOnSecondHandler = spyOnTopic(
      anEventBus,
      "ImmersionApplicationSubmittedByBeneficiary",
      "subscription2",
    );

    // Act
    await anEventBus.publish(domainEvt);

    // Assert
    expect(eventsOnFirstHandler).toHaveLength(1);
    expect(eventsOnFirstHandler[0]).toEqual(domainEvt);
    expect(eventsOnSecondHandler).toHaveLength(1);
    expect(eventsOnSecondHandler[0]).toEqual(domainEvt);

    expectTypeToMatchAndEqual(outboxRepository.events[0], {
      ...domainEvt,
      wasQuarantined: false,
      publications: [{ publishedAt: publishDate.toISOString(), failures: [] }],
    });
  });

  describe("when one of the handlers fails", () => {
    it("catch the error and flags the failing subscriber", async () => {
      // Prepare
      const publishDate = new Date("2022-01-01");
      clock.setNextDate(publishDate);
      const eventsOnFirstHandler = spyOnTopic(
        anEventBus,
        "ImmersionApplicationSubmittedByBeneficiary",
        "workingSubscription",
      );

      anEventBus.subscribe(
        "ImmersionApplicationSubmittedByBeneficiary",
        "failingSubscription",
        async (_) => {
          throw new Error("Failed");
        },
      );

      // Act
      await anEventBus.publish(domainEvt);

      // Assert
      const expectedEvent: DomainEvent = {
        ...domainEvt,
        wasQuarantined: false,
        publications: [],
      };

      expectTypeToMatchAndEqual(eventsOnFirstHandler, [expectedEvent]);

      expectObjectsToMatch(outboxRepository.events[0], {
        ...expectedEvent,
        publications: [
          {
            publishedAt: publishDate.toISOString(),
            failures: [
              { subscriptionId: "failingSubscription", errorMessage: "Failed" },
            ],
          },
        ],
      });
    });
  });

  describe("when republishing an already published event", () => {
    const initialPublishDate = new Date("2022-01-01");
    const failedSubscriptionId = "failedSubscription";
    const eventToRePublish: DomainEvent = {
      ...domainEvt,
      wasQuarantined: false,
      publications: [
        {
          publishedAt: initialPublishDate.toISOString(),
          failures: [
            {
              subscriptionId: failedSubscriptionId,
              errorMessage: "Initially Failed",
            },
          ],
        },
      ],
    };

    it("saves the new publications linked to the event", async () => {
      // Prepare
      const rePublishDate = new Date("2022-01-02");
      clock.setNextDate(rePublishDate);
      const eventsOnInitiallyFailedHandler = spyOnTopic(
        anEventBus,
        "ImmersionApplicationSubmittedByBeneficiary",
        failedSubscriptionId,
      );

      // Act
      await anEventBus.publish(eventToRePublish);

      // Assert
      const expectedEvent: DomainEvent = {
        ...domainEvt,
        wasQuarantined: false,
        publications: [
          {
            publishedAt: initialPublishDate.toISOString(),
            failures: [
              {
                subscriptionId: failedSubscriptionId,
                errorMessage: "Initially Failed",
              },
            ],
          },
          {
            publishedAt: rePublishDate.toISOString(),
            failures: [],
          },
        ],
      };

      expect(eventsOnInitiallyFailedHandler).toHaveLength(1);
      expectObjectsToMatch(eventsOnInitiallyFailedHandler[0], eventToRePublish);
      expectObjectsToMatch(outboxRepository.events[0], expectedEvent);
    });

    it("only re-executes the subscriptions that failed", async () => {
      // Prepare
      const rePublishDate = new Date("2022-01-02");
      clock.setNextDate(rePublishDate);
      const eventsOnFirstHandler = spyOnTopic(
        anEventBus,
        "ImmersionApplicationSubmittedByBeneficiary",
        "workingSubscription",
      );
      const eventsOnInitiallyFailedHandler = spyOnTopic(
        anEventBus,
        "ImmersionApplicationSubmittedByBeneficiary",
        failedSubscriptionId,
      );

      // Act
      await anEventBus.publish(eventToRePublish);

      // Assert
      const expectedEvent: DomainEvent = {
        ...eventToRePublish,
        wasQuarantined: false,
        publications: [
          ...eventToRePublish.publications,
          { publishedAt: rePublishDate.toISOString(), failures: [] },
        ],
      };

      expect(eventsOnFirstHandler).toHaveLength(0);
      expect(eventsOnInitiallyFailedHandler).toHaveLength(1);
      expectObjectsToMatch(eventsOnInitiallyFailedHandler[0], eventToRePublish);
      expectObjectsToMatch(outboxRepository.events[0], expectedEvent);
    });

    it("puts the event in quarantine if it fails at the 4th try", async () => {
      const failures: EventFailure[] = [
        {
          subscriptionId: failedSubscriptionId,
          errorMessage: "Failed",
        },
      ];
      const eventPublished3TimesAlready: DomainEvent = {
        ...domainEvt,
        wasQuarantined: false,
        publications: [
          {
            publishedAt: new Date("2022-01-01").toISOString(),
            failures,
          },
          {
            publishedAt: new Date("2022-01-02").toISOString(),
            failures,
          },
          {
            publishedAt: new Date("2022-01-03").toISOString(),
            failures,
          },
        ],
      };

      const rePublishDate = new Date("2022-01-04");
      clock.setNextDate(rePublishDate);
      anEventBus.subscribe(
        "ImmersionApplicationSubmittedByBeneficiary",
        failedSubscriptionId,
        () => {
          throw new Error("4th failure");
        },
      );

      // Act
      await anEventBus.publish(eventPublished3TimesAlready);

      // Assert
      const expectedEvent: DomainEvent = {
        ...domainEvt,
        wasQuarantined: true,
        publications: [
          ...eventPublished3TimesAlready.publications,
          {
            publishedAt: rePublishDate.toISOString(),
            failures: [
              {
                subscriptionId: failedSubscriptionId,
                errorMessage: "4th failure",
              },
            ],
          },
        ],
      };

      expect(outboxRepository.events).toHaveLength(1);
      expectObjectsToMatch(outboxRepository.events[0], expectedEvent);
    });
  });
});
