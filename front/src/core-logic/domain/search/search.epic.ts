import { Epic } from "redux-observable";
import { concatWith, filter, from, map, of, switchMap, take, tap } from "rxjs";
import { Dependencies } from "src/app/config/dependencies";
import {
  SearchAction,
  searchSlice,
} from "src/core-logic/domain/search/search.slice";
import { RootState } from "src/core-logic/storeConfig/store";

type SearchEpic = Epic<SearchAction, SearchAction, RootState, Dependencies>;

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
