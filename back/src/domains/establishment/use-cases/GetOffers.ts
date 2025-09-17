import {
  type ApiConsumer,
  legacySearchParamsSchema,
  type SearchResultDto,
} from "shared";
import { useCaseBuilder } from "../../core/useCaseBuilder";
import type { LaBonneBoiteGateway } from "../ports/LaBonneBoiteGateway";

export const makeGetOffers = useCaseBuilder("GetOffers")
  .withInput(legacySearchParamsSchema)
  .withOutput<SearchResultDto[]>()
  .withCurrentUser<ApiConsumer>()
  .withDeps<{ laBonneBoiteGateway: LaBonneBoiteGateway }>()
  .build(async ({ inputParams, deps, uow }) => {
    const offers =
      await uow.establishmentAggregateRepository.getOffers(inputParams);
    return offers;
  });
