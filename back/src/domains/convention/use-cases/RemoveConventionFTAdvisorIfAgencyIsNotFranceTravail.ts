import {
  errors,
  type WithAgencyId,
  type WithConventionId,
  withAgencyIdSchema,
  withConventionIdSchema,
} from "shared";
import { useCaseBuilder } from "../../core/useCaseBuilder";

export type RemoveConventionFTAdvisorIfAgencyIsNotFranceTravail = ReturnType<
  typeof makeRemoveConventionFTAdvisorIfAgencyIsNotFranceTravail
>;

export const makeRemoveConventionFTAdvisorIfAgencyIsNotFranceTravail =
  useCaseBuilder("RemoveConventionFTAdvisorIfAgencyIsNotFranceTravail")
    .withInput<WithAgencyId & WithConventionId>(
      withConventionIdSchema.and(withAgencyIdSchema),
    )
    .withOutput<void>()
    .withCurrentUser<void>()
    .build(async ({ inputParams, uow }) => {
      const agency = await uow.agencyRepository.getById(inputParams.agencyId);

      if (!agency)
        throw errors.agency.notFound({
          agencyId: inputParams.agencyId,
        });

      if (agency.kind !== "pole-emploi")
        await uow.conventionFranceTravailAdvisorRepository.deleteByConventionId(
          inputParams.conventionId,
        );
    });
