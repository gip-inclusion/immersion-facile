import type { NafSectionSuggestion } from "shared";
import { useCaseBuilder } from "../../useCaseBuilder";

export type GetNafSuggestions = ReturnType<typeof makeGetNafSuggestions>;

export const makeGetNafSuggestions = useCaseBuilder("NafSuggestions")
  .withOutput<NafSectionSuggestion[]>()
  .build(async ({ uow }) => {
    return uow.nafRepository.getAllNafSuggestions();
  });
