import {
  type ExternalSearchResultDto,
  errors,
  type SiretAndAppellationDto,
  siretAndAppellationSchema,
} from "shared";
import { useCaseBuilder } from "../../core/useCaseBuilder";
import type { LaBonneBoiteGateway } from "../ports/LaBonneBoiteGateway";

export type GetExternalSearchResult = ReturnType<
  typeof makeGetExternalSearchResult
>;
export const makeGetExternalSearchResult = useCaseBuilder(
  "GetExternalSearchResult",
)
  .withInput<SiretAndAppellationDto>(siretAndAppellationSchema)
  .withOutput<ExternalSearchResultDto>()
  .withCurrentUser<void>()
  .withDeps<{ laBonneBoiteGateway: LaBonneBoiteGateway }>()
  .build(
    async ({
      inputParams: { siret, appellationCode },
      deps: { laBonneBoiteGateway },
      uow,
    }) => {
      const deletedEstablishmentsById =
        await uow.deletedEstablishmentRepository.areSiretsDeleted([siret]);
      const isEstablishmentDeleted = deletedEstablishmentsById[siret];
      if (isEstablishmentDeleted)
        throw errors.establishment.notFound({ siret });

      const [appellationAndRome] =
        await uow.romeRepository.getAppellationAndRomeDtosFromAppellationCodesIfExist(
          [appellationCode],
        );

      if (!appellationAndRome)
        throw errors.establishment.offerMissing({
          siret,
          appellationCode,
          mode: "not found",
        });

      const result = await laBonneBoiteGateway.fetchCompanyBySiret(
        siret,
        appellationAndRome,
      );
      if (!result) throw errors.establishment.notFound({ siret });

      return result;
    },
  );
