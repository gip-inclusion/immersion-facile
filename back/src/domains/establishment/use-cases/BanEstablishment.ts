import {
  banEstablishmentPayloadSchema,
  type ConnectedUser,
  errors,
} from "shared";
import { throwIfNotAdmin } from "../../connected-users/helpers/authorization.helper";
import { useCaseBuilder } from "../../core/useCaseBuilder";

export type BanEstablishment = ReturnType<typeof makeBanEstablishment>;

export const makeBanEstablishment = useCaseBuilder("BanEstablishment")
  .withInput(banEstablishmentPayloadSchema)
  .withCurrentUser<ConnectedUser>()
  .build(async ({ uow, inputParams, currentUser }) => {
    throwIfNotAdmin(currentUser);

    if (
      await uow.bannedEstablishmentRepository.getBannedEstablishmentBySiret(
        inputParams.siret,
      )
    ) {
      throw errors.bannedEstablishment.alreadyBanned({
        siret: inputParams.siret,
      });
    }

    await uow.bannedEstablishmentRepository.banEstablishment({
      siret: inputParams.siret,
      bannishmentJustification: inputParams.bannishmentJustification,
    });
  });
