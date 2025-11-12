import { createSlice } from "@reduxjs/toolkit";
import type {
  DataWithPagination,
  Pagination,
  PaginationQueryParams,
} from "shared";
import type {
  PayloadActionWithFeedbackTopic,
  PayloadActionWithFeedbackTopicError,
} from "src/core-logic/domain/feedback/feedback.slice";
import type { ConventionWithBroadcastFeedback } from "../../../../../../shared/src/convention/conventionWithBroadcastFeedback.dto";

type ConnectedUserConventionsWithBroadcastFeedbackState = {
  conventions: ConventionWithBroadcastFeedback[];
  isLoading: boolean;
  pagination: Pagination | undefined;
};

const initialState: ConnectedUserConventionsWithBroadcastFeedbackState = {
  conventions: [],
  isLoading: false,
  pagination: undefined,
};

export const conventionsWithBroadcastFeedbackSlice = createSlice({
  name: "conventionsWithBroadcastFeedback",
  initialState,
  reducers: {
    getConventionsWithErroredBroadcastFeedbackRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic<{
        params: Required<PaginationQueryParams>;
        jwt: string;
      }>,
    ) => {
      state.isLoading = true;
    },
    getConventionsWithErroredBroadcastFeedbackSucceeded: (
      state,
      action: PayloadActionWithFeedbackTopic<
        DataWithPagination<ConventionWithBroadcastFeedback>
      >,
    ) => {
      state.isLoading = false;
      state.conventions = action.payload.data;
      state.pagination = action.payload.pagination;
    },
    getConventionsWithErroredBroadcastFeedbackFailed: (
      state,
      _action: PayloadActionWithFeedbackTopicError,
    ) => {
      state.isLoading = false;
    },
  },
});
