import {
  NafSectionSuggestion,
  SectionSuggestionsParams,
  sectionSuggestionsParamsSchema,
} from "shared";
import { createTransactionalUseCase } from "../../UseCase";

export type GetNafSuggestions = ReturnType<typeof makeGetNafSuggestions>;

export const makeGetNafSuggestions = createTransactionalUseCase<
  SectionSuggestionsParams,
  NafSectionSuggestion[],
  void,
  void
>(
  {
    inputSchema: sectionSuggestionsParamsSchema,
    name: "NafSuggestions",
  },
  async ({ inputParams: { searchText }, uow }) => {
    const sanitizedSearchText = searchText.toLowerCase();

    return uow.nafRepository.getNafSuggestions(sanitizedSearchText);
  },
);
