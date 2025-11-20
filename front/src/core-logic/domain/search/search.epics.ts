import { filter, map, of, switchMap, take } from "rxjs";
import {
  type GetExternalOffersFlatQueryParams,
  type SearchResultDto,
  searchResultSchema,
} from "shared";
import {
  type GetOffersPayload,
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
      (isGetExternalOffersPayload(action.payload)
        ? searchGateway.getExternalOffers$(action.payload)
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

const isGetExternalOffersPayload = (
  payload: Pick<GetOffersPayload, "isExternal" | "appellationCodes">,
): payload is GetExternalOffersFlatQueryParams =>
  payload.isExternal === true &&
  Array.isArray(payload.appellationCodes) &&
  (payload.appellationCodes?.length ?? 0) > 0;
