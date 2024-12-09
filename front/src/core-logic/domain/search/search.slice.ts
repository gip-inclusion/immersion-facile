import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import {
  AppellationAndRomeDto,
  SearchQueryBaseWithoutAppellationsAndRomeDto,
  SearchQueryParamsDto,
  SearchResultDto,
  SearchResultQuery,
  SiretAndAppellationDto,
  WithAcquisition,
} from "shared";
import {
  PayloadActionWithFeedbackTopic,
  PayloadActionWithFeedbackTopicError,
} from "src/core-logic/domain/feedback/feedback.slice";

export type SearchResultPayload = SearchResultQuery | SearchResultDto;

export type SearchPageParams = SearchQueryBaseWithoutAppellationsAndRomeDto & {
  appellations?: AppellationAndRomeDto[];
  fitForDisabledWorkers?: boolean | undefined;
  currentPage: number;
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
  currentSearchResult: SearchResultDto | null;
  isLoading: boolean;
  searchParams: SearchQueryParamsDto;
}

export const initialState: SearchState = {
  searchStatus: "noSearchMade",
  searchResults: [],
  currentSearchResult: null,
  isLoading: false,
  searchParams: {
    appellationCodes: [],
    rome: "",
    distanceKm: 10,
    latitude: 0,
    longitude: 0,
    sortedBy: "score",
    fitForDisabledWorkers: undefined,
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
      _action: PayloadActionWithFeedbackTopic<{
        searchResult: SearchResultPayload;
      }>,
    ) => {
      state.isLoading = true;
    },
    externalSearchResultRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic<{
        siretAndAppellation: SiretAndAppellationDto;
      }>,
    ) => {
      state.isLoading = true;
    },
    fetchSearchResultSucceeded: (
      state,
      action: PayloadAction<SearchResultDto>,
    ) => {
      state.currentSearchResult = action.payload;
      state.isLoading = false;
    },
    fetchSearchResultFailed: (
      state,
      _action: PayloadActionWithFeedbackTopicError,
    ) => {
      state.isLoading = false;
    },
    clearSearchStatusRequested: (state) => {
      state.searchStatus = initialState.searchStatus;
    },
  },
});
