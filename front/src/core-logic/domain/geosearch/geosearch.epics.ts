import {
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  mergeMap,
} from "rxjs";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import type {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";
import { geosearchSlice } from "./geosearch.slice";

type GeosearchAction = ActionOfSlice<typeof geosearchSlice>;

export const queryMinLength = 3;
export const debounceDuration = 500;

const geosearchQueryEpic: AppEpic<GeosearchAction> = (
  action$,
  _state$,
  { scheduler },
) =>
  action$.pipe(
    filter(geosearchSlice.actions.changeQueryRequested.match),
    map((action) => ({
      ...action,
      payload: {
        lookup: action.payload.lookup.trim(),
        locator: action.payload.locator,
      },
    })),
    filter((action) => action.payload.lookup.length >= queryMinLength),
    debounceTime(debounceDuration, scheduler),
    distinctUntilChanged(),
    map((action) =>
      geosearchSlice.actions.fetchSuggestionsRequested({
        locator: action.payload.locator,
        lookup: action.payload.lookup,
      }),
    ),
  );

const geosearchRequestEpic: AppEpic<GeosearchAction> = (
  action$,
  _,
  { addressGateway },
) =>
  action$.pipe(
    filter(geosearchSlice.actions.fetchSuggestionsRequested.match),
    mergeMap((action) =>
      addressGateway.lookupLocation$(action.payload.lookup).pipe(
        map((results) =>
          geosearchSlice.actions.fetchSuggestionsSucceeded({
            locator: action.payload.locator,
            suggestions: results,
          }),
        ),
        catchEpicError(() =>
          geosearchSlice.actions.fetchSuggestionsFailed({
            locator: action.payload.locator,
          }),
        ),
      ),
    ),
  );

export const geosearchEpics = [geosearchQueryEpic, geosearchRequestEpic];
