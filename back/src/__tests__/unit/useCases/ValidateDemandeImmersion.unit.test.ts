import { BadRequestError } from "./../../../adapters/primary/helpers/sendHttpResponse";
import { NotFoundError } from "../../../adapters/primary/helpers/sendHttpResponse";
import {
  ImmersionApplications,
  InMemoryImmersionApplicationRepository,
} from "../../../adapters/secondary/InMemoryImmersionApplicationRepository";
import { ImmersionApplicationEntity } from "../../../domain/immersionApplication/entities/ImmersionApplicationEntity";
import { ValidateImmersionApplication } from "../../../domain/immersionApplication/useCases/ValidateImmersionApplication";
import { ImmersionApplicationDtoBuilder } from "../../../_testBuilders/ImmersionApplicationDtoBuilder";
import { ImmersionApplicationEntityBuilder } from "../../../_testBuilders/ImmersionApplicationEntityBuilder";
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
import { ImmersionApplicationDto } from "../../../shared/ImmersionApplicationDto";

describe("Validate immersionApplication", () => {
  let validateDemandeImmersion: ValidateImmersionApplication;
  let outboxRepository: OutboxRepository;
  let repository: InMemoryImmersionApplicationRepository;
  let createNewEvent: CreateNewEvent;
  let clock: CustomClock;
  let uuidGenerator: TestUuidGenerator;

  beforeEach(() => {
    repository = new InMemoryImmersionApplicationRepository();
    outboxRepository = new InMemoryOutboxRepository();
    clock = new CustomClock();
    uuidGenerator = new TestUuidGenerator();
    createNewEvent = makeCreateNewEvent({ clock, uuidGenerator });

    validateDemandeImmersion = new ValidateImmersionApplication(
      repository,
      createNewEvent,
      outboxRepository,
    );
  });

  describe("When the immersionApplication is valid", () => {
    test("validates the immersionApplication in the repository", async () => {
      const demandesImmersion: ImmersionApplications = {};
      const demandeImmersionEntity = ImmersionApplicationEntity.create(
        new ImmersionApplicationDtoBuilder().withStatus("IN_REVIEW").build(),
      );
      demandesImmersion[demandeImmersionEntity.id] = demandeImmersionEntity;
      repository.setDemandesImmersion(demandesImmersion);

      const { id } = await validateDemandeImmersion.execute(
        demandeImmersionEntity.id,
      );
      const expectedDemandeImmersion: ImmersionApplicationDto = {
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

  describe("When the immersionApplication is still draft", () => {
    test("throws bad request error", async () => {
      const demandesImmersion: ImmersionApplications = {};
      const demandeImmersionEntity =
        new ImmersionApplicationEntityBuilder().build();
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

  describe("When no immersionApplication with id exists", () => {
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
