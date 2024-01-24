import {
  expectToEqual,
  FeatureFlags,
  makeTextFeatureFlag,
  makeTextImageAndRedirectFeatureFlag,
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
  enableTemporaryOperation: makeTextImageAndRedirectFeatureFlag(false, {
    imageAlt: "",
    imageUrl: "https://",
    message: "",
    redirectUrl: "https://",
  }),
  enableMaintenance: makeTextFeatureFlag(false, {
    message: "",
  }),
};

const flagsFromApi: FeatureFlags = {
  enableTemporaryOperation: makeTextImageAndRedirectFeatureFlag(false, {
    imageAlt: "",
    imageUrl: "https://",
    message: "",
    redirectUrl: "https://",
  }),
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
        enableTemporaryOperation: makeTextImageAndRedirectFeatureFlag(false, {
          imageAlt: "",
          imageUrl: "https://",
          message: "",
          redirectUrl: "https://",
        }),
        isLoading: false,
      },
    }));

    store.dispatch(
      featureFlagsSlice.actions.setFeatureFlagRequested({
        flagName: "enableTemporaryOperation",
        featureFlag: makeTextImageAndRedirectFeatureFlag(true, {
          imageAlt: "",
          imageUrl: "https://",
          message: "",
          redirectUrl: "https://",
        }),
      }),
    );
    expectFeatureFlagsStateToEqual({
      ...defaultFeatureFlags,
      enableTemporaryOperation: makeTextImageAndRedirectFeatureFlag(true, {
        imageAlt: "",
        imageUrl: "https://",
        message: "",
        redirectUrl: "https://",
      }),
      isLoading: true,
    });
    dependencies.adminGateway.setFeatureFlagResponse$.next(undefined);
    expectToEqual(dependencies.adminGateway.setFeatureFlagLastCalledWith, {
      flagName: "enableTemporaryOperation",
      featureFlag: makeTextImageAndRedirectFeatureFlag(true, {
        imageAlt: "",
        imageUrl: "https://",
        message: "",
        redirectUrl: "https://",
      }),
    });
    expectFeatureFlagsStateToEqual({
      ...defaultFeatureFlags,
      enableTemporaryOperation: makeTextImageAndRedirectFeatureFlag(true, {
        imageAlt: "",
        imageUrl: "https://",
        message: "",
        redirectUrl: "https://",
      }),
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
