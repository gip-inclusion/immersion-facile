import {
  expectToEqual,
  FeatureFlags,
  makeBooleanFeatureFlag,
  makeTextFeatureFlag,
} from "shared";
import { featureFlagSelectors } from "src/core-logic/domain/featureFlags/featureFlags.selector";
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
  enableInseeApi: makeBooleanFeatureFlag(true),
  enablePeConnectApi: makeBooleanFeatureFlag(false),
  enablePeConventionBroadcast: makeBooleanFeatureFlag(false),
  enableTemporaryOperation: makeBooleanFeatureFlag(false),
  enableMaxContactPerWeek: makeBooleanFeatureFlag(false),
  enableMaintenance: makeTextFeatureFlag(false, {
    message: "",
  }),
};

const flagsFromApi: FeatureFlags = {
  enableInseeApi: makeBooleanFeatureFlag(true),
  enablePeConnectApi: makeBooleanFeatureFlag(true),
  enablePeConventionBroadcast: makeBooleanFeatureFlag(true),
  enableTemporaryOperation: makeBooleanFeatureFlag(false),
  enableMaxContactPerWeek: makeBooleanFeatureFlag(false),
  enableMaintenance: makeTextFeatureFlag(true, {
    message: "My maintenance message",
  }),
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
        enableInseeApi: makeBooleanFeatureFlag(false),
        isLoading: false,
      },
    }));
    store.dispatch(
      featureFlagsSlice.actions.setFeatureFlagRequested({
        flagName: "enableInseeApi",
        flagContent: {
          isActive: true,
        },
      }),
    );
    expectFeatureFlagsStateToEqual({
      ...defaultFeatureFlags,
      enableInseeApi: makeBooleanFeatureFlag(true),
      isLoading: true,
    });
    dependencies.adminGateway.setFeatureFlagResponse$.next(undefined);
    expectToEqual(dependencies.adminGateway.setFeatureFlagLastCalledWith, {
      flagName: "enableInseeApi",
      flagContent: {
        isActive: true,
      },
    });
    expectFeatureFlagsStateToEqual({
      ...defaultFeatureFlags,
      enableInseeApi: makeBooleanFeatureFlag(true),
      isLoading: false,
    });
  });

  const expectFeatureFlagsStateToEqual = (expected: FeatureFlagsState) => {
    expectToEqual(
      featureFlagSelectors.featureFlagState(store.getState()),
      expected,
    );
  };
});
