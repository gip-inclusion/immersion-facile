import {
  concatWith,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  of,
  switchMap,
} from "rxjs";
import { romeAutocompleteSlice } from "src/core-logic/domain/romeAutocomplete/romeAutocomplete.slice";
import {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";

type RomeAutocompleteAction = ActionOfSlice<typeof romeAutocompleteSlice>;

export const romeAutocompleteEpic: AppEpic<RomeAutocompleteAction> = (
  action$,
  _state$,
  { romeAutocompleteGateway, scheduler },
) =>
  action$.pipe(
    filter(romeAutocompleteSlice.actions.setRomeSearchText.match),
    filter((action) => action.payload.length > 2),
    debounceTime(400, scheduler),
    distinctUntilChanged(),
    switchMap((action) =>
      of(romeAutocompleteSlice.actions.searchStarted()).pipe(
        concatWith(
          romeAutocompleteGateway
            .getRomeDtoMatching(action.payload.trim())
            .pipe(map(romeAutocompleteSlice.actions.setRomeOptions)),
        ),
      ),
    ),
  );
