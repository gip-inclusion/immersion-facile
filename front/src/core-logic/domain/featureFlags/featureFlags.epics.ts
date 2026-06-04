import { filter, map, switchMap } from "rxjs";
import { getAdminToken } from "src/core-logic/domain/admin/admin.helpers";
import { featureFlagsSlice } from "src/core-logic/domain/featureFlags/featureFlags.slice";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import type {
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
    catchEpicError((error) =>
      featureFlagsSlice.actions.retrieveFeatureFlagsFailed({
        feedbackTopic: "feature-flags-global",
        errorMessage: error.message,
      }),
    ),
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
    catchEpicError(featureFlagsSlice.actions.setFeatureFlagFailed),
  );

export const featureFlagEpics = [fetchFeatureFlagsEpic, setFeatureFlagEpic];
