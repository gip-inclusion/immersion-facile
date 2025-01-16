import { AssessmentDto, ConventionDto, ConventionStatus, errors } from "shared";
import { EntityFromDto } from "../../../utils/EntityFromDto";

export type AssessmentEntity = EntityFromDto<AssessmentDto, "Assessment">;

export const acceptedConventionStatusesForAssessment: ConventionStatus[] = [
  "ACCEPTED_BY_VALIDATOR",
];

export const createAssessmentEntity = (
  dto: AssessmentDto,
  convention: ConventionDto,
): AssessmentEntity => {
  if (!acceptedConventionStatusesForAssessment.includes(convention.status))
    throw errors.assessment.badStatus(convention.status);

  return {
    _entityName: "Assessment",
    ...dto,
  };
};

export const toAssessmentDto = ({
  _entityName,
  ...assessmentEntity
}: AssessmentEntity): AssessmentDto => assessmentEntity;
