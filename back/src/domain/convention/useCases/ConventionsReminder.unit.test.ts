import {
  addBusinessDays,
  addDays,
  differenceInBusinessDays,
  subDays,
} from "date-fns";
import {
  AgencyDtoBuilder,
  AgencyId,
  ConventionDto,
  ConventionDtoBuilder,
  ConventionStatus,
  conventionStatuses,
  expectObjectInArrayToMatch,
  expectToEqual,
} from "shared";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../../adapters/primary/config/uowConfig";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { CustomTimeGateway } from "../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
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
  const agency = new AgencyDtoBuilder().build();

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
          agencyId: agency.id,
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

    it("When there is conventions that is above 1 open day after internship starts", async () => {
      // Arrange
      const { startDate, startDateDifference } = prepareDates(now, -1);
      expect(startDateDifference < 0).toBeTruthy();

      const conventions = makeOneConventionOfEachStatuses({
        withDateStart: startDate,
        agencyId: agency.id,
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
    it("When conventions exists, not fully signed which where submitted exactly 2 days before", async () => {
      const dateStart = addDays(now, 10).toISOString();

      const convention1 = new ConventionDtoBuilder()
        .withId("1")
        .withStatus("PARTIALLY_SIGNED")
        .withDateSubmission(subDays(now, 1).toISOString())
        .withDateStart(dateStart)
        .build();

      const convention2 = new ConventionDtoBuilder()
        .withId("2")
        .withStatus("READY_TO_SIGN")
        .withDateSubmission(subDays(now, 3).toISOString())
        .withDateStart(dateStart)
        .build();

      const conventionNeedsReminder = new ConventionDtoBuilder()
        .withId("3")
        .withStatus("READY_TO_SIGN")
        .withDateSubmission(subDays(now, 2).toISOString())
        .withDateStart(dateStart)
        .build();

      uow.conventionRepository.setConventions([
        convention1,
        convention2,
        conventionNeedsReminder,
      ]);
      uow.agencyRepository.setAgencies([agency]);

      const summary = await conventionsReminder.execute();
      expectToEqual(summary, {
        success: 1,
        failures: [],
      });
      expectObjectInArrayToMatch(uow.outboxRepository.events, [
        {
          topic,
          payload: {
            reminderKind: "FirstReminderForSignatories",
            conventionId: conventionNeedsReminder.id,
          },
        },
      ]);
    });

    it(`with kind 'FirstReminderForSignatories'
        when there is a convention that is not fully signed and was published exactly 2 days before`, async () => {
      // Arrange
      const { startDateDifference, startDate } = prepareDates(now, 4);
      expect(startDateDifference > 3).toBeTruthy();
      const dateSubmission = subDays(now, 2);

      const conventions = makeOneConventionOfEachStatuses({
        withDateStart: startDate,
        withDateSubmission: dateSubmission,
        agencyId: agency.id,
      });
      uow.conventionRepository.setConventions(conventions);
      uow.agencyRepository.setAgencies([agency]);

      // Act
      const summary = await conventionsReminder.execute();

      //Assert
      const conventionsForSignatories = conventions.filter((convention) =>
        needSignatureStatuses.includes(convention.status),
      );
      const expectedEvents: Partial<DomainEvent>[] =
        conventionsForSignatories.map(({ id }, index) => ({
          id: eventIds[index],
          topic,
          payload: {
            reminderKind: "FirstReminderForSignatories",
            conventionId: id,
          },
        }));
      expectToEqual(summary, {
        success: expectedEvents.length,
        failures: [],
      });
      expectObjectInArrayToMatch(uow.outboxRepository.events, expectedEvents);
      expectToEqual(uow.conventionRepository.conventions, conventions);
    });

    it(`with kind 'LastReminderForSignatories'
        when there is a convention that is below 2 open days before interships start depending of convention statuses.`, async () => {
      // Arrange
      const { startDate, startDateDifference } = prepareDates(now, 2);
      expect(0 < startDateDifference && startDateDifference <= 2).toBeTruthy();

      const conventions = makeOneConventionOfEachStatuses({
        withDateStart: startDate,
        agencyId: agency.id,
      });
      uow.conventionRepository.setConventions(conventions);
      uow.agencyRepository.setAgencies([agency]);

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

    it(`with kind 'FirstReminderForAgency' and 'FirstReminderForSignatories'
        when there is a convention that is between 3 and 2 open days before interships start depending of convention statuses.`, async () => {
      // Arrange
      const { startDate, startDateDifference } = prepareDates(now, 3);
      expect(2 < startDateDifference && startDateDifference <= 3).toBeTruthy();

      const conventions = makeOneConventionOfEachStatuses({
        withDateStart: startDate,
        withDateSubmission: subDays(now, 2),
        agencyId: agency.id,
      });
      uow.conventionRepository.setConventions(conventions);
      uow.agencyRepository.setAgencies([agency]);

      // Act
      const summary = await conventionsReminder.execute();

      //Assert
      const supportedConventions = conventions.filter((convention) =>
        [...needReviewStatuses, ...needSignatureStatuses].includes(
          convention.status,
        ),
      );
      const expectedEvents: Partial<DomainEvent>[] = [
        {
          id: eventIds[0],
          topic,
          payload: {
            reminderKind: "FirstReminderForAgency",
            conventionId: supportedConventions[2].id,
          },
        },
        {
          id: eventIds[1],
          topic,
          payload: {
            reminderKind: "FirstReminderForSignatories",
            conventionId: supportedConventions[0].id,
          },
        },
        {
          id: eventIds[2],
          topic,
          payload: {
            reminderKind: "FirstReminderForSignatories",
            conventionId: supportedConventions[1].id,
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

    it(`with kind 'LastReminderForSignatories' and 'LastReminderForAgency'
        when there is a convention that is below 1 open days before interships start depending on conventions statuses.`, async () => {
      // Arrange
      const { startDate, startDateDifference } = prepareDates(now, 1);
      expect(0 < startDateDifference && startDateDifference <= 1).toBeTruthy();

      const conventions = makeOneConventionOfEachStatuses({
        withDateStart: startDate,
        agencyId: agency.id,
      });
      uow.conventionRepository.setConventions(conventions);
      uow.agencyRepository.setAgencies([agency]);

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
  withDateSubmission = subDays(withDateStart, 10),
  agencyId,
}: {
  withDateStart: Date;
  withDateSubmission?: Date;
  agencyId: AgencyId;
}): ConventionDto[] =>
  conventionStatuses.map((conventionStatus, index) =>
    new ConventionDtoBuilder()
      .withId(index.toString())
      .withAgencyId(agencyId)
      .withStatus(conventionStatus)
      .withDateStart(withDateStart.toISOString())
      .withDateSubmission(withDateSubmission.toISOString())
      .build(),
  );

const prepareDates = (now: Date, businessDaysToAdd: number) => {
  const startDate = addBusinessDays(now, businessDaysToAdd);
  return {
    startDate,
    startDateDifference: differenceInBusinessDays(startDate, now),
  };
};
