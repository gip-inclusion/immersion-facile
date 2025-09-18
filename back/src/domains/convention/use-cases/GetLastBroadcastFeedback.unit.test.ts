import type { BroadcastFeedback, ConnectedUser } from "shared";
import { createInMemoryUow } from "../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { makeGetLastBroadcastFeedback } from "./GetLastBroadcastFeedback";

describe("GetLastBroadcastFeedback", () => {
  it("should return null when no broadcast feedback exists", async () => {
    const uow = createInMemoryUow();
    const uowPerformer = new InMemoryUowPerformer(uow);
    const useCase = makeGetLastBroadcastFeedback({ uowPerformer });

    const currentUser: ConnectedUser = {
      id: "user-1",
      email: "test@example.com",
      firstName: "Test",
      lastName: "User",
      createdAt: "2023-01-01T00:00:00.000Z",
      proConnect: null,
      agencyRights: [],
      establishments: [],
      isBackofficeAdmin: false,
      dashboards: {
        agencies: {},
        establishments: {},
      },
    };

    const result = await useCase.execute("convention-id-1", currentUser);

    expect(result).toBeNull();
  });

  it("should return the last broadcast feedback when it exists", async () => {
    const uow = createInMemoryUow();
    const uowPerformer = new InMemoryUowPerformer(uow);
    const useCase = makeGetLastBroadcastFeedback({ uowPerformer });

    const currentUser: ConnectedUser = {
      id: "user-1",
      email: "test@example.com",
      firstName: "Test",
      lastName: "User",
      createdAt: "2023-01-01T00:00:00.000Z",
      proConnect: null,
      agencyRights: [],
      establishments: [],
      isBackofficeAdmin: false,
      dashboards: {
        agencies: {},
        establishments: {},
      },
    };

    const broadcastFeedback: BroadcastFeedback = {
      serviceName: "test-service",
      consumerId: "consumer-1",
      consumerName: "Test Consumer",
      requestParams: {
        conventionId: "convention-id-1",
      },
      occurredAt: new Date("2023-01-01"),
      handledByAgency: false,
    };

    await uow.broadcastFeedbacksRepository.save(broadcastFeedback);

    const result = await useCase.execute("convention-id-1", currentUser);

    expect(result).toEqual(broadcastFeedback);
  });
});
