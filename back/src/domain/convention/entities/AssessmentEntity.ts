import { AssessmentDto, ConventionDto, ConventionStatus } from "shared";
import { BadRequestError } from "../../../adapters/primary/helpers/httpErrors";
import { EntityFromDto } from "../../core/EntityFromDto";

export type AssessmentEntity = EntityFromDto<AssessmentDto, "Assessment">;

const acceptedConventionStatuses: ConventionStatus[] = [
  "ACCEPTED_BY_VALIDATOR",
];

export const createAssessmentEntity = (
  dto: AssessmentDto,
  convention: ConventionDto,
): AssessmentEntity => {
  if (!acceptedConventionStatuses.includes(convention.status))
    throw new BadRequestError(
      `Cannot create an assessment for which the convention has not been validated, status was ${convention.status}`,
    );

  return {
    _entityName: "Assessment",
    ...dto,
  };
};
