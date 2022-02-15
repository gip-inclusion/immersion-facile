import {
  BadRequestError,
  NotFoundError,
} from "../../../adapters/primary/helpers/httpErrors";
import { InMemoryImmersionApplicationRepository } from "../../../adapters/secondary/InMemoryImmersionApplicationRepository";
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
  let validateImmersionApplication: ValidateImmersionApplication;
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

    validateImmersionApplication = new ValidateImmersionApplication(
      repository,
      createNewEvent,
      outboxRepository,
    );
  });

  describe("When the immersionApplication is valid", () => {
    test("validates the immersionApplication in the repository", async () => {
      const immersionApplication: Record<string, ImmersionApplicationEntity> =
        {};
      const immersionApplicationEntity = ImmersionApplicationEntity.create(
        new ImmersionApplicationDtoBuilder().withStatus("IN_REVIEW").build(),
      );
      immersionApplication[immersionApplicationEntity.id] =
        immersionApplicationEntity;
      repository.setImmersionApplications(immersionApplication);

      const { id } = await validateImmersionApplication.execute(
        immersionApplicationEntity.id,
      );
      const expectedImmersionApplication: ImmersionApplicationDto = {
        ...immersionApplicationEntity.toDto(),
        status: "VALIDATED",
      };

      expectEventSavedInOutbox(outboxRepository, {
        topic: "FinalImmersionApplicationValidationByAdmin",
        payload: expectedImmersionApplication,
      });
      expect(id).toEqual(immersionApplicationEntity.id);

      const storedInRepo = await repository.getAll();
      expect(storedInRepo.map((entity) => entity.toDto())).toEqual([
        expectedImmersionApplication,
      ]);
    });
  });

  describe("When the immersionApplication is still draft", () => {
    test("throws bad request error", async () => {
      const immersionApplications: Record<string, ImmersionApplicationEntity> =
        {};
      const immersionApplicationEntity =
        new ImmersionApplicationEntityBuilder().build();
      immersionApplications[immersionApplicationEntity.id] =
        immersionApplicationEntity;
      repository.setImmersionApplications(immersionApplications);

      await expectPromiseToFailWithError(
        validateImmersionApplication.execute(immersionApplicationEntity.id),
        new BadRequestError(immersionApplicationEntity.id),
      );

      // And the immersion application is still DRAFT
      const storedInRepo = await repository.getAll();
      expect(storedInRepo.map((entity) => entity.toDto())).toEqual([
        immersionApplicationEntity.toDto(),
      ]);
    });
  });

  describe("When no immersionApplication with id exists", () => {
    it("throws NotFoundError", async () => {
      await expectPromiseToFailWithError(
        validateImmersionApplication.execute(
          "unknown_immersion_application_id",
        ),
        new NotFoundError("unknown_immersion_application_id"),
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
