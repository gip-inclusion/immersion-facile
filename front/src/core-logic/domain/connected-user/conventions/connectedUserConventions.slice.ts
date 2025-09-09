import { createSlice } from "@reduxjs/toolkit";
import type {
  ConventionDto,
  DataWithPagination,
  FlatGetConventionsForAgencyUserParams,
  Pagination,
} from "shared";
import type {
  PayloadActionWithFeedbackTopic,
  PayloadActionWithFeedbackTopicError,
} from "src/core-logic/domain/feedback/feedback.slice";

export interface ConnectedUserConventionsState {
  conventions: ConventionDto[];
  isLoading: boolean;
  pagination: Pagination | undefined;
}

export const connectedUserConventionsInitialState: ConnectedUserConventionsState =
  {
    conventions: [],
    isLoading: false,
    pagination: undefined,
  };

export const connectedUserConventionsSlice = createSlice({
  name: "connectedUserConventions",
  initialState: connectedUserConventionsInitialState,
  reducers: {
    getConventionsForConnectedUserRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic<{
        params: FlatGetConventionsForAgencyUserParams;
        jwt: string;
      }>,
    ) => {
      state.isLoading = true;
    },
    getConventionsForConnectedUserSucceeded: (
      state,
      action: PayloadActionWithFeedbackTopic<DataWithPagination<ConventionDto>>,
    ) => {
      state.isLoading = false;
      state.conventions = action.payload.data;
      state.pagination = action.payload.pagination;
    },
    getConventionsForConnectedUserFailed: (
      state,
      _action: PayloadActionWithFeedbackTopicError,
    ) => {
      state.isLoading = false;
    },
  },
});
