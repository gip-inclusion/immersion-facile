import { AgencyDtoBuilder } from "shared";
import { createInMemoryUow } from "../../../../adapters/primary/config/uowConfig";
import { CustomClock } from "../../../../adapters/secondary/core/ClockImplementations";
import { TestUuidGenerator } from "../../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryUowPerformer } from "../../../../adapters/secondary/InMemoryUowPerformer";

import { makeCreateNewEvent } from "../../../core/eventBus/EventBus";
import { UpdateAgencyStatus } from "./UpdateAgencyStatus";

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

  const useCase = new UpdateAgencyStatus(
    new InMemoryUowPerformer(uow),
    createNewEvent,
  );

  return {
    useCase,
    outboxRepository: uow.outboxRepository,
    agencyRepository: uow.agencyRepository,
    clock,
    uuidGenerator,
  };
};

describe("Update agency", () => {
  it("Updates an agency in repository and publishes an event to notify if status becomes active", async () => {
    // Prepare
    const { useCase, agencyRepository, outboxRepository } = prepareUseCase();
    const existingAgency = AgencyDtoBuilder.create("agency-123")
      .withStatus("needsReview")
      .build();
    agencyRepository.setAgencies([existingAgency]);

    // Act
    await useCase.execute({ id: "agency-123", status: "active" });

    // Assert
    expect(agencyRepository.agencies[0].status).toBe("active");
    expect(outboxRepository.events[0]).toMatchObject({
      id: nextUuid,
      topic: "AgencyActivated",
      payload: { agency: { ...existingAgency, status: "active" } },
    });
  });
});
