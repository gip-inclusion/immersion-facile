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
import { RomeCode } from "shared/src/rome";
import { RomeDto } from "shared/src/romeAndAppellationDtos/romeAndAppellation.dto";

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
      state.selectedRome = null;
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
      state.romeSearchText =
        state.romeOptions.find(({ romeCode }) => romeCode === action.payload)
          ?.romeLabel ?? state.romeSearchText;
    },
  },
});

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
