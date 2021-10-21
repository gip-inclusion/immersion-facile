import { date } from "zod";
import { ConflictError } from "../../../adapters/primary/helpers/sendHttpResponse";
import { CustomClock } from "../../../adapters/secondary/core/ClockImplementations";
import { InMemoryOutboxRepository } from "../../../adapters/secondary/core/InMemoryOutboxRepository";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryImmersionApplicationRepository } from "../../../adapters/secondary/InMemoryImmersionApplicationRepository";
import {
  CreateNewEvent,
  makeCreateNewEvent,
} from "../../../domain/core/eventBus/EventBus";
import { DomainEvent } from "../../../domain/core/eventBus/events";
import { DateStr } from "../../../domain/core/ports/Clock";
import { ImmersionApplicationEntity } from "../../../domain/immersionApplication/entities/ImmersionApplicationEntity";
import { AddImmersionApplication } from "../../../domain/immersionApplication/useCases/AddImmersionApplication";
import { ImmersionApplicationDtoBuilder } from "../../../_testBuilders/ImmersionApplicationDtoBuilder";
import { expectPromiseToFailWithError } from "../../../_testBuilders/test.helpers";

describe("Add immersionApplication", () => {
  let addImmersionApplication: AddImmersionApplication;
  let applicationRepository: InMemoryImmersionApplicationRepository;
  let clock: CustomClock;
  let uuidGenerator: TestUuidGenerator;
  let createNewEvent: CreateNewEvent;
  let outboxRepository: InMemoryOutboxRepository;
  const validImmersionApplication =
    new ImmersionApplicationDtoBuilder().build();

  beforeEach(() => {
    applicationRepository = new InMemoryImmersionApplicationRepository();
    outboxRepository = new InMemoryOutboxRepository();
    clock = new CustomClock();
    uuidGenerator = new TestUuidGenerator();
    createNewEvent = makeCreateNewEvent({ clock, uuidGenerator });
    addImmersionApplication = createAddDemandeImmersionUseCase();
  });

  const createAddDemandeImmersionUseCase = () => {
    return new AddImmersionApplication(
      applicationRepository,
      createNewEvent,
      outboxRepository,
    );
  };

  test("saves valid applications in the repository", async () => {
    const occurredAt: DateStr = new Date("2021-10-15T15:00").toISOString();
    const id = "eventId";
    clock.setNextDate(occurredAt);
    uuidGenerator.setNextUuid(id);

    expect(
      await addImmersionApplication.execute(validImmersionApplication),
    ).toEqual({
      id: validImmersionApplication.id,
    });

    const storedInRepo = await applicationRepository.getAll();
    expect(storedInRepo.length).toBe(1);
    expect(storedInRepo[0].toDto()).toEqual(validImmersionApplication);
    expectDomainEventsToBeInOutbox([
      {
        id,
        occurredAt,
        topic: "ImmersionApplicationSubmittedByBeneficiary",
        payload: validImmersionApplication,
        wasPublished: false,
      },
    ]);
  });

  test("rejects applications where the ID is already in use", async () => {
    await applicationRepository.save(
      ImmersionApplicationEntity.create(validImmersionApplication),
    );

    await expectPromiseToFailWithError(
      addImmersionApplication.execute(validImmersionApplication),
      new ConflictError(validImmersionApplication.id),
    );
  });

  const expectDomainEventsToBeInOutbox = (expected: DomainEvent[]) => {
    expect(outboxRepository.events).toEqual(expected);
  };
});
