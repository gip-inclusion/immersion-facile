import {
  type ApiConsumer,
  errors,
  type InternalOfferDto,
  searchResultQuerySchema,
} from "shared";
import { useCaseBuilder } from "../../core/useCaseBuilder";

export type GetSearchResultBySearchQuery = ReturnType<
  typeof makeGetSearchResultBySearchQuery
>;

export const makeGetSearchResultBySearchQuery = useCaseBuilder(
  "GetSearchResultBySearchQuery",
)
  .withInput(searchResultQuerySchema)
  .withOutput<InternalOfferDto>()
  .withCurrentUser<ApiConsumer | void>()
  .build(
    async ({ inputParams: { appellationCode, siret, locationId }, uow }) => {
      const searchResult =
        await uow.establishmentAggregateRepository.getSearchResultBySearchQuery(
          siret,
          appellationCode,
          locationId,
        );

      if (!searchResult)
        throw errors.establishment.offerMissing({
          appellationCode,
          siret,
          mode: "not found",
        });

      return searchResult;
    },
  );
