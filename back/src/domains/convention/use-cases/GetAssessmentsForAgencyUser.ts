import { uniq } from "ramda";
import type { AssessmentDto, ConnectedUser, LegacyAssessmentDto } from "shared";
import { useCaseBuilder } from "../../core/useCaseBuilder";
import { toAssessmentDto } from "../entities/AssessmentEntity";

export type GetAssessmentsForAgencyUser = ReturnType<
  typeof makeGetAssessmentsForAgencyUser
>;
export const makeGetAssessmentsForAgencyUser = useCaseBuilder(
  "GetAssessmentsForAgencyUser",
)
  .withOutput<(AssessmentDto | LegacyAssessmentDto)[]>()
  .withCurrentUser<ConnectedUser>()
  .build(async ({ uow, currentUser }) => {
    const userAgencyIds = uniq(
      currentUser.agencyRights
        .filter((agencyRight) => agencyRight.roles.length > 0)
        .map((agencyRight) => agencyRight.agency.id),
    );

    if (userAgencyIds.length === 0) return [];

    const conventions = await uow.conventionQueries.getConventions({
      filters: {
        agencyIds: userAgencyIds,
        withStatuses: ["ACCEPTED_BY_VALIDATOR"],
      },
      sortBy: "dateStart",
    });

    const conventionIds = conventions.map((convention) => convention.id);
    if (conventionIds.length === 0) return [];

    const assessmentEntities =
      await uow.assessmentRepository.getByConventionIds(conventionIds);

    return assessmentEntities.map(toAssessmentDto);
  });
