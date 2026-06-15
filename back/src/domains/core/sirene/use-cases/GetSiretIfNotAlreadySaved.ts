import {
  errors,
  getSiretRequestSchema,
  type SiretEstablishmentDto,
} from "shared";
import { useCaseBuilder } from "../../useCaseBuilder";
import { getSiretEstablishmentFromApi } from "../helpers/getSirenEstablishmentFromApi";
import type { SiretGateway } from "../ports/SiretGateway";

export type GetSiretIfNotAlreadySaved = ReturnType<
  typeof makeGetSiretIfNotAlreadySaved
>;

export const makeGetSiretIfNotAlreadySaved = useCaseBuilder(
  "GetSiretIfNotAlreadySaved",
)
  .withInput(getSiretRequestSchema)
  .withOutput<SiretEstablishmentDto>()
  .withDeps<{ siretGateway: SiretGateway }>()
  .build(async ({ inputParams, uow, deps: { siretGateway } }) => {
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

    const isEstablishmentWithProvidedSiretAlreadyInDb =
      await uow.establishmentAggregateRepository.hasEstablishmentAggregateWithSiret(
        siret,
      );

    if (isEstablishmentWithProvidedSiretAlreadyInDb)
      throw errors.establishment.conflictError({ siret });

    const siretEstablishment = await getSiretEstablishmentFromApi(
      inputParams,
      siretGateway,
    );

    if (siretEstablishment) return siretEstablishment;
    throw errors.siretApi.notFound({ siret });
  });
