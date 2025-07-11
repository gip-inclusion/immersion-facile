import { subMonths } from "date-fns";
import { DiscussionBuilder, expectToEqual } from "shared";
import { makeCreateNewEvent } from "../../../core/events/ports/EventBus";
import { makeSaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { CustomTimeGateway } from "../../../core/time-gateway/adapters/CustomTimeGateway";
import type { TimeGateway } from "../../../core/time-gateway/ports/TimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { TestUuidGenerator } from "../../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import {
  type GetObsoleteDiscussionsAndEmitDeprecatedEvents,
  makeGetObsoleteDiscussionsAndEmitDeprecatedEvent,
} from "./GetObsoleteDiscussionsAndEmitDeprecatedEvents";

describe("GetObsoleteDiscussionsAndEmitDeprecatedEvents", () => {
  let timeGateway: TimeGateway;
  let uow: InMemoryUnitOfWork;
  let getObsoleteDiscussionsAndEmitDeprecatedEvents: GetObsoleteDiscussionsAndEmitDeprecatedEvents;
  let uuidGenerator: TestUuidGenerator;
  beforeEach(() => {
    timeGateway = new CustomTimeGateway();
    uow = createInMemoryUow();
    uuidGenerator = new TestUuidGenerator();
    const createNewEvent = makeCreateNewEvent({
      timeGateway,
      uuidGenerator,
    });
    getObsoleteDiscussionsAndEmitDeprecatedEvents =
      makeGetObsoleteDiscussionsAndEmitDeprecatedEvent({
        uowPerformer: new InMemoryUowPerformer(uow),
        deps: {
          timeGateway,
          saveNotificationAndRelatedEvent: makeSaveNotificationAndRelatedEvent(
            uuidGenerator,
            timeGateway,
          ),
          createNewEvent,
        },
      });
  });

  it("should get obsolete discussions and emit deprecated events", async () => {
    const now = timeGateway.now();
    const discussionFrom2YearsAgoWithoutExchangesResponse =
      new DiscussionBuilder()
        .withSiret("11112222333344")
        .withId("aaaaad2c-6f02-11ec-90d6-0242ac120003")
        .withCreatedAt(subMonths(now, 24))
        .withExchanges([
          {
            subject: "Mise en relation initiale",
            message:
              "Bonjour, je souhaite m'informer sur l'immersion professionnelle",
            recipient: "establishment",
            sentAt: subMonths(now, 24).toISOString(),
            sender: "potentialBeneficiary",
            attachments: [],
          },
        ])
        .build();

    const discussionFrom1YearAgoWithExchangesResponse = new DiscussionBuilder()
      .withSiret("11112222333344")
      .withId("aaaaad2c-6f02-11ec-90d6-0242ac120004")
      .withCreatedAt(subMonths(now, 12))
      .withExchanges([
        {
          subject: "Mise en relation initiale",
          message:
            "Bonjour, je souhaite m'informer sur l'immersion professionnelle",
          recipient: "potentialBeneficiary",
          sentAt: subMonths(now, 12).toISOString(),
          sender: "establishment",
          attachments: [],
        },
        {
          subject: "Réponse de l'entreprise",
          message: "Super, je vais vous envoyer un mail avec les informations",
          recipient: "potentialBeneficiary",
          sentAt: subMonths(now, 12).toISOString(),
          sender: "establishment",
          attachments: [],
        },
      ])
      .build();

    const discussionFrom6MonthsAgoWithoutExchangesResponse =
      new DiscussionBuilder()
        .withSiret("11112222333344")
        .withId("aaaaad2c-6f02-11ec-90d6-0242ac120005")
        .withCreatedAt(subMonths(now, 6))
        .withExchanges([
          {
            subject: "Mise en relation initiale",
            message:
              "Bonjour, je souhaite m'informer sur l'immersion professionnelle",
            recipient: "establishment",
            sentAt: subMonths(now, 6).toISOString(),
            sender: "potentialBeneficiary",
            attachments: [],
          },
        ])
        .build();

    const discussionFrom4MonthsAgoWithExchangesResponse =
      new DiscussionBuilder()
        .withSiret("11112222333344")
        .withId("aaaaad2c-6f02-11ec-90d6-0242ac120006")
        .withCreatedAt(subMonths(now, 4))
        .withExchanges([
          {
            subject: "Mise en relation initiale",
            message:
              "Bonjour, je souhaite m'informer sur l'immersion professionnelle",
            recipient: "establishment",
            sentAt: subMonths(now, 4).toISOString(),
            sender: "potentialBeneficiary",
            attachments: [],
          },
          {
            subject: "Réponse de l'entreprise",
            message:
              "Super, je vais vous envoyer un mail avec les informations",
            recipient: "potentialBeneficiary",
            sentAt: subMonths(now, 4).toISOString(),
            sender: "establishment",
            attachments: [],
          },
        ])
        .build();

    const discussionFrom2MonthsAgo = new DiscussionBuilder()
      .withSiret("11112222333344")
      .withId("aaaaad2c-6f02-11ec-90d6-0242ac120007")
      .withCreatedAt(subMonths(now, 2))
      .build();

    uow.discussionRepository.discussions = [
      discussionFrom2YearsAgoWithoutExchangesResponse,
      discussionFrom1YearAgoWithExchangesResponse,
      discussionFrom6MonthsAgoWithoutExchangesResponse,
      discussionFrom4MonthsAgoWithExchangesResponse,
      discussionFrom2MonthsAgo,
    ];

    const expectedEventIds = ["event-id-1", "event-id-2"];
    uuidGenerator.setNextUuids(expectedEventIds);

    const expectedObsoleteDiscussionIds = [
      discussionFrom2YearsAgoWithoutExchangesResponse.id,
      discussionFrom6MonthsAgoWithoutExchangesResponse.id,
    ];

    const { numberOfObsoleteDiscussions } =
      await getObsoleteDiscussionsAndEmitDeprecatedEvents.execute();

    expectToEqual(
      numberOfObsoleteDiscussions,
      expectedObsoleteDiscussionIds.length,
    );

    expectToEqual(
      uow.outboxRepository.events,
      expectedObsoleteDiscussionIds.map((discussionId, index) => ({
        topic: "DiscussionMarkedAsDeprecated" as const,
        payload: {
          discussionId,
          triggeredBy: {
            kind: "crawler" as const,
          },
        },
        id: expectedEventIds[index],
        occurredAt: expect.any(String),
        publications: [],
        wasQuarantined: false,
        status: "never-published" as const,
      })),
    );
  });

  it("should not emit events if there are no obsolete discussions", async () => {
    const now = timeGateway.now();

    const discussionFrom1YearAgoWithExchangesResponse = new DiscussionBuilder()
      .withSiret("11112222333344")
      .withId("aaaaad2c-6f02-11ec-90d6-0242ac120004")
      .withCreatedAt(subMonths(now, 12))
      .withExchanges([
        {
          subject: "Mise en relation initiale",
          message:
            "Bonjour, je souhaite m'informer sur l'immersion professionnelle",
          recipient: "potentialBeneficiary",
          sentAt: subMonths(now, 12).toISOString(),
          sender: "establishment",
          attachments: [],
        },
        {
          subject: "Réponse de l'entreprise",
          message: "Super, je vais vous envoyer un mail avec les informations",
          recipient: "potentialBeneficiary",
          sentAt: subMonths(now, 12).toISOString(),
          sender: "establishment",
          attachments: [],
        },
      ])
      .build();

    const discussionFrom4MonthsAgoWithExchangesResponse =
      new DiscussionBuilder()
        .withSiret("11112222333344")
        .withId("aaaaad2c-6f02-11ec-90d6-0242ac120006")
        .withCreatedAt(subMonths(now, 4))
        .withExchanges([
          {
            subject: "Mise en relation initiale",
            message:
              "Bonjour, je souhaite m'informer sur l'immersion professionnelle",
            recipient: "establishment",
            sentAt: subMonths(now, 4).toISOString(),
            sender: "potentialBeneficiary",
            attachments: [],
          },
          {
            subject: "Réponse de l'entreprise",
            message:
              "Super, je vais vous envoyer un mail avec les informations",
            recipient: "potentialBeneficiary",
            sentAt: subMonths(now, 4).toISOString(),
            sender: "establishment",
            attachments: [],
          },
        ])
        .build();

    uow.discussionRepository.discussions = [
      discussionFrom1YearAgoWithExchangesResponse,
      discussionFrom4MonthsAgoWithExchangesResponse,
    ];

    const { numberOfObsoleteDiscussions } =
      await getObsoleteDiscussionsAndEmitDeprecatedEvents.execute();

    expectToEqual(numberOfObsoleteDiscussions, 0);
    expectToEqual(uow.outboxRepository.events, []);
  });
});
