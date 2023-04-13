import { addBusinessDays, differenceInBusinessDays } from "date-fns";

import {
  ConventionDto,
  ConventionDtoBuilder,
  ConventionStatus,
  conventionStatuses,
  expectToEqual,
} from "shared";

import {
  createInMemoryUow,
  InMemoryUnitOfWork,
} from "../../../adapters/primary/config/uowConfig";
import { InMemoryOutboxRepository } from "../../../adapters/secondary/core/InMemoryOutboxRepository";
import { CustomTimeGateway } from "../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryConventionRepository } from "../../../adapters/secondary/InMemoryConventionRepository";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { makeCreateNewEvent } from "../../core/eventBus/EventBus";
import { DomainEvent } from "../../core/eventBus/events";

import { ConventionsReminder } from "./ConventionsReminder";

describe("RemindConventionsNeedSignature use case", () => {
  const now = new Date("2023-03-17");
  const eventIds = ["event-1", "event-2", "event-3", "event-4"];
  const topic = "ConventionReminderRequired";
  let uow: InMemoryUnitOfWork;
  let useCase: ConventionsReminder;
  let outboxRepository: InMemoryOutboxRepository;
  let conventionRepository: InMemoryConventionRepository;

  beforeEach(() => {
    const uuidGenerator = new TestUuidGenerator();
    const timeGateway = new CustomTimeGateway(now);

    uow = createInMemoryUow();
    outboxRepository = uow.outboxRepository;
    conventionRepository = uow.conventionRepository;
    uuidGenerator.setNextUuids([...eventIds]);

    useCase = new ConventionsReminder(
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
          (convention) =>
            !(
              [
                "READY_TO_SIGN",
                "PARTIALLY_SIGNED",
                "IN_REVIEW",
              ] as ConventionStatus[]
            ).includes(convention.status),
        );

      conventionRepository.setConventions(
        toConventionRepoRecord(conventionsWithUnsupportedStatuses),
      );

      // Act
      const summary = await useCase.execute();

      //Assert
      expectToEqual(summary, {
        success: 0,
        failures: [],
      });
      expectToEqual(outboxRepository.events, []);
      expectToEqual(
        conventionRepository._conventions,
        toConventionRepoRecord(conventionsWithUnsupportedStatuses),
      );
    });

    it("When there is no convention that is below 3 open days before intership starts.", async () => {
      const withDateStart = addBusinessDays(now, 4);
      expect(differenceInBusinessDays(withDateStart, now)).toBeGreaterThan(3);

      // Arrange
      const conventions = makeOneConventionOfEachStatuses({
        withDateStart,
      });

      conventionRepository.setConventions(toConventionRepoRecord(conventions));

      // Act
      const summary = await useCase.execute();

      //Assert
      expectToEqual(summary, {
        success: 0,
        failures: [],
      });

      //Assert
      expectToEqual(outboxRepository.events, []);
      expectToEqual(
        conventionRepository._conventions,
        toConventionRepoRecord(conventions),
      );
    });
  });

  describe("Send 'ConventionSignReminder' event", () => {
    it("ConventionSignReminder type 'FirstReminderForSignatories' and 'FirstReminderForAgency' when there is a convention that is between 3 and 2 open days before interships start depending of convention statuses.", async () => {
      // Arrange
      const withDateStart = addBusinessDays(now, 3);

      const conventions = makeOneConventionOfEachStatuses({
        withDateStart,
      });
      conventionRepository.setConventions(toConventionRepoRecord(conventions));

      // Act
      const summary = await useCase.execute();

      //Assert
      const conventionsForActors = conventions.filter((convention) =>
        (["READY_TO_SIGN", "PARTIALLY_SIGNED"] as ConventionStatus[]).includes(
          convention.status,
        ),
      );
      const conventionsForAgencies = conventions.filter((convention) =>
        (["IN_REVIEW"] as ConventionStatus[]).includes(convention.status),
      );

      const expectedEvents: DomainEvent[] = [
        {
          id: eventIds[0],
          occurredAt: now.toISOString(),
          topic,
          payload: {
            reminderKind: "FirstReminderForSignatories",
            conventionId: conventionsForActors[0].id,
          },
          publications: [],
          wasQuarantined: false,
        },
        {
          id: eventIds[1],
          occurredAt: now.toISOString(),
          topic,
          payload: {
            reminderKind: "FirstReminderForSignatories",
            conventionId: conventionsForActors[1].id,
          },
          publications: [],
          wasQuarantined: false,
        },
        {
          id: eventIds[2],
          occurredAt: now.toISOString(),
          topic,
          payload: {
            reminderKind: "FirstReminderForAgency",
            conventionId: conventionsForAgencies[0].id,
          },
          publications: [],
          wasQuarantined: false,
        },
      ];

      expect(differenceInBusinessDays(withDateStart, now)).toBeLessThanOrEqual(
        3,
      );
      expect(differenceInBusinessDays(withDateStart, now)).toBeGreaterThan(2);
      expectToEqual(summary, {
        success: expectedEvents.length,
        failures: [],
      });
      expectToEqual(outboxRepository.events, expectedEvents);
      expectToEqual(
        conventionRepository._conventions,
        toConventionRepoRecord(conventions),
      );
    });

    it("ConventionSignReminder type 'LastReminderForSignatories' when there is a convention that is below 2 open days before interships start.", async () => {
      // Arrange
      const withDateStart = addBusinessDays(now, 2);

      const conventions = makeOneConventionOfEachStatuses({
        withDateStart,
      });
      conventionRepository.setConventions(toConventionRepoRecord(conventions));

      // Act
      const summary = await useCase.execute();

      //Assert

      expect(differenceInBusinessDays(withDateStart, now)).toBeLessThanOrEqual(
        2,
      );
      expect(differenceInBusinessDays(withDateStart, now)).toBeGreaterThan(0);

      const events: DomainEvent[] = conventions
        .filter((convention) =>
          (
            ["READY_TO_SIGN", "PARTIALLY_SIGNED"] as ConventionStatus[]
          ).includes(convention.status),
        )
        .map((convention, index) => ({
          id: eventIds[index],
          occurredAt: now.toISOString(),
          topic,
          payload: {
            reminderKind: "LastReminderForSignatories",
            conventionId: convention.id,
          },
          publications: [],
          wasQuarantined: false,
        }));
      expectToEqual(summary, {
        success: events.length,
        failures: [],
      });
      expectToEqual(outboxRepository.events, events);
      expectToEqual(
        conventionRepository._conventions,
        toConventionRepoRecord(conventions),
      );
    });

    it("ConventionSignReminder type 'LastReminderForSignatories' and 'LastReminderForAgency' when there is a convention that is below 1 open days before interships start depending on conventions statuses.", async () => {
      // Arrange
      const withDateStart = addBusinessDays(now, 1);

      const conventions = makeOneConventionOfEachStatuses({
        withDateStart,
      });
      conventionRepository.setConventions(toConventionRepoRecord(conventions));

      // Act
      const summary = await useCase.execute();

      //Assert

      expect(differenceInBusinessDays(withDateStart, now)).toBeLessThanOrEqual(
        1,
      );
      expect(differenceInBusinessDays(withDateStart, now)).toBeGreaterThan(0);

      const conventionsNeeds48 = conventions.filter((convention) =>
        (["READY_TO_SIGN", "PARTIALLY_SIGNED"] as ConventionStatus[]).includes(
          convention.status,
        ),
      );
      const conventionsNeeds24 = conventions.filter((convention) =>
        (["IN_REVIEW"] as ConventionStatus[]).includes(convention.status),
      );

      const events: DomainEvent[] = [
        {
          id: eventIds[0],
          occurredAt: now.toISOString(),
          topic,
          payload: {
            reminderKind: "LastReminderForSignatories",
            conventionId: conventionsNeeds48[0].id,
          },
          publications: [],
          wasQuarantined: false,
        },
        {
          id: eventIds[1],
          occurredAt: now.toISOString(),
          topic,
          payload: {
            reminderKind: "LastReminderForSignatories",
            conventionId: conventionsNeeds48[1].id,
          },
          publications: [],
          wasQuarantined: false,
        },
        {
          id: eventIds[2],
          occurredAt: now.toISOString(),
          topic,
          payload: {
            reminderKind: "LastReminderForAgency",
            conventionId: conventionsNeeds24[0].id,
          },
          publications: [],
          wasQuarantined: false,
        },
      ];
      expectToEqual(summary, {
        success: events.length,
        failures: [],
      });
      expectToEqual(outboxRepository.events, events);
      expectToEqual(
        conventionRepository._conventions,
        toConventionRepoRecord(conventions),
      );
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

const toConventionRepoRecord = (conventions: ConventionDto[]) =>
  conventions.reduce(
    (acc, item) => ({ ...acc, [item["id"]]: item }),
    {} as Record<string, ConventionDto>,
  );
