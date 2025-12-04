import {
  errors,
  getExternalOffersFlatParamsSchema,
  type SearchResultDto,
} from "shared";
import { useCaseBuilder } from "../../core/useCaseBuilder";
import type { UuidGenerator } from "../../core/uuid-generator/ports/UuidGenerator";
import type { LaBonneBoiteGateway } from "../ports/LaBonneBoiteGateway";

const defaultPerPage = 50;

export type GetExternalOffers = ReturnType<typeof makeGetExternalOffers>;

export const makeGetExternalOffers = useCaseBuilder("GetExternalOffers")
  .withCurrentUser<undefined>()
  .withInput(getExternalOffersFlatParamsSchema)
  .withOutput<SearchResultDto[]>()
  .withDeps<{
    uuidGenerator: UuidGenerator;
    laBonneBoiteGateway: LaBonneBoiteGateway;
  }>()
  .build(async ({ inputParams, deps, uow }) => {
    const { appellationCode, distanceKm, latitude, longitude, nafCodes } =
      inputParams;

    // Get ROME
    const [romeAndAppellation] =
      await uow.romeRepository.getAppellationAndRomeDtosFromAppellationCodesIfExist(
        [appellationCode],
      );
    if (!romeAndAppellation)
      throw errors.search.noRomeForAppellations([appellationCode]);
    const { romeCode, romeLabel } = romeAndAppellation;
    return await deps.laBonneBoiteGateway.searchCompanies({
      distanceKm,
      lat: latitude,
      lon: longitude,
      romeCode,
      romeLabel,
      nafCodes,
      perPage: defaultPerPage,
      page: 1,
    });
  });
