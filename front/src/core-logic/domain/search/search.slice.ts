import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  AppellationAndRomeDto,
  OmitFromExistingKeys,
  SearchImmersionParamsDto,
  SearchImmersionResultDto,
} from "shared";

export type SearchParams = OmitFromExistingKeys<
  SearchImmersionParamsDto,
  "voluntaryToImmersion"
> &
  Partial<AppellationAndRomeDto>;

export type SearchPageParams = Exclude<SearchParams, "romeCode">;

export type SearchStatus =
  | "noSearchMade"
  | "ok"
  | "initialFetch"
  | "extraFetch"
  | "error";

interface SearchState {
  searchStatus: SearchStatus;
  searchResults: SearchImmersionResultDto[];
}

const initialState: SearchState = {
  searchStatus: "noSearchMade",
  searchResults: [],
};

export const searchSlice = createSlice({
  name: "search",
  initialState,
  reducers: {
    searchRequested: (state, _action: PayloadAction<SearchParams>) => {
      state.searchStatus = "initialFetch";
      state.searchResults = [];
    },
    initialSearchSucceeded: (
      state,
      action: PayloadAction<{
        results: SearchImmersionResultDto[];
        searchParams: SearchParams;
      }>,
    ) => {
      state.searchResults = action.payload.results;
      state.searchStatus = "ok";
    },
    extraFetchRequested: (state) => {
      state.searchStatus = "extraFetch";
    },
    extraFetchSucceeded: (
      state,
      action: PayloadAction<SearchImmersionResultDto[]>,
    ) => {
      state.searchResults.push(...action.payload);
      state.searchStatus = "ok";
    },
  },
});
