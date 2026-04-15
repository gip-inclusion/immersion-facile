import {
  type ConnectedUser,
  errors,
  type SiretDto,
  siretSchema,
  zStringMinLength1Max1024,
} from "shared";
import z from "zod";
import { throwIfNotAdmin } from "../../connected-users/helpers/authorization.helper";
import { useCaseBuilder } from "../../core/useCaseBuilder";

export type BannedEstablishment = {
  siret: SiretDto;
  bannishmentJustification: string;
};

export const banEstablishmentSchema = z.object({
  siret: siretSchema,
  bannishmentJustification: zStringMinLength1Max1024,
});

export type BanEstablishment = ReturnType<typeof makeBanEstablishment>;

export const makeBanEstablishment = useCaseBuilder("BanEstablishment")
  .withInput(banEstablishmentSchema)
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
