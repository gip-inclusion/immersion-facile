import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  DataWithPagination,
  GetOffersFlatQueryParams,
  SearchResultDto,
  SearchResultQuery,
  SiretAndAppellationDto,
} from "shared";
import type {
  PayloadActionWithFeedbackTopic,
  PayloadActionWithFeedbackTopicError,
} from "src/core-logic/domain/feedback/feedback.slice";

export type SearchResultPayload = SearchResultQuery | SearchResultDto;

export type SearchStatus =
  | "noSearchMade"
  | "ok"
  | "initialFetch"
  | "extraFetch"
  | "error";

interface SearchState {
  searchStatus: SearchStatus;
  searchResultWithPagination: DataWithPagination<SearchResultDto>;
  currentSearchResult: SearchResultDto | null;
  isLoading: boolean;
  searchParams: GetOffersFlatQueryParams;
}

const emptySearchResult: DataWithPagination<SearchResultDto> = {
  data: [],
  pagination: {
    totalPages: 1,
    currentPage: 1,
    numberPerPage: 12,
    totalRecords: 0,
  },
};

export const initialState: SearchState = {
  searchStatus: "noSearchMade",
  searchResultWithPagination: emptySearchResult,
  currentSearchResult: null,
  isLoading: false,
  searchParams: {
    appellationCodes: [],
    distanceKm: 10,
    latitude: 0,
    longitude: 0,
    fitForDisabledWorkers: undefined,
    sortBy: "score",
    sortOrder: "desc",
    page: 1,
    perPage: 12,
  },
};

export const searchSlice = createSlice({
  name: "search",
  initialState,
  reducers: {
    getOffersRequested: (
      state,
      action: PayloadAction<GetOffersFlatQueryParams>,
    ) => {
      state.searchStatus = "initialFetch";
      state.searchResultWithPagination = emptySearchResult;
      state.searchParams = action.payload;
      state.isLoading = true;
    },
    getOffersSucceeded: (
      state,
      action: PayloadAction<{
        searchResultWithPagination: DataWithPagination<SearchResultDto>;
        searchParams: GetOffersFlatQueryParams;
      }>,
    ) => {
      state.searchResultWithPagination =
        action.payload.searchResultWithPagination;
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
