import { filter, map, switchMap } from "rxjs";
import { getAdminToken } from "src/core-logic/domain/admin/admin.helpers";
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
    switchMap(technicalGateway.getAllFeatureFlags$),
    map(featureFlagsSlice.actions.retrieveFeatureFlagsSucceeded),
  );

const setFeatureFlagEpic: FeatureFlagEpic = (
  action$,
  state$,
  { adminGateway },
) =>
  action$.pipe(
    filter(featureFlagsSlice.actions.setFeatureFlagRequested.match),
    switchMap(({ payload }) =>
      adminGateway.updateFeatureFlags$(payload, getAdminToken(state$.value)),
    ),
    map(featureFlagsSlice.actions.setFeatureFlagSucceeded),
  );

export const featureFlagEpics = [fetchFeatureFlagsEpic, setFeatureFlagEpic];
