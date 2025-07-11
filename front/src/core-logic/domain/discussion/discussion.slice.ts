import { createSlice } from "@reduxjs/toolkit";
import {
  type ConnectedUserJwt,
  type DataWithPagination,
  type DiscussionId,
  type DiscussionInList,
  type DiscussionReadDto,
  type DiscussionStatus,
  defaultPerPageInWebPagination,
  type ExchangeFromDashboard,
  type ExchangeRead,
  type FlatGetPaginatedDiscussionsParams,
  type WithDiscussionStatus,
} from "shared";
import type {
  PayloadActionWithFeedbackTopic,
  PayloadActionWithFeedbackTopicError,
} from "src/core-logic/domain/feedback/feedback.slice";

export type FlatGetPaginatedDiscussionsParamsWithStatusesAsArray = Omit<
  FlatGetPaginatedDiscussionsParams,
  "statuses"
> & {
  statuses?: DiscussionStatus[];
};

export type FetchDiscussionRequestedPayload = {
  jwt: ConnectedUserJwt;
  discussionId: DiscussionId;
};

export type FetchDiscussionListRequestedPayload = {
  jwt: ConnectedUserJwt;
  filters: FlatGetPaginatedDiscussionsParamsWithStatusesAsArray;
};

export type UpdateDiscussionStatusRequestedPayload = {
  jwt: ConnectedUserJwt;
  discussionId: DiscussionId;
} & WithDiscussionStatus;

export type DiscussionState = {
  discussion: DiscussionReadDto | null;
  isLoading: boolean;
  fetchError: string | null;
  discussionsWithPagination: DataWithPagination<DiscussionInList> & {
    filters: FlatGetPaginatedDiscussionsParamsWithStatusesAsArray;
  };
};

export type SendExchangeRequestedPayload = {
  jwt: ConnectedUserJwt;
  discussionId: DiscussionId;
} & ExchangeFromDashboard;

export const initialDiscussionsWithPagination: DataWithPagination<DiscussionInList> & {
  filters: FlatGetPaginatedDiscussionsParamsWithStatusesAsArray;
} = {
  data: [],
  pagination: {
    totalRecords: 0,
    currentPage: 1,
    totalPages: 1,
    numberPerPage: defaultPerPageInWebPagination,
  },
  filters: {
    orderBy: "createdAt",
    orderDirection: "desc",
    page: 1,
    perPage: defaultPerPageInWebPagination,
    statuses: [],
    search: "",
  },
};

const initialDiscussionState: DiscussionState = {
  discussion: null,
  isLoading: false,
  fetchError: null,
  discussionsWithPagination: initialDiscussionsWithPagination,
};

export const discussionSlice = createSlice({
  name: "discussion",
  initialState: initialDiscussionState,
  reducers: {
    fetchDiscussionRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic<FetchDiscussionRequestedPayload>,
    ) => {
      state.isLoading = true;
      state.discussion = null;
    },
    fetchDiscussionSucceeded: (
      state,
      action: PayloadActionWithFeedbackTopic<{
        discussion: DiscussionReadDto | undefined;
      }>,
    ) => {
      state.discussion = action.payload.discussion ?? null;
      state.isLoading = false;
    },
    fetchDiscussionFailed: (
      state,
      _action: PayloadActionWithFeedbackTopicError,
    ) => {
      state.isLoading = false;
    },
    fetchDiscussionListRequested: (
      state,
      action: PayloadActionWithFeedbackTopic<FetchDiscussionListRequestedPayload>,
    ) => {
      state.isLoading = true;
      state.discussionsWithPagination = {
        ...state.discussionsWithPagination,
        filters: action.payload.filters,
      };
    },
    fetchDiscussionListSucceeded: (
      state,
      action: PayloadActionWithFeedbackTopic<{
        discussionsWithPagination: DataWithPagination<DiscussionInList>;
      }>,
    ) => {
      state.discussionsWithPagination = {
        ...state.discussionsWithPagination,
        ...action.payload.discussionsWithPagination,
      };
      state.isLoading = false;
    },
    fetchDiscussionListFailed: (
      state,
      _action: PayloadActionWithFeedbackTopicError,
    ) => {
      state.isLoading = false;
    },
    updateDiscussionStatusRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic<UpdateDiscussionStatusRequestedPayload>,
    ) => {
      state.isLoading = true;
    },
    updateDiscussionStatusSucceeded: (
      state,
      _action: PayloadActionWithFeedbackTopic,
    ) => {
      state.isLoading = false;
    },
    updateDiscussionStatusFailed: (
      state,
      _action: PayloadActionWithFeedbackTopicError,
    ) => {
      state.isLoading = false;
    },
    sendExchangeRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic<{
        exchangeData: SendExchangeRequestedPayload;
      }>,
    ) => {
      state.isLoading = true;
    },
    sendExchangeSucceeded: (
      state,
      action: PayloadActionWithFeedbackTopic<{
        exchangeData: ExchangeRead;
      }>,
    ) => {
      state.isLoading = false;
      if (state.discussion) {
        state.discussion = {
          ...state.discussion,
          exchanges: [
            ...state.discussion.exchanges,
            action.payload.exchangeData,
          ],
        };
      }
    },
    sendExchangeFailed: (
      state,
      _action: PayloadActionWithFeedbackTopicError,
    ) => {
      state.isLoading = false;
    },
  },
});
