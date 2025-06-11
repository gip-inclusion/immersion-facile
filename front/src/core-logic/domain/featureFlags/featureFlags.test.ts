import {
  type FeatureFlagHighlight,
  type FeatureFlags,
  expectToEqual,
  makeBooleanFeatureFlag,
  makeHighlightFeatureFlag,
  makeTextImageAndRedirectFeatureFlag,
  makeTextWithSeverityFeatureFlag,
} from "shared";
import { featureFlagSelectors } from "src/core-logic/domain/featureFlags/featureFlags.selector";
import {
  type FeatureFlagsState,
  featureFlagsSlice,
} from "src/core-logic/domain/featureFlags/featureFlags.slice";
import {
  type TestDependencies,
  createTestStore,
} from "src/core-logic/storeConfig/createTestStore";
import type { ReduxStore } from "src/core-logic/storeConfig/store";

const defaultHighlightFeatureFlagValue: FeatureFlagHighlight["value"] = {
  title: "",
  message: "",
  href: "",
  label: "",
};

const highlightFeatureFlagFromApi: FeatureFlagHighlight["value"] = {
  title: "My establishment dashboard highlight",
  message: "My establishment dashboard highlight message",
  href: "https://",
  label: "My establishment dashboard highlight label",
};

const defaultFeatureFlags: FeatureFlags = {
  enableTemporaryOperation: makeTextImageAndRedirectFeatureFlag(false, {
    imageAlt: "",
    imageUrl: "https://",
    message: "",
    redirectUrl: "https://",
    overtitle: "",
    title: "",
  }),
  enableMaintenance: makeTextWithSeverityFeatureFlag(false, {
    message: "",
    severity: "warning",
  }),
  enableSearchByScore: makeBooleanFeatureFlag(false),
  enableBroadcastOfConseilDepartementalToFT: makeBooleanFeatureFlag(false),
  enableBroadcastOfCapEmploiToFT: makeBooleanFeatureFlag(false),
  enableBroadcastOfMissionLocaleToFT: makeBooleanFeatureFlag(false),
  enableStandardFormatBroadcastToFranceTravail: makeBooleanFeatureFlag(false),
  enableEstablishmentDashboardHighlight: makeHighlightFeatureFlag(
    false,
    defaultHighlightFeatureFlagValue,
  ),
  enableAgencyDashboardHighlight: makeHighlightFeatureFlag(
    false,
    defaultHighlightFeatureFlagValue,
  ),
};

const flagsFromApi: FeatureFlags = {
  enableTemporaryOperation: makeTextImageAndRedirectFeatureFlag(false, {
    imageAlt: "",
    imageUrl: "https://",
    message: "",
    redirectUrl: "https://",
    overtitle: "",
    title: "",
  }),
  enableMaintenance: makeTextWithSeverityFeatureFlag(true, {
    message: "My maintenance message",
    severity: "error",
  }),
  enableSearchByScore: makeBooleanFeatureFlag(true),
  enableBroadcastOfConseilDepartementalToFT: makeBooleanFeatureFlag(false),
  enableBroadcastOfCapEmploiToFT: makeBooleanFeatureFlag(false),
  enableBroadcastOfMissionLocaleToFT: makeBooleanFeatureFlag(false),
  enableStandardFormatBroadcastToFranceTravail: makeBooleanFeatureFlag(false),
  enableEstablishmentDashboardHighlight: makeHighlightFeatureFlag(
    false,
    highlightFeatureFlagFromApi,
  ),
  enableAgencyDashboardHighlight: makeHighlightFeatureFlag(
    false,
    highlightFeatureFlagFromApi,
  ),
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
          overtitle: "",
          title: "",
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
          overtitle: "",
          title: "",
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
        overtitle: "",
        title: "",
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
        overtitle: "",
        title: "",
      }),
    });
    expectFeatureFlagsStateToEqual({
      ...defaultFeatureFlags,
      enableTemporaryOperation: makeTextImageAndRedirectFeatureFlag(true, {
        imageAlt: "",
        imageUrl: "https://",
        message: "",
        redirectUrl: "https://",
        overtitle: "",
        title: "",
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
