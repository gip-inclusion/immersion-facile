import { addMilliseconds, subYears } from "date-fns";
import { expectToEqual } from "shared";
import { CustomTimeGateway } from "../../time-gateway/adapters/CustomTimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../unit-of-work/adapters/InMemoryUowPerformer";
import { UuidV4Generator } from "../../uuid-generator/adapters/UuidGeneratorImplementations";
import {
  type CreateNewEventParams,
  makeCreateNewEvent,
} from "../ports/EventBus";
import { type DeleteEvents, makeDeleteEvents } from "./DeleteEvents";

describe("DeleteEvents", () => {
  const timeGateway = new CustomTimeGateway(new Date());
  const createNewEvent = makeCreateNewEvent({
    timeGateway: timeGateway,
    uuidGenerator: new UuidV4Generator(),
  });
  const eventParams: CreateNewEventParams<"ExchangeAddedToDiscussion"> = {
    topic: "ExchangeAddedToDiscussion",
    payload: { discussionId: "", siret: "" },
  };

  const eventOccuredOneYearAgo = createNewEvent({
    ...eventParams,
    occurredAt: subYears(timeGateway.now(), 1).toISOString(),
  });
  const eventCreatedAlmostOneYearAgo = createNewEvent({
    ...eventParams,
    occurredAt: addMilliseconds(
      subYears(timeGateway.now(), 1),
      1,
    ).toISOString(),
  });
  const eventOccuredThirtyYearsAgo = createNewEvent({
    ...eventParams,
    occurredAt: subYears(timeGateway.now(), 30).toISOString(),
  });

  let deleteEvents: DeleteEvents;
  let uow: InMemoryUnitOfWork;

  beforeEach(() => {
    uow = createInMemoryUow();
    deleteEvents = makeDeleteEvents({
      uowPerformer: new InMemoryUowPerformer(uow),
      deps: { timeGateway },
    });
  });

  it("do nothing when no events to delete", async () => {
    uow.outboxRepository.events = [];
    expectToEqual(await deleteEvents.execute({ limit: 10 }), {
      deletedEvents: 0,
    });
    expectToEqual(uow.outboxRepository.events, []);
  });

  it("do nothing when events date are less than one year", async () => {
    uow.outboxRepository.events = [eventCreatedAlmostOneYearAgo];

    expectToEqual(await deleteEvents.execute({ limit: 10 }), {
      deletedEvents: 0,
    });

    expectToEqual(uow.outboxRepository.events, [eventCreatedAlmostOneYearAgo]);
  });

  it("delete events when they occured at least one year ago", async () => {
    uow.outboxRepository.events = [
      eventOccuredOneYearAgo,
      eventOccuredThirtyYearsAgo,
    ];

    expectToEqual(await deleteEvents.execute({ limit: 10 }), {
      deletedEvents: 2,
    });

    expectToEqual(uow.outboxRepository.events, []);
  });

  it("delete oldest events first and apply limit", async () => {
    uow.outboxRepository.events = [
      eventOccuredThirtyYearsAgo,
      eventOccuredOneYearAgo,
    ];

    expectToEqual(await deleteEvents.execute({ limit: 1 }), {
      deletedEvents: 1,
    });

    expectToEqual(uow.outboxRepository.events, [eventOccuredOneYearAgo]);
  });
});
