import { addBusinessDays, differenceInBusinessDays } from "date-fns";
import {
  ConventionDto,
  ConventionDtoBuilder,
  ConventionStatus,
  conventionStatuses,
  expectObjectInArrayToMatch,
  expectToEqual,
} from "shared";
import {
  createInMemoryUow,
  InMemoryUnitOfWork,
} from "../../../adapters/primary/config/uowConfig";
import { CustomTimeGateway } from "../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { makeCreateNewEvent } from "../../core/eventBus/EventBus";
import { DomainEvent } from "../../core/eventBus/events";
import { ConventionsReminder } from "./ConventionsReminder";

describe("ConventionReminder use case", () => {
  const now = new Date("2023-03-17");
  const eventIds = ["event-1", "event-2", "event-3", "event-4"];
  const topic = "ConventionReminderRequired";
  const needSignatureStatuses: ConventionStatus[] = [
    "READY_TO_SIGN",
    "PARTIALLY_SIGNED",
  ];
  const needReviewStatuses: ConventionStatus[] = ["IN_REVIEW"];

  let uow: InMemoryUnitOfWork;
  let conventionsReminder: ConventionsReminder;

  beforeEach(() => {
    const uuidGenerator = new TestUuidGenerator();
    const timeGateway = new CustomTimeGateway(now);

    uow = createInMemoryUow();
    uuidGenerator.setNextUuids([...eventIds]);

    conventionsReminder = new ConventionsReminder(
      new InMemoryUowPerformer(uow),
      timeGateway,
      makeCreateNewEvent({
        timeGateway,
        uuidGenerator,
      }),
    );
  });

  describe("Do nothing", () => {
    it("When there is no convention that have status different of READY_TO_SIGN, PARTIALLY_SIGNED or IN_REVIEW.", async () => {
      // Arrange
      const conventionsWithUnsupportedStatuses =
        makeOneConventionOfEachStatuses({
          withDateStart: now,
        }).filter(
          ({ status }) =>
            ![...needSignatureStatuses, ...needReviewStatuses].includes(status),
        );

      uow.conventionRepository.setConventions(
        conventionsWithUnsupportedStatuses,
      );

      // Act
      const summary = await conventionsReminder.execute();

      //Assert
      expectToEqual(summary, {
        success: 0,
        failures: [],
      });
      expectToEqual(uow.outboxRepository.events, []);
      expectToEqual(
        uow.conventionRepository.conventions,
        conventionsWithUnsupportedStatuses,
      );
    });

    it("When there is no convention that is below 3 open days before intership starts.", async () => {
      // Arrange
      const { differenceWithNow, date } = prepareDate(now, 4);
      expect(differenceWithNow > 3).toBeTruthy();

      const conventions = makeOneConventionOfEachStatuses({
        withDateStart: date,
      });
      uow.conventionRepository.setConventions(conventions);

      // Act
      const summary = await conventionsReminder.execute();

      //Assert
      expectToEqual(summary, {
        success: 0,
        failures: [],
      });
      expectToEqual(uow.outboxRepository.events, []);
      expectToEqual(uow.conventionRepository.conventions, conventions);
    });
  });

  describe("Send 'ConventionReminderRequired' event", () => {
    it("with kind 'FirstReminderForAgency' when there is a convention that is between 3 and 2 open days before interships start depending of convention statuses.", async () => {
      // Arrange
      const { differenceWithNow, date } = prepareDate(now, 3);
      expect(differenceWithNow <= 3 && differenceWithNow > 2).toBeTruthy();

      const conventions = makeOneConventionOfEachStatuses({
        withDateStart: date,
      });
      uow.conventionRepository.setConventions(conventions);

      // Act
      const summary = await conventionsReminder.execute();

      //Assert
      const conventionsForAgencies = conventions.filter((convention) =>
        needReviewStatuses.includes(convention.status),
      );
      const expectedEvents: Partial<DomainEvent>[] = [
        {
          id: eventIds[0],
          topic,
          payload: {
            reminderKind: "FirstReminderForAgency",
            conventionId: conventionsForAgencies[0].id,
          },
        },
      ];

      expectToEqual(summary, {
        success: expectedEvents.length,
        failures: [],
      });
      expectObjectInArrayToMatch(uow.outboxRepository.events, expectedEvents);
      expectToEqual(uow.conventionRepository.conventions, conventions);
    });

    it("with kind 'LastReminderForSignatories' when there is a convention that is below 2 open days before interships start.", async () => {
      // Arrange
      const { differenceWithNow, date } = prepareDate(now, 2);
      expect(differenceWithNow <= 2 && differenceWithNow > 0).toBeTruthy();

      const conventions = makeOneConventionOfEachStatuses({
        withDateStart: date,
      });
      uow.conventionRepository.setConventions(conventions);

      // Act
      const summary = await conventionsReminder.execute();

      //Assert
      const events: Partial<DomainEvent>[] = conventions
        .filter((convention) =>
          needSignatureStatuses.includes(convention.status),
        )
        .map((convention, index) => ({
          id: eventIds[index],
          topic,
          payload: {
            reminderKind: "LastReminderForSignatories",
            conventionId: convention.id,
          },
        }));
      expectToEqual(summary, {
        success: events.length,
        failures: [],
      });
      expectObjectInArrayToMatch(uow.outboxRepository.events, events);
      expectToEqual(uow.conventionRepository.conventions, conventions);
    });

    it("with kind 'LastReminderForSignatories' and 'LastReminderForAgency' when there is a convention that is below 1 open days before interships start depending on conventions statuses.", async () => {
      // Arrange
      const { differenceWithNow, date } = prepareDate(now, 1);
      expect(differenceWithNow <= 1 && differenceWithNow > 0).toBeTruthy();

      const conventions = makeOneConventionOfEachStatuses({
        withDateStart: date,
      });
      uow.conventionRepository.setConventions(conventions);

      // Act
      const summary = await conventionsReminder.execute();

      //Assert

      const conventionsNeeds48 = conventions.filter((convention) =>
        needSignatureStatuses.includes(convention.status),
      );
      const conventionsNeeds24 = conventions.filter((convention) =>
        needReviewStatuses.includes(convention.status),
      );

      const events: Partial<DomainEvent>[] = [
        {
          id: eventIds[0],
          topic,
          payload: {
            reminderKind: "LastReminderForSignatories",
            conventionId: conventionsNeeds48[0].id,
          },
        },
        {
          id: eventIds[1],
          topic,
          payload: {
            reminderKind: "LastReminderForSignatories",
            conventionId: conventionsNeeds48[1].id,
          },
        },
        {
          id: eventIds[2],
          topic,
          payload: {
            reminderKind: "LastReminderForAgency",
            conventionId: conventionsNeeds24[0].id,
          },
        },
      ];
      expectToEqual(summary, {
        success: events.length,
        failures: [],
      });
      expectObjectInArrayToMatch(uow.outboxRepository.events, events);
      expectToEqual(uow.conventionRepository.conventions, conventions);
    });
  });
});

const makeOneConventionOfEachStatuses = ({
  withDateStart,
}: {
  withDateStart: Date;
}): ConventionDto[] =>
  conventionStatuses.map((conventionStatus, index) =>
    new ConventionDtoBuilder()
      .withId(index.toString())
      .withStatus(conventionStatus)
      .withDateStart(withDateStart.toISOString())
      .build(),
  );

const prepareDate = (now: Date, addBusinessDay: number) => {
  const date = addBusinessDays(now, addBusinessDay);
  return {
    differenceWithNow: differenceInBusinessDays(date, now),
    date,
  };
};
