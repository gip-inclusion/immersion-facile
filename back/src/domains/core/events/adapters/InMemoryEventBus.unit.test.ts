import { ConventionDtoBuilder, expectArraysToMatch } from "shared";
import { CustomTimeGateway } from "../../time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../unit-of-work/adapters/createInMemoryUow";
import type {
  DomainEvent,
  DomainTopic,
  EventFailure,
  EventPublication,
} from "../events";
import { EventBus } from "../ports/EventBus";
import { InMemoryEventBus, getLastPublication } from "./InMemoryEventBus";

const domainEvt: DomainEvent = {
  id: "anId",
  topic: "ConventionSubmittedByBeneficiary",
  payload: {
    convention: new ConventionDtoBuilder().build(),
    triggeredBy: undefined,
  },
  occurredAt: "a date",
  wasQuarantined: false,
  status: "never-published",
  publications: [],
};

describe("InMemoryEventBus", () => {
  let eventBus: InMemoryEventBus;
  let timeGateway: CustomTimeGateway;
  let uow: InMemoryUnitOfWork;

  beforeEach(() => {
    timeGateway = new CustomTimeGateway();
    uow = createInMemoryUow();
    eventBus = new InMemoryEventBus(timeGateway, new InMemoryUowPerformer(uow));
  });

  describe("Publish to an existing topic", () => {
    it("Marks event as published even if no-one was subscribed to it", async () => {
      // Prepare
      const publishDate = new Date("2022-01-01");
      timeGateway.setNextDate(publishDate);

      // Act
      await eventBus.publish(domainEvt);

      // Assert
      expectArraysToMatch(uow.outboxRepository.events, [
        {
          ...domainEvt,
          wasQuarantined: false,
          publications: [
            { publishedAt: publishDate.toISOString(), failures: [] },
          ],
          status: "published",
        },
      ]);
    });

    it("Publishes to a new topic and check we have only one spyed event", async () => {
      // Prepare
      const publishDate = new Date("2022-01-01");
      timeGateway.setNextDate(publishDate);
      const publishedEvents = spyOnTopic(
        eventBus,
        "ConventionSubmittedByBeneficiary",
        "subscription1",
      );

      // Act
      await eventBus.publish(domainEvt);

      // Assert
      expectArraysToMatch(publishedEvents, [domainEvt]);
      expectArraysToMatch(uow.outboxRepository.events, [
        {
          ...domainEvt,
          wasQuarantined: false,
          publications: [
            { publishedAt: publishDate.toISOString(), failures: [] },
          ],
          status: "published",
        },
      ]);
    });
  });

  it("Publish to the same topic and check that 2 subscribers get the message", async () => {
    // Prepare
    const publishDate = new Date("2022-01-01");
    timeGateway.setNextDate(publishDate);
    const eventsOnFirstHandler = spyOnTopic(
      eventBus,
      "ConventionSubmittedByBeneficiary",
      "subscription1",
    );
    const eventsOnSecondHandler = spyOnTopic(
      eventBus,
      "ConventionSubmittedByBeneficiary",
      "subscription2",
    );

    // Act
    await eventBus.publish(domainEvt);

    // Assert
    expectArraysToMatch(eventsOnFirstHandler, [domainEvt]);
    expectArraysToMatch(eventsOnSecondHandler, [domainEvt]);
    expectArraysToMatch(uow.outboxRepository.events, [
      {
        ...domainEvt,
        wasQuarantined: false,
        publications: [
          { publishedAt: publishDate.toISOString(), failures: [] },
        ],
        status: "published",
      },
    ]);
  });

  describe("when one of the handlers fails", () => {
    it("catch the error and flags the failing subscriber", async () => {
      // Prepare
      const publishDate = new Date("2022-01-01");
      timeGateway.setNextDate(publishDate);
      const eventsOnFirstHandler = spyOnTopic(
        eventBus,
        "ConventionSubmittedByBeneficiary",
        "workingSubscription",
      );

      eventBus.subscribe(
        "ConventionSubmittedByBeneficiary",
        "failingSubscription",
        async (_) => {
          throw new Error("Failed");
        },
      );

      // Act
      await eventBus.publish(domainEvt);

      // Assert
      const expectedEvent: DomainEvent = {
        ...domainEvt,
        wasQuarantined: false,
        publications: [],
        status: "never-published",
      };

      expectArraysToMatch(eventsOnFirstHandler, [expectedEvent]);
      expectArraysToMatch(uow.outboxRepository.events, [
        {
          ...expectedEvent,
          publications: [
            {
              publishedAt: publishDate.toISOString(),
              failures: [
                {
                  subscriptionId: "failingSubscription",
                  errorMessage: "Failed",
                },
              ],
            },
          ],
          status: "failed-but-will-retry",
        },
      ]);
    });
  });

  describe("when republishing an already published event that has failed", () => {
    const initialPublishDate = new Date("2022-01-01");
    const failedSubscriptionId = "failedSubscription";
    const eventToRePublish: DomainEvent = {
      ...domainEvt,
      wasQuarantined: false,
      status: "failed-but-will-retry",
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
      timeGateway.setNextDate(rePublishDate);
      const eventsOnInitiallyFailedHandler = spyOnTopic(
        eventBus,
        "ConventionSubmittedByBeneficiary",
        failedSubscriptionId,
      );

      // Act
      await eventBus.publish(eventToRePublish);

      // Assert
      expectArraysToMatch(eventsOnInitiallyFailedHandler, [eventToRePublish]);
      expectArraysToMatch(uow.outboxRepository.events, [
        {
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
          status: "published",
        },
      ]);
    });

    it("only re-executes the subscriptions that failed", async () => {
      // Prepare
      const rePublishDate = new Date("2022-01-02");
      timeGateway.setNextDate(rePublishDate);
      const eventsOnFirstHandler = spyOnTopic(
        eventBus,
        "ConventionSubmittedByBeneficiary",
        "workingSubscription",
      );
      const eventsOnInitiallyFailedHandler = spyOnTopic(
        eventBus,
        "ConventionSubmittedByBeneficiary",
        failedSubscriptionId,
      );

      // Act
      await eventBus.publish(eventToRePublish);

      // Assert
      expectArraysToMatch(eventsOnFirstHandler, []);
      expectArraysToMatch(eventsOnInitiallyFailedHandler, [eventToRePublish]);
      expectArraysToMatch(uow.outboxRepository.events, [
        {
          ...eventToRePublish,
          wasQuarantined: false,
          publications: [
            ...eventToRePublish.publications,
            { publishedAt: rePublishDate.toISOString(), failures: [] },
          ],
          status: "published",
        },
      ]);
    });

    it("does the work on the last publications even if it is not ordered in event publication", async () => {
      // Prepare
      const publications: EventPublication[] = [
        {
          publishedAt: new Date("2021-01-01").toISOString(),
          failures: [
            {
              errorMessage: "Initially Failed",
              subscriptionId: failedSubscriptionId,
            },
          ],
        },
        {
          publishedAt: new Date("2022-01-02").toISOString(),
          failures: [
            {
              errorMessage: "Newly Failed",
              subscriptionId: failedSubscriptionId,
            },
          ],
        },
        { publishedAt: new Date("2022-01-01").toISOString(), failures: [] },
      ];

      const publishedEventWithNotOrderedPublications: DomainEvent = {
        ...eventToRePublish,
        wasQuarantined: false,
        publications,
        status: "published",
      };
      const eventsOnInitiallyFailedHandler = spyOnTopic(
        eventBus,
        "ConventionSubmittedByBeneficiary",
        failedSubscriptionId,
      );

      // Act
      const rePublishDate = new Date("2022-02-03");
      timeGateway.setNextDate(rePublishDate);
      await eventBus.publish(publishedEventWithNotOrderedPublications);

      // Assert
      expectArraysToMatch(eventsOnInitiallyFailedHandler, [
        publishedEventWithNotOrderedPublications,
      ]);
      expectArraysToMatch(uow.outboxRepository.events, [
        {
          ...eventToRePublish,
          wasQuarantined: false,
          publications: [
            ...publications,
            { publishedAt: rePublishDate.toISOString(), failures: [] },
          ],
          status: "published",
        },
      ]);
    });

    it("puts the event in quarantine if it fails at the 4th try", async () => {
      // Prepare
      const failures: EventFailure[] = [
        {
          subscriptionId: failedSubscriptionId,
          errorMessage: "Failed",
        },
      ];
      const eventPublished3TimesAlready: DomainEvent = {
        ...domainEvt,
        wasQuarantined: false,
        status: "failed-but-will-retry",
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
      timeGateway.setNextDate(rePublishDate);
      eventBus.subscribe(
        "ConventionSubmittedByBeneficiary",
        failedSubscriptionId,
        () => {
          throw new Error("4th failure");
        },
      );

      // Act
      await eventBus.publish(eventPublished3TimesAlready);

      // Assert
      expectArraysToMatch(uow.outboxRepository.events, [
        {
          ...domainEvt,
          wasQuarantined: true,
          status: "failed-to-many-times",
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
        },
      ]);
    });
  });

  describe("when forcing an event to republish", () => {
    it("republishes the event and executes all the subscriptions (even if some have succeeded)", async () => {
      // Prepare
      const initialPublishDate = new Date("2022-01-01");
      const eventToRePublish: DomainEvent = {
        ...domainEvt,
        wasQuarantined: false,
        status: "to-republish",
        publications: [
          {
            publishedAt: initialPublishDate.toISOString(),
            failures: [],
          },
        ],
      };
      const rePublishDate = new Date("2022-02-02");
      timeGateway.setNextDate(rePublishDate);
      const eventsOnFirstHandler = spyOnTopic(
        eventBus,
        "ConventionSubmittedByBeneficiary",
        "workingSubscription",
      );

      expectArraysToMatch(eventsOnFirstHandler, []);

      // Act
      await eventBus.publish(eventToRePublish);

      // Assert
      expectArraysToMatch(eventsOnFirstHandler, [eventToRePublish]);
      expectArraysToMatch(uow.outboxRepository.events, [
        {
          ...eventToRePublish,
          status: "published",
          publications: [
            ...eventToRePublish.publications,
            { publishedAt: rePublishDate.toISOString(), failures: [] },
          ],
        },
      ]);
    });
  });

  describe("getLastPublication", () => {
    it("get only the last publication", () => {
      const failedSubscriptionId = "failedSubscription";
      const eventToRePublish: DomainEvent = {
        ...domainEvt,
        wasQuarantined: false,
        status: "failed-but-will-retry",
        publications: [
          {
            publishedAt: new Date("2021-01-01").toISOString(),
            failures: [
              {
                errorMessage: "Initially Failed",
                subscriptionId: failedSubscriptionId,
              },
            ],
          },
          {
            publishedAt: new Date("2022-01-02").toISOString(),
            failures: [
              {
                errorMessage: "Newly Failed",
                subscriptionId: failedSubscriptionId,
              },
            ],
          },
          { publishedAt: new Date("2022-01-01").toISOString(), failures: [] },
        ],
      };

      const lastPublication = getLastPublication(eventToRePublish);

      expect(lastPublication?.publishedAt).toBe("2022-01-02T00:00:00.000Z");
    });
  });
});

const spyOnTopic = (
  eventBus: EventBus,
  topic: DomainTopic,
  subscriptionId: string,
): DomainEvent[] => {
  const publishedEvents: DomainEvent[] = [];
  //eslint-disable-next-line @typescript-eslint/require-await
  eventBus.subscribe(topic, subscriptionId, async (event) => {
    publishedEvents.push(event);
  });
  return publishedEvents;
};
