import { BadRequestError } from "./../../../adapters/primary/helpers/sendHttpResponse";
import { NotFoundError } from "../../../adapters/primary/helpers/sendHttpResponse";
import {
  DemandesImmersion,
  InMemoryDemandeImmersionRepository,
} from "../../../adapters/secondary/InMemoryDemandeImmersionRepository";
import { DemandeImmersionEntity } from "../../../domain/demandeImmersion/entities/DemandeImmersionEntity";
import { ValidateDemandeImmersion } from "../../../domain/demandeImmersion/useCases/ValidateDemandeImmersion";
import { DemandeImmersionDtoBuilder } from "../../../_testBuilders/DemandeImmersionDtoBuilder";
import { DemandeImmersionEntityBuilder } from "../../../_testBuilders/DemandeImmersionEntityBuilder";
import { expectPromiseToFailWithError } from "../../../_testBuilders/test.helpers";
import { OutboxRepository } from "../../../domain/core/ports/OutboxRepository";
import {
  CreateNewEvent,
  makeCreateNewEvent,
} from "../../../domain/core/eventBus/EventBus";
import { CustomClock } from "../../../adapters/secondary/core/ClockImplementations";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryOutboxRepository } from "../../../adapters/secondary/core/InMemoryOutboxRepository";
import { DomainEvent } from "../../../domain/core/eventBus/events";
import { DemandeImmersionDto } from "../../../shared/DemandeImmersionDto";

describe("Validate demandeImmersion", () => {
  let validateDemandeImmersion: ValidateDemandeImmersion;
  let outboxRepository: OutboxRepository;
  let repository: InMemoryDemandeImmersionRepository;
  let createNewEvent: CreateNewEvent;
  let clock: CustomClock;
  let uuidGenerator: TestUuidGenerator;

  beforeEach(() => {
    repository = new InMemoryDemandeImmersionRepository();
    outboxRepository = new InMemoryOutboxRepository();
    clock = new CustomClock();
    uuidGenerator = new TestUuidGenerator();
    createNewEvent = makeCreateNewEvent({ clock, uuidGenerator });

    validateDemandeImmersion = new ValidateDemandeImmersion(
      repository,
      createNewEvent,
      outboxRepository,
    );
  });

  describe("When the demandeImmersion is valid", () => {
    test("validates the demandeImmersion in the repository", async () => {
      const demandesImmersion: DemandesImmersion = {};
      const demandeImmersionEntity = DemandeImmersionEntity.create(
        new DemandeImmersionDtoBuilder().withStatus("IN_REVIEW").build(),
      );
      demandesImmersion[demandeImmersionEntity.id] = demandeImmersionEntity;
      repository.setDemandesImmersion(demandesImmersion);

      const { id } = await validateDemandeImmersion.execute(
        demandeImmersionEntity.id,
      );
      const expectedDemandeImmersion: DemandeImmersionDto = {
        ...demandeImmersionEntity.toDto(),
        status: "VALIDATED",
      };

      expectEventSavedInOutbox(outboxRepository, {
        topic: "FinalImmersionApplicationValidationByAdmin",
        payload: expectedDemandeImmersion,
      });
      expect(id).toEqual(demandeImmersionEntity.id);

      const storedInRepo = await repository.getAll();
      expect(storedInRepo.map((entity) => entity.toDto())).toEqual([
        expectedDemandeImmersion,
      ]);
    });
  });

  describe("When the demandeImmersion is still draft", () => {
    test("throws bad request error", async () => {
      const demandesImmersion: DemandesImmersion = {};
      const demandeImmersionEntity =
        new DemandeImmersionEntityBuilder().build();
      demandesImmersion[demandeImmersionEntity.id] = demandeImmersionEntity;
      repository.setDemandesImmersion(demandesImmersion);

      await expectPromiseToFailWithError(
        validateDemandeImmersion.execute(demandeImmersionEntity.id),
        new BadRequestError(demandeImmersionEntity.id),
      );

      // And the demande is still DRAFT
      const storedInRepo = await repository.getAll();
      expect(storedInRepo.map((entity) => entity.toDto())).toEqual([
        demandeImmersionEntity.toDto(),
      ]);
    });
  });

  describe("When no demandeImmersion with id exists", () => {
    it("throws NotFoundError", async () => {
      await expectPromiseToFailWithError(
        validateDemandeImmersion.execute("unknown_demande_immersion_id"),
        new NotFoundError("unknown_demande_immersion_id"),
      );
    });
  });
});

const expectEventSavedInOutbox = async (
  outboxRepository: OutboxRepository,
  event: Partial<DomainEvent>,
) => {
  const publishedEvents = await outboxRepository.getAllUnpublishedEvents();
  expect(publishedEvents[publishedEvents.length - 1]).toMatchObject(event);
};
