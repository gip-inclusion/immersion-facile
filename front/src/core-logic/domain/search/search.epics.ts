import { filter, map, of, switchMap, take } from "rxjs";
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

const getOffersEpic: SearchEpic = (action$, _state$, { searchGateway }) =>
  action$.pipe(
    filter(searchSlice.actions.getOffersRequested.match),
    switchMap((action) =>
      (action.payload.isExternal === true
        ? searchGateway.getExternalOffers$({
            ...action.payload,
            appellationCode: action.payload.appellationCodes
              ? action.payload.appellationCodes[0]
              : "",
            latitude: action.payload.latitude ?? 0,
            longitude: action.payload.longitude ?? 0,
            distanceKm: action.payload.distanceKm ?? 0,
          })
        : searchGateway.getOffers$(action.payload)
      ).pipe(
        take(1),
        map((searchResultWithPagination) =>
          searchSlice.actions.getOffersSucceeded({
            searchResultsWithPagination: searchResultWithPagination,
            searchParams: action.payload,
          }),
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
  getOffersEpic,
  fetchSearchResultEpic,
  searchResultExternalProvidedEpic,
];
