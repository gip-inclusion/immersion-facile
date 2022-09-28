import { ConventionDto, ConventionStatus } from "shared";
import { ImmersionAssessmentDto } from "shared";
import { BadRequestError } from "../../../adapters/primary/helpers/httpErrors";
import { EntityFromDto } from "../../core/EntityFromDto";

export type ImmersionAssessmentEntity = EntityFromDto<
  ImmersionAssessmentDto,
  "ImmersionAssessment"
>;

const acceptedConventionStatuses: ConventionStatus[] = [
  "ACCEPTED_BY_VALIDATOR",
];

export const createImmersionAssessmentEntity = (
  dto: ImmersionAssessmentDto,
  convention: ConventionDto,
): ImmersionAssessmentEntity => {
  if (!acceptedConventionStatuses.includes(convention.status))
    throw new BadRequestError(
      `Cannot create an assessment for which the convention has not been validated, status was ${convention.status}`,
    );

  return {
    _entityName: "ImmersionAssessment",
    ...dto,
  };
};
