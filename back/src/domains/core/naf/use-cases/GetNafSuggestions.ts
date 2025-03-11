import {
  type NafSectionSuggestion,
  type NafSectionSuggestionsParams,
  nafSectionSuggestionsParamsSchema,
} from "shared";
import { createTransactionalUseCase } from "../../UseCase";

export type GetNafSuggestions = ReturnType<typeof makeGetNafSuggestions>;

export const makeGetNafSuggestions = createTransactionalUseCase<
  NafSectionSuggestionsParams,
  NafSectionSuggestion[],
  void,
  void
>(
  {
    inputSchema: nafSectionSuggestionsParamsSchema,
    name: "NafSuggestions",
  },
  async ({ inputParams: { searchText }, uow }) => {
    const sanitizedSearchText = searchText.toLowerCase();

    return uow.nafRepository.getNafSuggestions(sanitizedSearchText);
  },
);
