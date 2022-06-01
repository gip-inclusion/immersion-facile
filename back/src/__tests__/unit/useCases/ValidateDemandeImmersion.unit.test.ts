import {
  BadRequestError,
  NotFoundError,
} from "../../../adapters/primary/helpers/httpErrors";
import { InMemoryConventionRepository } from "../../../adapters/secondary/InMemoryConventionRepository";
import { ConventionEntity } from "../../../domain/convention/entities/ConventionEntity";
import { ValidateImmersionApplication } from "../../../domain/convention/useCases/ValidateImmersionApplication";
import { ConventionDtoBuilder } from "../../../../../shared/src/convention/ConventionDtoBuilder";
import { ConventionEntityBuilder } from "../../../_testBuilders/ConventionEntityBuilder";
import { expectPromiseToFailWithError } from "../../../_testBuilders/test.helpers";
import {
  CreateNewEvent,
  makeCreateNewEvent,
} from "../../../domain/core/eventBus/EventBus";
import { CustomClock } from "../../../adapters/secondary/core/ClockImplementations";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryOutboxRepository } from "../../../adapters/secondary/core/InMemoryOutboxRepository";
import { DomainEvent } from "../../../domain/core/eventBus/events";
import { ConventionDto } from "shared/src/convention/convention.dto";
import { OutboxQueries } from "../../../domain/core/ports/OutboxQueries";
import { InMemoryOutboxQueries } from "../../../adapters/secondary/core/InMemoryOutboxQueries";
import { InMemoryConventionQueries } from "../../../adapters/secondary/InMemoryConventionQueries";

describe("Validate Convention", () => {
  let validateConvention: ValidateImmersionApplication;
  let outboxRepository: InMemoryOutboxRepository;
  let outboxQueries: InMemoryOutboxQueries;
  let repository: InMemoryConventionRepository;
  let queries: InMemoryConventionQueries;
  let createNewEvent: CreateNewEvent;
  let clock: CustomClock;
  let uuidGenerator: TestUuidGenerator;

  beforeEach(() => {
    repository = new InMemoryConventionRepository();
    queries = new InMemoryConventionQueries(repository);
    outboxRepository = new InMemoryOutboxRepository();
    outboxQueries = new InMemoryOutboxQueries(outboxRepository);
    clock = new CustomClock();
    uuidGenerator = new TestUuidGenerator();
    createNewEvent = makeCreateNewEvent({ clock, uuidGenerator });

    validateConvention = new ValidateImmersionApplication(
      repository,
      createNewEvent,
      outboxRepository,
    );
  });

  describe("When the Convention is valid", () => {
    it("validates the Convention in the repository", async () => {
      const convention: Record<string, ConventionEntity> = {};
      const conventionEntity = ConventionEntity.create(
        new ConventionDtoBuilder().withStatus("IN_REVIEW").build(),
      );
      convention[conventionEntity.id] = conventionEntity;
      repository.setConventions(convention);

      const { id } = await validateConvention.execute(conventionEntity.id);
      const expectedConvention: ConventionDto = {
        ...conventionEntity.toDto(),
        status: "VALIDATED",
      };

      await expectEventSavedInOutbox(outboxQueries, {
        topic: "FinalImmersionApplicationValidationByAdmin",
        payload: expectedConvention,
      });
      expect(id).toEqual(conventionEntity.id);

      const storedInRepo = await queries.getLatestUpdated();
      expect(storedInRepo.map((entity) => entity.toDto())).toEqual([
        expectedConvention,
      ]);
    });
  });

  describe("When the Convention is still draft", () => {
    it("throws bad request error", async () => {
      const conventions: Record<string, ConventionEntity> = {};
      const conventionEntity = new ConventionEntityBuilder().build();
      conventions[conventionEntity.id] = conventionEntity;
      repository.setConventions(conventions);

      await expectPromiseToFailWithError(
        validateConvention.execute(conventionEntity.id),
        new BadRequestError(conventionEntity.id),
      );

      // And the immersion application is still DRAFT
      const storedInRepo = await queries.getLatestUpdated();
      expect(storedInRepo.map((entity) => entity.toDto())).toEqual([
        conventionEntity.toDto(),
      ]);
    });
  });

  describe("When no Convention with id exists", () => {
    it("throws NotFoundError", async () => {
      await expectPromiseToFailWithError(
        validateConvention.execute("unknown_immersion_application_id"),
        new NotFoundError("unknown_immersion_application_id"),
      );
    });
  });
});

const expectEventSavedInOutbox = async (
  outboxQueries: OutboxQueries,
  event: Partial<DomainEvent>,
) => {
  const publishedEvents = await outboxQueries.getAllUnpublishedEvents();
  expect(publishedEvents[publishedEvents.length - 1]).toMatchObject(event);
};
