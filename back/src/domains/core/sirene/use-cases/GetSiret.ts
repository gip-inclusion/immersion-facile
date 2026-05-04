import {
  errors,
  type GetSiretRequestDto,
  getSiretRequestSchema,
  type SiretEstablishmentDto,
} from "shared";
import { useCaseBuilder } from "../../useCaseBuilder";
import { getSiretEstablishmentFromApi } from "../helpers/getSirenEstablishmentFromApi";
import type { SiretGateway } from "../ports/SiretGateway";

export type GetSiret = ReturnType<typeof makeGetSiret>;

export const makeGetSiret = useCaseBuilder("GetSiret")
  .withInput<GetSiretRequestDto>(getSiretRequestSchema)
  .withOutput<SiretEstablishmentDto | null>()
  .withDeps<{ siretGateway: SiretGateway }>()
  .build(async ({ inputParams, deps, uow }) => {
    const { siret } = inputParams;
    if (
      await uow.bannedEstablishmentRepository.getBannedEstablishmentBySiret(
        siret,
      )
    ) {
      throw errors.establishment.bannedEstablishment({
        siret,
      });
    }
    return getSiretEstablishmentFromApi(inputParams, deps.siretGateway);
  });
