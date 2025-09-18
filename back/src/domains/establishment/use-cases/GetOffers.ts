import {
  type ApiConsumer,
  type DataWithPagination,
  getOffersParamsSchema,
  type SearchResultDto,
} from "shared";
import { useCaseBuilder } from "../../core/useCaseBuilder";
import type { LaBonneBoiteGateway } from "../ports/LaBonneBoiteGateway";

export const makeGetOffers = useCaseBuilder("GetOffers")
  .withInput(getOffersParamsSchema)
  .withOutput<DataWithPagination<SearchResultDto>>()
  .withCurrentUser<ApiConsumer>()
  .withDeps<{ laBonneBoiteGateway: LaBonneBoiteGateway }>()
  .build(async ({ inputParams, deps, uow }) => {
    const offers =
      await uow.establishmentAggregateRepository.getOffers(inputParams);
    return offers;
  });
