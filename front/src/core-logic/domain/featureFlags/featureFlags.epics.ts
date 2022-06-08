import { Epic } from "redux-observable";
import { filter, map, switchMap } from "rxjs";
import { Dependencies } from "src/app/config/dependencies";
import { featureFlagsSlice } from "src/core-logic/domain/featureFlags/featureFlags.slice";
import { ActionOfSlice } from "src/core-logic/storeConfig/redux.helpers";
import { RootState } from "src/core-logic/storeConfig/store";

type FeatureFlagsAction = ActionOfSlice<typeof featureFlagsSlice>;

export const fetchFeatureFlagsEpic: Epic<
  FeatureFlagsAction,
  FeatureFlagsAction,
  RootState,
  Dependencies
> = (action$, _state$, { technicalGateway }) =>
  action$.pipe(
    filter(featureFlagsSlice.actions.retrieveFeatureFlagsRequested.match),
    switchMap(() => technicalGateway.getAllFeatureFlags()),
    map(featureFlagsSlice.actions.retrieveFeatureFlagsSucceeded),
  );
