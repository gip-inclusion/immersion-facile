import { filter, map, switchMap } from "rxjs";
import { featureFlagsSlice } from "src/core-logic/domain/featureFlags/featureFlags.slice";
import {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";

type FeatureFlagsAction = ActionOfSlice<typeof featureFlagsSlice>;
type FeatureFlagEpic = AppEpic<FeatureFlagsAction>;

const fetchFeatureFlagsEpic: FeatureFlagEpic = (
  action$,
  _state$,
  { technicalGateway },
) =>
  action$.pipe(
    filter(featureFlagsSlice.actions.retrieveFeatureFlagsRequested.match),
    switchMap(() => technicalGateway.getAllFeatureFlags()),
    map(featureFlagsSlice.actions.retrieveFeatureFlagsSucceeded),
  );

const setFeatureFlagEpic: FeatureFlagEpic = (
  action$,
  state$,
  { technicalGateway },
) =>
  action$.pipe(
    filter(featureFlagsSlice.actions.setFeatureFlagRequested.match),
    switchMap(({ payload }) =>
      technicalGateway.setFeatureFlag(
        payload,
        state$.value.admin.adminAuth.adminToken ?? "",
      ),
    ),
    map(featureFlagsSlice.actions.setFeatureFlagSucceeded),
  );

export const featureFlagEpics = [fetchFeatureFlagsEpic, setFeatureFlagEpic];
