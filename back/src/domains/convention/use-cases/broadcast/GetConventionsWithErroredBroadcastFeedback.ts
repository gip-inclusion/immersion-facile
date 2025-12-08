import {
  type ConnectedUser,
  type ConventionWithBroadcastFeedback,
  type DataWithPagination,
  type GetConventionsWithErroredBroadcastFeedbackParams,
  getConventionsWithErroredBroadcastFeedbackParamsSchema,
  getPaginationParamsForWeb,
} from "shared";
import { useCaseBuilder } from "../../../core/useCaseBuilder";

export type GetConventionsWithErroredBroadcastFeedback = ReturnType<
  typeof makeGetConventionsWithErroredBroadcastFeedback
>;

export const makeGetConventionsWithErroredBroadcastFeedback = useCaseBuilder(
  "GetConventionsWithErroredBroadcastFeedback",
)
  .withInput<GetConventionsWithErroredBroadcastFeedbackParams>(
    getConventionsWithErroredBroadcastFeedbackParamsSchema,
  )
  .withOutput<DataWithPagination<ConventionWithBroadcastFeedback>>()
  .withCurrentUser<ConnectedUser>()
  .build(async ({ inputParams, uow, currentUser }) => {
    const { filters } = inputParams;

    const pagination = getPaginationParamsForWeb(inputParams.pagination);

    return uow.conventionQueries.getConventionsWithErroredBroadcastFeedbackForAgencyUser(
      {
        userAgencyIds: currentUser.agencyRights
          .filter((agencyRight) => agencyRight.roles.length > 0)
          .map((agencyRight) => agencyRight.agency.id),
        pagination,
        filters,
      },
    );
  });
