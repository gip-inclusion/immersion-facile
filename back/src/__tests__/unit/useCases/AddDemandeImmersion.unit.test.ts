import { ConflictError } from "../../../adapters/primary/helpers/sendHttpResponse";
import { CustomClock } from "../../../adapters/secondary/core/ClockImplementations";
import { InMemoryOutboxRepository } from "../../../adapters/secondary/core/InMemoryOutboxRepository";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryDemandeImmersionRepository } from "../../../adapters/secondary/InMemoryDemandeImmersionRepository";
import {
  CreateNewEvent,
  makeCreateNewEvent,
} from "../../../domain/core/eventBus/EventBus";
import { DomainEvent } from "../../../domain/core/eventBus/events";
import { DateStr } from "../../../domain/core/ports/Clock";
import { DemandeImmersionEntity } from "../../../domain/demandeImmersion/entities/DemandeImmersionEntity";
import { AddDemandeImmersion } from "../../../domain/demandeImmersion/useCases/AddDemandeImmersion";
import { DemandeImmersionDtoBuilder } from "../../../_testBuilders/DemandeImmersionDtoBuilder";
import { expectPromiseToFailWithError } from "../../../_testBuilders/test.helpers";

describe("Add demandeImmersion", () => {
  let addDemandeImmersion: AddDemandeImmersion;
  let applicationRepository: InMemoryDemandeImmersionRepository;
  let clock: CustomClock;
  let uuidGenerator: TestUuidGenerator;
  let createNewEvent: CreateNewEvent;
  let outboxRepository: InMemoryOutboxRepository;
  const validDemandeImmersion = new DemandeImmersionDtoBuilder().build();

  beforeEach(() => {
    applicationRepository = new InMemoryDemandeImmersionRepository();
    outboxRepository = new InMemoryOutboxRepository();
    clock = new CustomClock();
    uuidGenerator = new TestUuidGenerator();
    createNewEvent = makeCreateNewEvent({ clock, uuidGenerator });
    addDemandeImmersion = createAddDemandeImmersionUseCase();
  });

  const createAddDemandeImmersionUseCase = () => {
    return new AddDemandeImmersion(
      applicationRepository,
      createNewEvent,
      outboxRepository
    );
  };

  test("saves valid applications in the repository", async () => {
    const occurredAt: DateStr = new Date("2021-10-15T15:00").toISOString();
    const id = "eventId";
    clock.setNextDate(occurredAt);
    uuidGenerator.setNextUuid(id);

    expect(await addDemandeImmersion.execute(validDemandeImmersion)).toEqual({
      id: validDemandeImmersion.id,
    });

    const storedInRepo = await applicationRepository.getAll();
    expect(storedInRepo.length).toBe(1);
    expect(storedInRepo[0].toDto()).toEqual(validDemandeImmersion);
    expectDomainEventsToBeInOutbox([
      {
        id,
        occurredAt,
        topic: "ImmersionApplicationSubmittedByBeneficiary",
        payload: validDemandeImmersion,
        wasPublished: false,
      },
    ]);
  });

  test("rejects applications where the ID is already in use", async () => {
    await applicationRepository.save(
      DemandeImmersionEntity.create(validDemandeImmersion)
    );

    await expectPromiseToFailWithError(
      addDemandeImmersion.execute(validDemandeImmersion),
      new ConflictError(validDemandeImmersion.id)
    );
  });

  const expectDomainEventsToBeInOutbox = (expected: DomainEvent[]) => {
    expect(outboxRepository.events).toEqual(expected);
  };
});
