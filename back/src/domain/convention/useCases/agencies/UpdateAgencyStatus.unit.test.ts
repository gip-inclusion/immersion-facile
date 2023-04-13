import { AgencyDtoBuilder } from "shared";
import { createInMemoryUow } from "../../../../adapters/primary/config/uowConfig";
import { CustomTimeGateway } from "../../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { TestUuidGenerator } from "../../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryUowPerformer } from "../../../../adapters/secondary/InMemoryUowPerformer";
import { makeCreateNewEvent } from "../../../core/eventBus/EventBus";
import { UpdateAgencyStatus } from "./UpdateAgencyStatus";

const nextDate = new Date("2022-01-01T10:00:00.000");
const nextUuid = "event-uuid";

const prepareUseCase = () => {
  const uow = createInMemoryUow();
  const uuidGenerator = new TestUuidGenerator();
  const timeGateway = new CustomTimeGateway();
  timeGateway.setNextDate(nextDate);
  uuidGenerator.setNextUuid(nextUuid);

  const createNewEvent = makeCreateNewEvent({
    uuidGenerator,
    timeGateway,
  });

  const useCase = new UpdateAgencyStatus(
    new InMemoryUowPerformer(uow),
    createNewEvent,
  );

  return {
    useCase,
    outboxRepository: uow.outboxRepository,
    agencyRepository: uow.agencyRepository,
    uuidGenerator,
  };
};

describe("Update agency status", () => {
  it("Updates an agency status in repository and publishes an event to notify if status becomes active", async () => {
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
