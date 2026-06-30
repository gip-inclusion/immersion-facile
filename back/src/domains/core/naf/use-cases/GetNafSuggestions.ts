import type { NafSectionSuggestion } from "shared";
import type { WithCache } from "../../caching-gateway/port/WithCache";
import type { UnitOfWorkPerformer } from "../../unit-of-work/ports/UnitOfWorkPerformer";
import { useCaseBuilder } from "../../useCaseBuilder";

const nafSuggestionsCacheKey = "naf_suggestions_all";
const nafSuggestionsCacheDurationInHours = 24;

export type GetNafSuggestions = ReturnType<typeof makeGetNafSuggestions>;

export const makeGetNafSuggestions = useCaseBuilder("NafSuggestions")
  .withOutput<NafSectionSuggestion[]>()
  .withDeps<{ withCache: WithCache; uowPerformer: UnitOfWorkPerformer }>()
  .notTransactional()
  .build(async ({ deps }) =>
    deps.withCache({
      overrideCacheDurationInHours: nafSuggestionsCacheDurationInHours,
      getCacheKey: () => nafSuggestionsCacheKey,
      cb: async () =>
        deps.uowPerformer.perform((uow) =>
          uow.nafRepository.getAllNafSuggestions(),
        ),
    })(nafSuggestionsCacheKey),
  );
