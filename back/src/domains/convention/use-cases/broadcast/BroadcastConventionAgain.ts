import {
  InclusionConnectedUser,
  WithConventionId,
  errors,
  userHasEnoughRightsOnConvention,
  withConventionIdSchema,
} from "shared";
import { userHasEnoughRightsOnConvention } from "../../../../utils/convention";
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
  async ({ inputParams: { conventionId }, uow, deps, currentUser }) => {
    const convention =
      await uow.conventionQueries.getConventionById(conventionId);

    if (!convention)
      throw errors.convention.notFound({
        conventionId,
      });
    if (
      !userHasEnoughRightsOnConvention(currentUser, convention, [
        "counsellor",
        "validator",
      ])
    )
      throw errors.user.forbidden({ userId: currentUser.id });

    throwErrorIfTooManyRequests({
      lastBroadcastFeedback:
        await uow.broadcastFeedbacksRepository.getLastBroadcastFeedback(
          conventionId,
        ),
      now: deps.timeGateway.now(),
    });

    if (
      !userHasEnoughRightsOnConvention(currentUser, convention, [
        "counsellor",
        "validator",
      ])
    )
      throw errors.user.forbidden({ userId: currentUser.id });

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
