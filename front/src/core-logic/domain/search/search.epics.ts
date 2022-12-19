import { concatWith, filter, map, of, switchMap, take } from "rxjs";
import { searchSlice } from "src/core-logic/domain/search/search.slice";
import {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";

type SearchAction = ActionOfSlice<typeof searchSlice>;

type SearchEpic = AppEpic<SearchAction>;

const initialSearchEpic: SearchEpic = (
  action$,
  _state$,
  { immersionSearchGateway },
) =>
  action$.pipe(
    filter(searchSlice.actions.searchRequested.match),
    switchMap((action) =>
      immersionSearchGateway
        .search({
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
              voluntaryToImmersion: false,
            })
            .pipe(map(searchSlice.actions.extraFetchSucceeded)),
        ),
      ),
    ),
  );

const initialFullSearchEpic: SearchEpic = (
  action$,
  _state$,
  { immersionSearchGateway },
) =>
  action$.pipe(
    filter(searchSlice.actions.initialFullSearchRequested.match),
    switchMap((action) =>
      immersionSearchGateway
        .search({
          ...action.payload,
        })
        .pipe(
          take(1),
          map((results) =>
            searchSlice.actions.initialFullSearchSucceeded({
              results,
              searchParams: action.payload,
            }),
          ),
        ),
    ),
  );

export const searchEpics = [
  initialSearchEpic,
  extraFetchEpic,
  initialFullSearchEpic,
];
