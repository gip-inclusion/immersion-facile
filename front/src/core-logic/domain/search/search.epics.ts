import { concatWith, filter, map, of, switchMap, take } from "rxjs";
import { type SearchResultDto, searchResultSchema } from "shared";
import {
  type SearchResultPayload,
  searchSlice,
} from "src/core-logic/domain/search/search.slice";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import type {
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
    switchMap(({ payload }) => {
      const searchResult$ = isSearchResultDto(payload.searchResult)
        ? of(payload.searchResult)
        : searchGateway.getSearchResult$(payload.searchResult);
      return searchResult$.pipe(
        map(searchSlice.actions.fetchSearchResultSucceeded),
        catchEpicError((error) =>
          searchSlice.actions.fetchSearchResultFailed({
            errorMessage: error.message,
            feedbackTopic: payload.feedbackTopic,
          }),
        ),
      );
    }),
  );

const searchResultExternalProvidedEpic: SearchEpic = (
  action$,
  _state$,
  { searchGateway },
) =>
  action$.pipe(
    filter(searchSlice.actions.externalSearchResultRequested.match),
    switchMap(({ payload }) =>
      searchGateway.getExternalSearchResult$(payload.siretAndAppellation).pipe(
        map(searchSlice.actions.fetchSearchResultSucceeded),
        catchEpicError((error) =>
          searchSlice.actions.fetchSearchResultFailed({
            errorMessage: error.message,
            feedbackTopic: payload.feedbackTopic,
          }),
        ),
      ),
    ),
  );

export const searchEpics = [
  initialSearchEpic,
  extraFetchEpic,
  fetchSearchResultEpic,
  searchResultExternalProvidedEpic,
];
