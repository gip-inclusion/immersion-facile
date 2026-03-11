import { createSlice } from "@reduxjs/toolkit";
import type {
  ConventionReadDto,
  DataWithPagination,
  FlatGetConventionsForAgencyUserParams,
  Pagination,
} from "shared";
import type {
  PayloadActionWithFeedbackTopic,
  PayloadActionWithFeedbackTopicError,
} from "src/core-logic/domain/feedback/feedback.slice";

type ConnectedUserConventionsToManageState = {
  conventions: ConventionReadDto[];
  isLoading: boolean;
  pagination: Pagination | undefined;
  conventionsWithAssessmentIssue: ConventionReadDto[];
  conventionsWithAssessmentIssuePagination: Pagination | undefined;
  isLoadingConventionsWithAssessmentIssue: boolean;
};

export const connectedUserConventionsToManageInitialState: ConnectedUserConventionsToManageState =
  {
    conventions: [],
    isLoading: false,
    pagination: undefined,
    conventionsWithAssessmentIssue: [],
    conventionsWithAssessmentIssuePagination: undefined,
    isLoadingConventionsWithAssessmentIssue: false,
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
      action: PayloadActionWithFeedbackTopic<
        DataWithPagination<ConventionReadDto>
      >,
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
    getConventionsWithAssessmentIssueRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic<{
        params: FlatGetConventionsForAgencyUserParams;
        jwt: string;
      }>,
    ) => {
      state.isLoadingConventionsWithAssessmentIssue = true;
    },
    getConventionsWithAssessmentIssueSucceeded: (
      state,
      action: PayloadActionWithFeedbackTopic<
        DataWithPagination<ConventionReadDto>
      >,
    ) => {
      state.isLoadingConventionsWithAssessmentIssue = false;
      state.conventionsWithAssessmentIssue = action.payload.data;
      state.conventionsWithAssessmentIssuePagination =
        action.payload.pagination;
    },
    getConventionsWithAssessmentIssueFailed: (
      state,
      _action: PayloadActionWithFeedbackTopicError,
    ) => {
      state.isLoadingConventionsWithAssessmentIssue = false;
    },
  },
});
