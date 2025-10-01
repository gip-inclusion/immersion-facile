import {
  type ConnectedUser,
  type ConventionId,
  type ConventionLastBroadcastFeedbackResponse,
  conventionIdSchema,
  errors,
} from "shared";
import { getUserWithRights } from "../../connected-users/helpers/userRights.helper";
import { useCaseBuilder } from "../../core/useCaseBuilder";

export type GetLastBroadcastFeedback = ReturnType<
  typeof makeGetLastBroadcastFeedback
>;
export const makeGetLastBroadcastFeedback = useCaseBuilder(
  "GetLastBroadcastFeedback",
)
  .withInput<ConventionId>(conventionIdSchema)
  .withOutput<ConventionLastBroadcastFeedbackResponse>()
  .withCurrentUser<ConnectedUser>()
  .build(async ({ uow, currentUser, inputParams }) => {
    const convention = await uow.conventionRepository.getById(inputParams);
    if (!convention)
      throw errors.convention.notFound({
        conventionId: inputParams,
      });

    const userWithRights = await getUserWithRights(uow, currentUser.id);
    const userAgencyRights = userWithRights.agencyRights.find(
      (agencyRight) => agencyRight.agency.id === convention.agencyId,
    );

    if (userAgencyRights || currentUser.isBackofficeAdmin)
      return uow.broadcastFeedbacksRepository.getLastBroadcastFeedback(
        inputParams,
      );
    throw errors.user.forbidden({
      userId: currentUser.id,
    });
  });
