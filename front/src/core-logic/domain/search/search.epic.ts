import { concatWith, filter, map, of, switchMap, take } from "rxjs";
import {
  SearchAction,
  searchSlice,
} from "src/core-logic/domain/search/search.slice";
import { AppEpic } from "src/core-logic/storeConfig/redux.helpers";

type SearchEpic = AppEpic<SearchAction>;

const initialSearchEpic: SearchEpic = (
  action$,
  state$,
  { immersionSearchGateway },
) =>
  action$.pipe(
    filter(searchSlice.actions.searchRequested.match),
    switchMap((action) =>
      immersionSearchGateway
        .search({
          ...action.payload,
          voluntary_to_immersion: true,
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
  state$,
  { immersionSearchGateway, minSearchResultsToPreventRefetch },
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
          immersionSearchGateway
            .search({
              ...action.payload.searchParams,
              voluntary_to_immersion: false,
            })
            .pipe(map(searchSlice.actions.extraFetchSucceeded)),
        ),
      ),
    ),
  );

export const searchEpics = [initialSearchEpic, extraFetchEpic];
