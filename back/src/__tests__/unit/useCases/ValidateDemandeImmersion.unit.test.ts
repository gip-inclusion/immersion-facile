import {
  BadRequestError,
  NotFoundError,
} from "../../../adapters/primary/helpers/httpErrors";
import { InMemoryConventionRepository } from "../../../adapters/secondary/InMemoryConventionRepository";
import { ValidateImmersionApplication } from "../../../domain/convention/useCases/ValidateImmersionApplication";
import { ConventionDtoBuilder } from "../../../../../shared/src/convention/ConventionDtoBuilder";
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

describe("Validate Convention", () => {
  let validateConvention: ValidateImmersionApplication;
  let outboxRepository: InMemoryOutboxRepository;
  let outboxQueries: InMemoryOutboxQueries;
  let repository: InMemoryConventionRepository;
  let createNewEvent: CreateNewEvent;
  let clock: CustomClock;
  let uuidGenerator: TestUuidGenerator;

  beforeEach(() => {
    repository = new InMemoryConventionRepository();
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
      const convention = new ConventionDtoBuilder()
        .withStatus("IN_REVIEW")
        .build();

      repository.setConventions({ [convention.id]: convention });

      const { id } = await validateConvention.execute(convention.id);
      const expectedConvention: ConventionDto = {
        ...convention,
        status: "VALIDATED",
      };

      await expectEventSavedInOutbox(outboxQueries, {
        topic: "FinalImmersionApplicationValidationByAdmin",
        payload: expectedConvention,
      });
      expect(id).toEqual(convention.id);

      const storedInRepo = repository.conventions;
      expect(storedInRepo).toEqual([expectedConvention]);
    });
  });

  describe("When the Convention is still draft", () => {
    it("throws bad request error", async () => {
      const convention = new ConventionDtoBuilder().build();
      repository.setConventions({ [convention.id]: convention });

      await expectPromiseToFailWithError(
        validateConvention.execute(convention.id),
        new BadRequestError(convention.id),
      );

      // And the immersion application is still DRAFT
      const storedInRepo = repository.conventions;
      expect(storedInRepo).toEqual([convention]);
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
