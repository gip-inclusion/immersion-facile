import { expectToEqual } from "shared/src/expectToEqual";
import { FeatureFlags } from "shared/src/featureFlags";
import { featureFlagsSelector } from "src/core-logic/domain/featureFlags/featureFlags.selector";
import {
  featureFlagsSlice,
  FeatureFlagState,
} from "src/core-logic/domain/featureFlags/featureFlags.slice";
import {
  createTestStore,
  TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import { ReduxStore } from "src/core-logic/storeConfig/store";

const defaultFeatureFlags: FeatureFlags = {
  enableAdminUi: false,
  enableInseeApi: true,
  enablePeConnectApi: false,
  enableLogoUpload: false,
  enablePeConventionBroadcast: false,
};

const flagsFromApi: FeatureFlags = {
  enableAdminUi: true,
  enableInseeApi: true,
  enablePeConnectApi: true,
  enableLogoUpload: false,
  enablePeConventionBroadcast: true,
};

describe("feature flag slice", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore());
  });

  it("fetches feature flags and shows when loading", () => {
    expectFeatureFlagsStateToEqual({
      ...defaultFeatureFlags,
      areFeatureFlagsLoading: true, // feature flags are loading by default
    });
    store.dispatch(featureFlagsSlice.actions.retrieveFeatureFlagsRequested());
    expectFeatureFlagsStateToEqual({
      ...defaultFeatureFlags,
      areFeatureFlagsLoading: true,
    });
    dependencies.technicalGateway.featureFlags$.next(flagsFromApi);
    expectFeatureFlagsStateToEqual({
      ...flagsFromApi,
      areFeatureFlagsLoading: false,
    });
  });

  const expectFeatureFlagsStateToEqual = (expected: FeatureFlagState) => {
    expectToEqual(featureFlagsSelector(store.getState()), expected);
  };
});
