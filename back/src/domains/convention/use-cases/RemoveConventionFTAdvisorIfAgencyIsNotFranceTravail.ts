import { errors } from "shared";
import type { TransferConventionToAgencyPayload } from "../../core/events/eventPayload.dto";
import { transferConventionToAgencyPayloadSchema } from "../../core/events/eventPayload.schema";
import { useCaseBuilder } from "../../core/useCaseBuilder";

export type RemoveConventionFTAdvisorIfAgencyIsNotFranceTravail = ReturnType<
  typeof makeRemoveConventionFTAdvisorIfAgencyIsNotFranceTravail
>;

export const makeRemoveConventionFTAdvisorIfAgencyIsNotFranceTravail =
  useCaseBuilder("RemoveConventionFTAdvisorIfAgencyIsNotFranceTravail")
    .withInput<TransferConventionToAgencyPayload>(
      transferConventionToAgencyPayloadSchema,
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
          inputParams.convention.id,
        );
    });
