import {
  errors,
  getExternalOffersFlatParamsSchema,
  type SearchResultDto,
} from "shared";
import type { RomeRepository } from "../../core/rome/ports/RomeRepository";
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
    romeRepository: RomeRepository;
  }>()
  .build(async ({ inputParams, deps }) => {
    const { appellationCodes, distanceKm, latitude, longitude, nafCodes } =
      inputParams;

    // Get ROME
    const [rome] =
      await deps.romeRepository.getAppellationAndRomeDtosFromAppellationCodesIfExist(
        appellationCodes,
      );
    if (!rome) throw errors.search.noRomeForAppellations(appellationCodes);
    const { romeCode, romeLabel } = rome;
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
