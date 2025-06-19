import {
  type AssessmentDto,
  type ConventionRelatedJwtPayload,
  errors,
  type LegacyAssessmentDto,
  type WithConventionId,
  withConventionIdSchema,
} from "shared";
import { agencyWithRightToAgencyDto } from "../../../utils/agency";
import { throwForbiddenIfNotAllowedForAssessments } from "../../../utils/assessment";
import { createTransactionalUseCase } from "../../core/UseCase";
import { toAssessmentDto } from "../entities/AssessmentEntity";
import { retrieveConventionWithAgency } from "../entities/Convention";

export type GetAssessmentByConventionId = ReturnType<
  typeof makeGetAssessmentByConventionId
>;
export const makeGetAssessmentByConventionId = createTransactionalUseCase<
  WithConventionId,
  AssessmentDto | LegacyAssessmentDto,
  ConventionRelatedJwtPayload | undefined
>(
  {
    name: "GetAssessmentByConventionId",
    inputSchema: withConventionIdSchema,
  },
  async ({ uow, currentUser, inputParams }) => {
    if (!currentUser) throw errors.user.noJwtProvided();
    const { agency, convention } = await retrieveConventionWithAgency(
      uow,
      inputParams.conventionId,
    );
    await throwForbiddenIfNotAllowedForAssessments({
      mode: "GetAssessment",
      convention,
      agency: await agencyWithRightToAgencyDto(uow, agency),
      jwtPayload: currentUser,
      uow,
    });
    const assessment = await uow.assessmentRepository.getByConventionId(
      inputParams.conventionId,
    );
    if (!assessment) {
      throw errors.assessment.notFound(inputParams.conventionId);
    }
    return toAssessmentDto(assessment);
  },
);
