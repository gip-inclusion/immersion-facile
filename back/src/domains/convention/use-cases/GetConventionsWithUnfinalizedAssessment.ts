import {
  type AgencyRole,
  type ConnectedUser,
  type ConventionWithUnfinalizedAssessment,
  type DataWithPagination,
  errors,
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
    const allowedAgencyRoles: AgencyRole[] = [
      "agency-admin",
      "agency-viewer",
      "counsellor",
      "validator",
    ];

    const allowedAgencyRights = currentUser.agencyRights.filter((agencyRight) =>
      agencyRight.roles.some((role) => allowedAgencyRoles.includes(role)),
    );

    if (!allowedAgencyRights.length)
      throw errors.agencies.noAgencyRights(currentUser.id);

    return uow.conventionQueries.getConventionsWithUnfinalizedAssessmentForAgencyUser(
      {
        userAgencyIds: allowedAgencyRights.map(
          (agencyRight) => agencyRight.agency.id,
        ),
        pagination: getPaginationParamsForWeb(inputParams),
        now: deps.timeGateway.now(),
      },
    );
  });
