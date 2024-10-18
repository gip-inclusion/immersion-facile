import {
  addHours,
  formatDuration,
  intervalToDuration,
  isBefore,
} from "date-fns";
import fr from "date-fns/locale/fr";
import {
  InclusionConnectedUser,
  WithConventionId,
  errors,
  userHasEnoughRightsOnConvention,
  withConventionIdSchema,
} from "shared";
import { createTransactionalUseCase } from "../../../core/UseCase";
import { CreateNewEvent } from "../../../core/events/ports/EventBus";
import { BroadcastFeedback } from "../../../core/saved-errors/ports/BroadcastFeedbacksRepository";
import { TimeGateway } from "../../../core/time-gateway/ports/TimeGateway";

const BROADCAST_FEEDBACK_DEBOUNCE_HOUR = 4;

export type BroadcastConventionAgain = ReturnType<
  typeof makeBroadcastConventionAgain
>;

export const makeBroadcastConventionAgain = createTransactionalUseCase<
  WithConventionId,
  void,
  InclusionConnectedUser,
  { createNewEvent: CreateNewEvent; timeGateway: TimeGateway }
>(
  {
    name: "BroadcastConventionAgain",
    inputSchema: withConventionIdSchema,
  },
  async ({ inputParams: { conventionId }, uow, deps, currentUser }) => {
    const convention = await uow.conventionRepository.getById(conventionId);

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

    await uow.outboxRepository.save(
      deps.createNewEvent({
        topic: "ConventionBroadcastRequested",
        payload: {
          convention,
          triggeredBy: {
            kind: "inclusion-connected",
            userId: currentUser.id,
          },
        },
      }),
    );
  },
);

const throwErrorIfTooManyRequests = (params: {
  lastBroadcastFeedback: BroadcastFeedback | null;
  now: Date;
}) => {
  if (!params.lastBroadcastFeedback) return;

  const lastBroadcastDate = params.lastBroadcastFeedback.occurredAt;
  const broadcastPossibleDate = addHours(
    lastBroadcastDate,
    BROADCAST_FEEDBACK_DEBOUNCE_HOUR,
  );
  const isEnoughTimeSinceLastBroadcast = isBefore(
    broadcastPossibleDate,
    params.now,
  );

  if (!isEnoughTimeSinceLastBroadcast) {
    const duration = intervalToDuration({
      start: params.now,
      end: broadcastPossibleDate,
    });

    const formattedDuration = formatDuration(duration, {
      format: ["hours", "minutes"],
      locale: fr,
    });

    throw errors.broadcastFeedback.tooManyRequests({
      lastBroadcastDate,
      formattedWaitingTime: formattedDuration,
    });
  }
};
