import { createSlice } from "@reduxjs/toolkit";
import {
  type ConnectedUserJwt,
  type ConventionReadDto,
  type ConventionStatus,
  type DataWithPagination,
  defaultPerPageInWebPagination,
  type FlatGetConventionsForAgencyUserParams,
} from "shared";

import type {
  PayloadActionWithFeedbackTopic,
  PayloadActionWithFeedbackTopicError,
} from "src/core-logic/domain/feedback/feedback.slice";

export type FlatGetConventionsForAgencyUserParamsWithStatusesAsArray = Omit<
  FlatGetConventionsForAgencyUserParams,
  "statuses"
> & {
  statuses?: ConventionStatus[];
};

export type FetchConventionListRequestedPayload = {
  jwt: ConnectedUserJwt;
  filters: FlatGetConventionsForAgencyUserParamsWithStatusesAsArray;
};

export type ConventionListState = {
  isLoading: boolean;
  conventionsWithPagination: DataWithPagination<ConventionReadDto> & {
    filters: FlatGetConventionsForAgencyUserParamsWithStatusesAsArray;
  };
};

export const initialConventionWithPagination: DataWithPagination<ConventionReadDto> & {
  filters: FlatGetConventionsForAgencyUserParamsWithStatusesAsArray;
} = {
  data: [],
  pagination: {
    totalRecords: 0,
    currentPage: 1,
    totalPages: 1,
    numberPerPage: defaultPerPageInWebPagination,
  },
  filters: {
    sortBy: "dateStart",
    sortDirection: "desc",
    page: 1,
    perPage: defaultPerPageInWebPagination,
  },
};

const initialConventionListState: ConventionListState = {
  isLoading: false,
  conventionsWithPagination: initialConventionWithPagination,
};

export const conventionListSlice = createSlice({
  name: "conventionList",
  initialState: initialConventionListState,
  reducers: {
    fetchConventionListRequested: (
      state,
      action: PayloadActionWithFeedbackTopic<FetchConventionListRequestedPayload>,
    ) => {
      state.isLoading = true;
      state.conventionsWithPagination = {
        ...state.conventionsWithPagination,
        filters: action.payload.filters,
      };
    },
    fetchConventionListSucceeded: (
      state,
      action: PayloadActionWithFeedbackTopic<{
        conventionsWithPagination: DataWithPagination<ConventionReadDto>;
      }>,
    ) => {
      state.conventionsWithPagination = {
        ...state.conventionsWithPagination,
        ...action.payload.conventionsWithPagination,
      };
      state.isLoading = false;
    },
    fetchConventionListFailed: (
      state,
      _action: PayloadActionWithFeedbackTopicError,
    ) => {
      state.isLoading = false;
    },
  },
});
