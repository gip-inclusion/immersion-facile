import {
  SearchResultDto,
  SiretAndAppellationDto,
  errors,
  siretAndAppellationSchema,
} from "shared";
import { createTransactionalUseCase } from "../../core/UseCase";
import { LaBonneBoiteGateway } from "../ports/LaBonneBoiteGateway";

export type GetExternalSearchResult = ReturnType<
  typeof makeGetExternalSearchResult
>;
export const makeGetExternalSearchResult = createTransactionalUseCase<
  SiretAndAppellationDto,
  SearchResultDto,
  void,
  { laBonneBoiteGateway: LaBonneBoiteGateway }
>(
  { name: "GetExternalSearchResult", inputSchema: siretAndAppellationSchema },
  async ({
    inputParams: { siret, appellationCode },
    deps: { laBonneBoiteGateway },
    uow,
  }) => {
    const deletedEstablishmentsById =
      await uow.deletedEstablishmentRepository.areSiretsDeleted([siret]);
    const isEstablishmentDeleted = deletedEstablishmentsById[siret];
    if (isEstablishmentDeleted) throw errors.establishment.notFound({ siret });

    const [appellationAndRome] =
      await uow.romeRepository.getAppellationAndRomeDtosFromAppellationCodes([
        appellationCode,
      ]);
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
