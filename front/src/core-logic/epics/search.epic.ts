import { prop } from "ramda";
import { BehaviorSubject, catchError, from, map } from "rxjs";
import type { ImmersionSearchGateway } from "src/core-logic/ports/ImmersionSearchGateway";
import type {
  SearchImmersionRequestDto,
  SearchImmersionResultDto,
} from "src/shared/SearchImmersionDto";

interface SearchEpicDependencies {
  immersionSearchGateway: ImmersionSearchGateway;
}

interface SearchState {
  searchResults: SearchImmersionResultDto[];
  isSearching: boolean;
}

export const createSearchEpic = ({
  immersionSearchGateway,
}: SearchEpicDependencies) => {
  const searchState$ = new BehaviorSubject<SearchState>({
    isSearching: false,
    searchResults: [],
  });

  return {
    views: {
      searchResults$: searchState$.pipe(map(prop("searchResults"))),
      isSearching$: searchState$.pipe(map(prop("isSearching"))),
    },
    actions: {
      search: (params: SearchImmersionRequestDto) => {
        searchState$.next({ ...searchState$.value, isSearching: true });
        from(immersionSearchGateway.search(params))
          .pipe(
            catchError((err) => {
              console.error(err);
              return [];
            }),
          )
          .subscribe((searchResults) =>
            searchState$.next({ searchResults, isSearching: false }),
          );
      },
    },
  };
};
