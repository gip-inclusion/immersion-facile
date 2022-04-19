import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  filter,
  switchMap,
  map,
  of,
  concatWith,
  debounceTime,
  distinctUntilChanged,
} from "rxjs";
import {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";
import { RomeCode } from "src/shared/rome";
import { RomeDto } from "src/shared/romeAndAppellationDtos/romeAndAppellation.dto";

interface RomeAutocompleteState {
  romeSearchText: string;
  romeOptions: RomeDto[];
  selectedRome: RomeCode | null;
  isSearching: boolean;
}

const initialState: RomeAutocompleteState = {
  romeSearchText: "",
  romeOptions: [],
  selectedRome: null,
  isSearching: false,
};

export const romeAutocompleteSlice = createSlice({
  name: "romeAutocomplete",
  initialState,
  reducers: {
    setRomeSearchText: (state, action: PayloadAction<string>) => {
      state.romeSearchText = action.payload;
    },
    searchStarted: (state) => {
      state.isSearching = true;
    },
    setRomeOptions: (state, action: PayloadAction<RomeDto[]>) => {
      state.romeOptions = action.payload;
      state.isSearching = false;
    },
    setSelectedRome: (state, action: PayloadAction<RomeCode | null>) => {
      state.selectedRome = action.payload;
    },
  },
});

type RomeAutocompleteAction = ActionOfSlice<typeof romeAutocompleteSlice>;

export const romeAutocompleteEpic: AppEpic<RomeAutocompleteAction> = (
  action$,
  _state$,
  { romeAutocompleteGateway },
) =>
  action$.pipe(
    filter(romeAutocompleteSlice.actions.setRomeSearchText.match),
    debounceTime(400),
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
