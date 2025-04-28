import {
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  switchMap,
} from "rxjs";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import type {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";
import { appellationSlice } from "./appellation.slice";

type AppellationAction = ActionOfSlice<typeof appellationSlice>;

export const queryMinLength = 3;
export const debounceDuration = 500;

const appellationQueryEpic: AppEpic<AppellationAction> = (
  action$,
  _state$,
  { scheduler },
) =>
  action$.pipe(
    filter(appellationSlice.actions.queryHasChanged.match),
    map((action) => ({
      ...action,
      payload: {
        ...action.payload,
        lookupAppellation: action.payload.lookupAppellation.trim(),
      },
    })),
    filter(
      (action) => action.payload.lookupAppellation.length >= queryMinLength,
    ),
    debounceTime(debounceDuration, scheduler),
    distinctUntilChanged(),
    map((action) =>
      appellationSlice.actions.suggestionsHaveBeenRequested({
        locator: action.payload.locator,
        lookupAppellation: action.payload.lookupAppellation,
      }),
    ),
  );

const appellationRequestEpic: AppEpic<AppellationAction> = (
  action$,
  _,
  { formCompletionGateway },
) =>
  action$.pipe(
    filter(appellationSlice.actions.suggestionsHaveBeenRequested.match),
    switchMap((action) => {
      return formCompletionGateway
        .getAppellationDtoMatching$(action.payload.lookupAppellation, true)
        .pipe(
          map((suggestions) => ({
            suggestions,
            locator: action.payload.locator,
          })),
          map(appellationSlice.actions.suggestionsSuccessfullyFetched),
          catchEpicError((error) =>
            appellationSlice.actions.suggestionsFailed(error.message),
          ),
        );
    }),
  );

export const appellationEpics = [appellationQueryEpic, appellationRequestEpic];
