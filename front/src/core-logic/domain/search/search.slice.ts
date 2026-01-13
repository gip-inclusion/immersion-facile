import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  AppellationAndRomeDto,
  DataWithPagination,
  ExternalSearchResultDto,
  GetOffersFlatQueryParams,
  SearchResultDto,
  SearchResultQuery,
  SiretAndAppellationDto,
  WithAcquisition,
} from "shared";
import type {
  PayloadActionWithFeedbackTopic,
  PayloadActionWithFeedbackTopicError,
} from "src/core-logic/domain/feedback/feedback.slice";

export type SearchResultPayload = SearchResultQuery | SearchResultDto;

export type GetOffersPayload = SearchPageParams & { isExternal?: boolean };

export type SearchPageParams = GetOffersFlatQueryParams & {
  appellations?: AppellationAndRomeDto[];
  nafLabel?: string;
} & WithAcquisition;

type SearchState = {
  searchResultsWithPagination: DataWithPagination<
    SearchResultDto | ExternalSearchResultDto
  >;
  currentSearchResult: SearchResultDto | ExternalSearchResultDto | null;
  isLoading: boolean;
  searchParams: SearchPageParams;
};

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
  searchResultsWithPagination: emptySearchResult,
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
    getOffersRequested: (state, action: PayloadAction<GetOffersPayload>) => {
      state.searchResultsWithPagination = emptySearchResult;
      state.searchParams = action.payload;
      state.isLoading = true;
    },
    getOffersSucceeded: (
      state,
      action: PayloadAction<{
        searchResultsWithPagination: DataWithPagination<
          SearchResultDto | ExternalSearchResultDto
        >;
        searchParams: GetOffersFlatQueryParams;
      }>,
    ) => {
      state.searchResultsWithPagination =
        action.payload.searchResultsWithPagination;
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
      action: PayloadAction<ExternalSearchResultDto>,
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
  },
});
