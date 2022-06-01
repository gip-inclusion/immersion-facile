import { ApplicationStatus } from "shared/src/ImmersionApplication/ImmersionApplication.dto";
import { ImmersionAssessmentDto } from "shared/src/immersionAssessment/ImmersionAssessmentDto";
import { BadRequestError } from "../../../adapters/primary/helpers/httpErrors";
import { EntityFromDto } from "../../core/EntityFromDto";
import { ImmersionApplicationEntity } from "./ImmersionApplicationEntity";

export type ImmersionAssessmentEntity = EntityFromDto<
  ImmersionAssessmentDto,
  "ImmersionAssessment"
>;

const acceptedConventionStatuses: ApplicationStatus[] = [
  "ACCEPTED_BY_VALIDATOR",
  "VALIDATED",
];

export const createImmersionAssessmentEntity = (
  dto: ImmersionAssessmentDto,
  convention: ImmersionApplicationEntity,
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
