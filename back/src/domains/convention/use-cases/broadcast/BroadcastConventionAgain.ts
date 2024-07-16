import {
  InclusionConnectedUser,
  WithConventionId,
  errors,
  withConventionIdSchema,
} from "shared";
import { createTransactionalUseCase } from "../../../core/UseCase";
import { CreateNewEvent } from "../../../core/events/ports/EventBus";

export type BroadcastConventionAgain = ReturnType<
  typeof makeBroadcastConventionAgain
>;
export const makeBroadcastConventionAgain = createTransactionalUseCase<
  WithConventionId,
  void,
  InclusionConnectedUser,
  { createNewEvent: CreateNewEvent }
>(
  {
    name: "BroadcastConventionAgain",
    inputSchema: withConventionIdSchema,
  },
  async ({ conventionId }, { uow, deps }, currentUser) => {
    if (!currentUser.isBackofficeAdmin)
      throw errors.user.forbidden({ userId: currentUser.id });

    const convention =
      await uow.conventionQueries.getConventionById(conventionId);

    if (!convention)
      throw errors.convention.notFound({
        conventionId,
      });

    const broadcastConventionAgainEvent = deps.createNewEvent({
      topic: "ConventionBroadcastRequested",
      payload: {
        convention,
        triggeredBy: {
          kind: "inclusion-connected",
          userId: currentUser.id,
        },
      },
    });

    await uow.outboxRepository.save(broadcastConventionAgainEvent);
  },
);
