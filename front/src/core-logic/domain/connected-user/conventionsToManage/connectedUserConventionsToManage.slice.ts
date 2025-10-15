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

type ConnectedUserConventionsToManageState = {
  conventions: ConventionDto[];
  isLoading: boolean;
  pagination: Pagination | undefined;
};

export const connectedUserConventionsToManageInitialState: ConnectedUserConventionsToManageState =
  {
    conventions: [],
    isLoading: false,
    pagination: undefined,
  };

export const connectedUserConventionsToManageSlice = createSlice({
  name: "connectedUserConventionsToManage",
  initialState: connectedUserConventionsToManageInitialState,
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
