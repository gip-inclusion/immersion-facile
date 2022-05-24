import { ImmersionAssessmentDto } from "shared/src/immersionAssessment/ImmersionAssessmentDto";
import { BadRequestError } from "../../../adapters/primary/helpers/httpErrors";
import { EntityFromDto } from "../../core/EntityFromDto";
import { ImmersionApplicationEntity } from "../../immersionApplication/entities/ImmersionApplicationEntity";

export type ImmersionAssessmentEntity = EntityFromDto<
  ImmersionAssessmentDto,
  "ImmersionAssessment"
>;

export const createImmersionAssessmentEntity = (
  dto: ImmersionAssessmentDto,
  convention: ImmersionApplicationEntity,
): ImmersionAssessmentEntity => {
  if (convention.status !== "ACCEPTED_BY_VALIDATOR")
    throw new BadRequestError(
      `Cannot create an assessment for which the convention has not been validated, status was ${convention.status}`,
    );

  return {
    _entityName: "ImmersionAssessment",
    id: dto.id,
    conventionId: dto.conventionId,
    establishmentFeedback: dto.establishmentFeedback,
    status: dto.status,
  };
};
