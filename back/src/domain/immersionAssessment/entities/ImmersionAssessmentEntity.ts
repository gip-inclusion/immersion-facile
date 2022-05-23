import { ImmersionAssessmentDto } from "shared/src/immersionAssessment/ImmersionAssessmentDto";
import { BadRequestError } from "../../../adapters/primary/helpers/httpErrors";
import { ImmersionApplicationEntity } from "../../immersionApplication/entities/ImmersionApplicationEntity";

type EntityFromDto<Dto> = Dto & {
  _tag: "Entity";
};

export type ImmersionAssessmentEntity = EntityFromDto<ImmersionAssessmentDto>;

export const createImmersionAssessmentEntity = (
  dto: ImmersionAssessmentDto,
  convention: ImmersionApplicationEntity,
): ImmersionAssessmentEntity => {
  if (dto.conventionId !== convention.id) {
    throw new BadRequestError(
      "Convention should match the id of the assessment",
    );
  }

  if (convention.status !== "ACCEPTED_BY_VALIDATOR")
    throw new BadRequestError(
      `Cannot create an assessment for which the convention has not been validated, status was ${convention.status}`,
    );

  return {
    _tag: "Entity",
    id: dto.id,
    conventionId: dto.conventionId,
    establishmentFeedback: dto.establishmentFeedback,
    status: dto.status,
  };
};
