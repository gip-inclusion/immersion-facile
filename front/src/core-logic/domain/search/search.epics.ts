import { concatWith, filter, map, of, switchMap, take } from "rxjs";
import { SearchResultDto, searchResultSchema } from "shared";
import {
  SearchResultPayload,
  searchSlice,
} from "src/core-logic/domain/search/search.slice";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";

type SearchAction = ActionOfSlice<typeof searchSlice>;

type SearchEpic = AppEpic<SearchAction>;

const initialSearchEpic: SearchEpic = (action$, _state$, { searchGateway }) =>
  action$.pipe(
    filter(searchSlice.actions.searchRequested.match),
    switchMap((action) =>
      searchGateway
        .search$({
          ...action.payload,
          voluntaryToImmersion: true,
        })
        .pipe(
          take(1),
          map((results) =>
            searchSlice.actions.initialSearchSucceeded({
              results,
              searchParams: action.payload,
            }),
          ),
        ),
    ),
  );

const extraFetchEpic: SearchEpic = (
  action$,
  _state$,
  { searchGateway, minSearchResultsToPreventRefetch },
) =>
  action$.pipe(
    filter(searchSlice.actions.initialSearchSucceeded.match),
    filter(
      (action) =>
        action.payload.results.length < minSearchResultsToPreventRefetch,
    ),
    switchMap((action) =>
      of(searchSlice.actions.extraFetchRequested()).pipe(
        concatWith(
          searchGateway
            .search$({
              ...action.payload.searchParams,
              voluntaryToImmersion: false,
            })
            .pipe(map(searchSlice.actions.extraFetchSucceeded)),
        ),
      ),
    ),
  );

const isSearchResultDto = (
  payload: SearchResultPayload | SearchResultDto,
): payload is SearchResultDto => searchResultSchema.safeParse(payload).success;

const fetchSearchResultEpic: SearchEpic = (
  action$,
  _state$,
  { searchGateway },
) =>
  action$.pipe(
    filter(searchSlice.actions.fetchSearchResultRequested.match),
    switchMap(({ payload }) =>
      isSearchResultDto(payload)
        ? of(payload)
        : searchGateway.getSearchResult$(payload),
    ),
    map(searchSlice.actions.fetchSearchResultSucceeded),
    catchEpicError((error) =>
      searchSlice.actions.fetchSearchResultFailed(error.message),
    ),
  );
export const searchEpics = [
  initialSearchEpic,
  extraFetchEpic,
  fetchSearchResultEpic,
];
