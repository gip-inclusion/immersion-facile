import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Epic } from "redux-observable";
import { filter, map, switchMap } from "rxjs";
import { Dependencies } from "src/app/config/dependencies";
import { ActionOfSlice } from "src/core-logic/storeConfig/redux.helpers";
import { RootState } from "src/core-logic/storeConfig/store";
import { FeatureFlags } from "shared/src/featureFlags";

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

export type FeatureFlagsAction = ActionOfSlice<typeof featureFlagsSlice>;

export const fetchFeatureFlagsEpic: Epic<
  FeatureFlagsAction,
  FeatureFlagsAction,
  RootState,
  Dependencies
> = (action$, _state$, { technicalGateway }) =>
  action$.pipe(
    filter(featureFlagsSlice.actions.retrieveFeatureFlagsRequested.match),
    switchMap(() =>
      technicalGateway
        .getAllFeatureFlags()
        .pipe(map(featureFlagsSlice.actions.retrieveFeatureFlagsSucceeded)),
    ),
  );
