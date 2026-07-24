import { archivedConventionRequestSchema, type ConnectedUser } from "shared";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { useCaseBuilder } from "../../core/useCaseBuilder";

export type AddArchivedConventionRequest = ReturnType<
  typeof makeAddArchivedConventionRequest
>;

export const makeAddArchivedConventionRequest = useCaseBuilder(
  "AddArchivedConventionRequest",
)
  .withInput(archivedConventionRequestSchema)
  .withCurrentUser<ConnectedUser>()
  .withDeps<{
    createNewEvent: CreateNewEvent;
    timeGateway: TimeGateway;
  }>()
  .build(async ({ uow, inputParams, currentUser, deps }) => {
    await uow.archivedConventionRequestRepository.save({
      ...inputParams,
      userId: currentUser.id,
      createdAt: deps.timeGateway.now().toISOString(),
    });

    await uow.outboxRepository.save(
      deps.createNewEvent({
        topic: "ArchivedConventionRequestCreated",
        payload: {
          archivedConventionRequestId: inputParams.id,
          triggeredBy: {
            kind: "connected-user",
            userId: currentUser.id,
          },
        },
      }),
    );
  });
