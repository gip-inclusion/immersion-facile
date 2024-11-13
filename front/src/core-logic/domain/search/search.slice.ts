import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import {
  AppellationAndRomeDto,
  SearchQueryBaseWithoutAppellationsAndRomeDto,
  SearchQueryParamsDto,
  SearchResultDto,
  SearchResultQuery,
  WithAcquisition,
} from "shared";
import { SubmitFeedBack } from "../SubmitFeedback";

export type SearchResultPayload = SearchResultQuery | SearchResultDto;

type SearchFeedback = SubmitFeedBack<"success">;

export type SearchPageParams = SearchQueryBaseWithoutAppellationsAndRomeDto & {
  appellations?: AppellationAndRomeDto[];
} & WithAcquisition;

export type SearchStatus =
  | "noSearchMade"
  | "ok"
  | "initialFetch"
  | "extraFetch"
  | "error";

interface SearchState {
  searchStatus: SearchStatus;
  searchResults: SearchResultDto[];
  feedback: SearchFeedback;
  currentSearchResult: SearchResultDto | null;
  isLoading: boolean;
  searchParams: SearchQueryParamsDto;
}

export const initialState: SearchState = {
  searchStatus: "noSearchMade",
  searchResults: [],
  currentSearchResult: null,
  isLoading: false,
  feedback: {
    kind: "idle",
  },
  searchParams: {
    appellationCodes: [],
    rome: "",
    distanceKm: 10,
    latitude: 0,
    longitude: 0,
    sortedBy: "score",
  },
};

export const searchSlice = createSlice({
  name: "search",
  initialState,
  reducers: {
    searchRequested: (state, action: PayloadAction<SearchQueryParamsDto>) => {
      state.searchStatus = "initialFetch";
      state.searchResults = [];
      state.searchParams = action.payload;
      state.isLoading = true;
    },
    initialSearchSucceeded: (
      state,
      action: PayloadAction<{
        results: SearchResultDto[];
        searchParams: SearchQueryParamsDto;
      }>,
    ) => {
      state.searchResults = action.payload.results;
      state.searchStatus = "ok";
      state.isLoading = false;
    },
    extraFetchRequested: (state) => {
      state.searchStatus = "extraFetch";
      state.isLoading = true;
    },
    extraFetchSucceeded: (state, action: PayloadAction<SearchResultDto[]>) => {
      state.searchResults.push(...action.payload);
      state.searchStatus = "ok";
      state.isLoading = false;
    },
    fetchSearchResultRequested: (
      state,
      _action: PayloadAction<SearchResultPayload>,
    ) => {
      state.isLoading = true;
    },
    fetchSearchResultSucceeded: (
      state,
      action: PayloadAction<SearchResultDto>,
    ) => {
      state.currentSearchResult = action.payload;
      state.feedback = {
        kind: "success",
      };
      state.isLoading = false;
    },
    fetchSearchResultFailed: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.feedback = {
        kind: "errored",
        errorMessage: action.payload,
      };
    },
    clearSearchRequested: () => initialState,
  },
});
