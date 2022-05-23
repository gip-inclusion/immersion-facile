import { ImmersionOutcomeDto } from "shared/src/immersionOutcome/ImmersionOutcomeDto";
import { BadRequestError } from "../../../adapters/primary/helpers/httpErrors";
import { ImmersionApplicationEntity } from "../../immersionApplication/entities/ImmersionApplicationEntity";

type EntityFromDto<Dto> = Dto & {
  _tag: "Entity";
};

export type ImmersionOutcomeEntity = EntityFromDto<ImmersionOutcomeDto>;

export const createImmersionOutcomeEntity = (
  dto: ImmersionOutcomeDto,
  convention: ImmersionApplicationEntity,
): ImmersionOutcomeEntity => {
  if (dto.conventionId !== convention.id) {
    throw new BadRequestError("Convention should match the id of the outcome");
  }

  if (convention.status !== "ACCEPTED_BY_VALIDATOR")
    throw new BadRequestError(
      `Cannot create an outcome for which the convention has not been validated, status was ${convention.status}`,
    );

  return {
    _tag: "Entity",
    id: dto.id,
    conventionId: dto.conventionId,
    establishmentFeedback: dto.establishmentFeedback,
    status: dto.status,
  };
};
