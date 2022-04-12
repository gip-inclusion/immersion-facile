import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Epic } from "redux-observable";
import { filter, map, switchMap } from "rxjs";
import { Dependencies } from "src/app/config/dependencies";
import { RootState } from "src/core-logic/storeConfig/store";
import { FeatureFlags } from "src/shared/featureFlags";

interface FeatureFlagsState {
  featureFlags: FeatureFlags;
}

const initialState: FeatureFlagsState = {
  featureFlags: {
    enableAdminUi: false,
    enableInseeApi: true,
    enablePeConnectApi: false,
  },
};

export const featureFlagsSlice = createSlice({
  name: "featureFlags",
  initialState,
  reducers: {
    retrieveFeatureFlagsRequested: (state) => state,
    retrieveFeatureFlagsSucceeded: (
      state,
      action: PayloadAction<FeatureFlags>,
    ) => {
      state.featureFlags = action.payload;
    },
  },
});

export const fetchFeatureFlagsEpic: Epic<
  FeatureFlagsAction,
  FeatureFlagsAction,
  RootState,
  Dependencies
> = (action$, state$, { featureFlagGateway }) =>
  action$.pipe(
    filter(featureFlagsSlice.actions.retrieveFeatureFlagsRequested.match),
    switchMap(() =>
      featureFlagGateway
        .getAll()
        .pipe(map(featureFlagsSlice.actions.retrieveFeatureFlagsSucceeded)),
    ),
  );

type ValueOf<T> = T[keyof T];
export type FeatureFlagsAction = ReturnType<
  ValueOf<typeof featureFlagsSlice.actions>
>;
