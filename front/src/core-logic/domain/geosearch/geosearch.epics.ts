import {
  concatWith,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  of,
  switchMap,
} from "rxjs";
import {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";
import { geosearchSlice } from "./geosearch.slice";

type GeosearchAction = ActionOfSlice<typeof geosearchSlice>;

const queryMinLength = 3;
const debounceDuration = 400;

export const geosearchLookupEpic: AppEpic<GeosearchAction> = (
  action$,
  _state$,
  { addressGateway, scheduler },
) =>
  action$.pipe(
    filter(geosearchSlice.actions.queryHasChanged.match),
    map((action) => ({ ...action, payload: action.payload.trim() })),
    filter((action) => action.payload.length >= queryMinLength),
    debounceTime(debounceDuration, scheduler),
    distinctUntilChanged(),
    switchMap((action) =>
      of(geosearchSlice.actions.suggestionsHaveBeenRequested()).pipe(
        concatWith(
          addressGateway
            .lookupLocation$(action.payload)
            .pipe(map(geosearchSlice.actions.suggestionsSuccessfullyFetched)),
        ),
      ),
    ),
  );

export const geosearchEpics = [geosearchLookupEpic];
