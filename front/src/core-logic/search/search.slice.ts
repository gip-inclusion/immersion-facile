import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { SearchImmersionRequestDto } from "src/shared/searchImmersion/SearchImmersionRequest.dto";
import { SearchImmersionResultDto } from "src/shared/searchImmersion/SearchImmersionResult.dto";
import { OmitFromExistingKeys } from "src/shared/utils";

type SearchParams = OmitFromExistingKeys<
  SearchImmersionRequestDto,
  "voluntary_to_immersion"
>;

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
    searchRequested: (state, action: PayloadAction<SearchParams>) => {
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

type ValueOf<T> = T[keyof T];

export type SearchAction = ReturnType<ValueOf<typeof searchSlice.actions>>;
