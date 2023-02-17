import { expectToEqual, FeatureFlags } from "shared";
import { featureFlagsSelector } from "src/core-logic/domain/featureFlags/featureFlags.selector";
import {
  featureFlagsSlice,
  FeatureFlagsState,
} from "src/core-logic/domain/featureFlags/featureFlags.slice";
import {
  createTestStore,
  TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import { ReduxStore } from "src/core-logic/storeConfig/store";

const defaultFeatureFlags: FeatureFlags = {
  enableInseeApi: true,
  enablePeConnectApi: false,
  enableLogoUpload: false,
  enablePeConventionBroadcast: false,
  enableTemporaryOperation: false,
};

const flagsFromApi: FeatureFlags = {
  enableInseeApi: true,
  enablePeConnectApi: true,
  enableLogoUpload: false,
  enablePeConventionBroadcast: true,
  enableTemporaryOperation: false,
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
      isLoading: true, // feature flags are loading by default
    });
    store.dispatch(featureFlagsSlice.actions.retrieveFeatureFlagsRequested());
    expectFeatureFlagsStateToEqual({
      ...defaultFeatureFlags,
      isLoading: true,
    });
    dependencies.technicalGateway.featureFlags$.next(flagsFromApi);
    expectFeatureFlagsStateToEqual({
      ...flagsFromApi,
      isLoading: false,
    });
  });

  it("sets feature flag to given value", () => {
    ({ store, dependencies } = createTestStore({
      featureFlags: {
        ...defaultFeatureFlags,
        enableLogoUpload: false,
        isLoading: false,
      },
    }));
    store.dispatch(
      featureFlagsSlice.actions.setFeatureFlagRequested("enableLogoUpload"),
    );
    expectFeatureFlagsStateToEqual({
      ...defaultFeatureFlags,
      enableLogoUpload: true,
      isLoading: true,
    });
    dependencies.technicalGateway.setFeatureFlagResponse$.next(undefined);
    expectToEqual(dependencies.technicalGateway.setFeatureFlagLastCalledWith, {
      flagName: "enableLogoUpload",
      value: true,
    });
    expectFeatureFlagsStateToEqual({
      ...defaultFeatureFlags,
      enableLogoUpload: true,
      isLoading: false,
    });
  });

  const expectFeatureFlagsStateToEqual = (expected: FeatureFlagsState) => {
    expectToEqual(featureFlagsSelector(store.getState()), expected);
  };
});
