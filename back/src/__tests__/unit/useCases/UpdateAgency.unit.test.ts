import { AgencyDtoBuilder } from "shared/src/agency/AgencyDtoBuilder";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import { CustomClock } from "../../../adapters/secondary/core/ClockImplementations";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { UpdateAgency } from "../../../domain/convention/useCases/UpdateAgency";
import { makeCreateNewEvent } from "../../../domain/core/eventBus/EventBus";

const nextDate = new Date("2022-01-01T10:00:00.000");
const nextUuid = "event-uuid";

const prepareUseCase = () => {
  const uow = createInMemoryUow();
  const uuidGenerator = new TestUuidGenerator();
  const clock = new CustomClock();
  clock.setNextDate(nextDate);
  uuidGenerator.setNextUuid(nextUuid);

  const createNewEvent = makeCreateNewEvent({
    uuidGenerator,
    clock,
  });

  const useCase = new UpdateAgency(
    new InMemoryUowPerformer(uow),
    createNewEvent,
  );

  return {
    useCase,
    outboxRepo: uow.outboxRepo,
    agencyRepo: uow.agencyRepo,
    clock,
    uuidGenerator,
  };
};

describe("Update agency", () => {
  it("Updates an agency in repository and publishes an event to notify if status becomes active", async () => {
    // Prepare
    const { useCase, agencyRepo, outboxRepo } = prepareUseCase();
    const existingAgency = AgencyDtoBuilder.create("agency-123")
      .withStatus("needsReview")
      .build();
    agencyRepo.setAgencies([existingAgency]);

    // Act
    await useCase.execute({ id: "agency-123", status: "active" });

    // Assert
    expect(agencyRepo.agencies[0].status).toBe("active");
    expect(outboxRepo.events[0]).toMatchObject({
      id: "event-uuid",
      topic: "AgencyActivated",
      occurredAt: "2022-01-01T09:00:00.000Z",
      payload: { ...existingAgency, status: "active" },
    });
  });
});
