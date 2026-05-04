import {
  type ConnectedUser,
  type ConventionWithUnfinalizedAssessment,
  type DataWithPagination,
  getPaginationParamsForWeb,
  paginationRequiredQueryParamsSchema,
} from "shared";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { useCaseBuilder } from "../../core/useCaseBuilder";

export type GetConventionsWithUnfinalizedAssessment = ReturnType<
  typeof makeGetConventionsWithUnfinalizedAssessment
>;

export const makeGetConventionsWithUnfinalizedAssessment = useCaseBuilder(
  "GetConventionsWithUnfinalizedAssessment",
)
  .withInput(paginationRequiredQueryParamsSchema)
  .withOutput<DataWithPagination<ConventionWithUnfinalizedAssessment>>()
  .withCurrentUser<ConnectedUser>()
  .withDeps<{ timeGateway: TimeGateway }>()
  .build(async ({ inputParams, uow, currentUser, deps }) => {
    const pagination = getPaginationParamsForWeb(inputParams);

    return uow.conventionQueries.getConventionsWithUnfinalizedAssessmentForAgencyUser(
      {
        userAgencyIds: currentUser.agencyRights
          .filter((agencyRight) => agencyRight.roles.length > 0)
          .map((agencyRight) => agencyRight.agency.id),
        pagination,
        now: deps.timeGateway.now(),
      },
    );
  });
