import {
  type ConnectedUser,
  type ConventionWithBroadcastFeedback,
  type DataWithPagination,
  type PaginationQueryParams,
  paginationRequiredQueryParamsSchema,
} from "shared";
import { useCaseBuilder } from "../../core/useCaseBuilder";

export const makeGetConventionsWithErroredBroadcastFeedbackForAgencyUser =
  useCaseBuilder("ConventionsWithErroredBroadcastFeedback")
    .withInput<PaginationQueryParams>(paginationRequiredQueryParamsSchema)
    .withOutput<DataWithPagination<ConventionWithBroadcastFeedback>>()
    .withCurrentUser<ConnectedUser>()
    .build(async ({ inputParams, uow, currentUser }) => {
      const result =
        await uow.conventionQueries.getConventionsWithErroredBroadcastFeedbackForAgencyUser(
          {
            userId: currentUser.id,
            pagination: inputParams,
          },
        );
      return result;
    });
