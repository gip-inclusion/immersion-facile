import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { OpenAPIV3 } from "openapi-types";

export type OpenApiDocState = {
  openApiDoc: OpenAPIV3.Document | null;
  isLoading: boolean;
};

const initialState: OpenApiDocState = {
  openApiDoc: null,
  isLoading: false,
};

export const openApiDocSlice = createSlice({
  name: "openApiDoc",
  initialState,
  reducers: {
    fetchOpenApiDocRequested: (state) => {
      state.isLoading = true;
      state.openApiDoc = null;
    },
    fetchOpenApiDocSucceeded: (
      state,
      action: PayloadAction<OpenAPIV3.Document>,
    ) => {
      state.openApiDoc = action.payload;
      state.isLoading = false;
    },
    fetchOpenApiDocFailed: (state, _action: PayloadAction<string>) => {
      state.isLoading = false;
    },
  },
});
