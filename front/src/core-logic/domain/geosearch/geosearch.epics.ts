import {
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  switchMap,
} from "rxjs";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
// import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";
import { geosearchSlice } from "./geosearch.slice";

type GeosearchAction = ActionOfSlice<typeof geosearchSlice>;

const queryMinLength = 3;
const debounceDuration = 400;

const geosearchQueryEpic: AppEpic<GeosearchAction> = (
  action$,
  _state$,
  { scheduler },
) =>
  action$.pipe(
    filter(geosearchSlice.actions.queryHasChanged.match),
    map((action) => ({ ...action, payload: action.payload.trim() })),
    filter((action) => action.payload.length >= queryMinLength),
    debounceTime(debounceDuration, scheduler),
    distinctUntilChanged(),
    map(geosearchSlice.actions.suggestionsHaveBeenRequested),
  );

const geosearchRequestEpic: AppEpic<GeosearchAction> = (
  action$,
  state$,
  { addressGateway },
) =>
  action$.pipe(
    filter(geosearchSlice.actions.suggestionsHaveBeenRequested.match),
    switchMap(() =>
      addressGateway.lookupLocation$(state$.value.geosearch.query),
    ),
    map(geosearchSlice.actions.suggestionsSuccessfullyFetched),
    catchEpicError((error) =>
      geosearchSlice.actions.suggestionsFailed(error.message),
    ),
  );
export const geosearchEpics = [geosearchQueryEpic, geosearchRequestEpic];
