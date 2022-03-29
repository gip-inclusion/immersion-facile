import {
  BehaviorSubject,
  catchError,
  concat,
  filter,
  from,
  map,
  Observable,
  of,
  switchMap,
} from "rxjs";
import type { ImmersionSearchGateway } from "src/core-logic/ports/ImmersionSearchGateway";
import type {
  SearchImmersionRequestDto,
  SearchImmersionResultDto,
} from "src/shared/SearchImmersionDto";

interface SearchEpicDependencies {
  immersionSearchGateway: ImmersionSearchGateway;
}

type SearchStatus = "noSearchMade" | "ok" | "loading" | "error";

export const createSearchEpic = ({
  immersionSearchGateway,
}: SearchEpicDependencies) => {
  const searchResults$ = new BehaviorSubject<SearchImmersionResultDto[]>([]);
  const searchStatus$ = new BehaviorSubject<SearchStatus>("noSearchMade");

  const searchInfo$: Observable<string | null> = concat(
    of("Veuillez sélectionner vos critères"),
    searchStatus$.pipe(
      filter((status) => status === "ok"),
      switchMap(() =>
        searchResults$.pipe(
          map((results) => {
            return results.length === 0
              ? "Pas de résultat. Essayez avec un plus grand rayon de recherche..."
              : null;
          }),
        ),
      ),
    ),
  );

  return {
    views: {
      searchResults$,
      isSearching$: searchStatus$.pipe(map((status) => status === "loading")),
      searchInfo$,
    },
    actions: {
      search: (params: SearchImmersionRequestDto) => {
        searchStatus$.next("loading");

        from(immersionSearchGateway.search(params))
          .pipe(
            catchError((err) => {
              console.error(err);
              searchStatus$.next("error");
              return of([]);
            }),
          )
          .subscribe((searchResults) => {
            searchResults$.next(searchResults);
            searchStatus$.next("ok");
          });
      },
    },
  };
};
