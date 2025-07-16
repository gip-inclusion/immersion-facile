import {
  type NafSectionSuggestion,
  type NafSectionSuggestionsParams,
  nafSectionSuggestionsParamsSchema,
} from "shared";
import { useCaseBuilder } from "../../useCaseBuilder";

export type GetNafSuggestions = ReturnType<typeof makeGetNafSuggestions>;

export const makeGetNafSuggestions = useCaseBuilder("NafSuggestions")
  .withInput<NafSectionSuggestionsParams>(nafSectionSuggestionsParamsSchema)
  .withOutput<NafSectionSuggestion[]>()
  .build(async ({ inputParams: { searchText }, uow }) => {
    const sanitizedSearchText = searchText.toLowerCase();

    return uow.nafRepository.getNafSuggestions(sanitizedSearchText);
  });
