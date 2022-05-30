import { FeatureFlags } from "shared/src/featureFlags";
import { featureFlagsSelector } from "src/core-logic/domain/featureFlags/featureFlags.selector";
import { featureFlagsSlice } from "src/core-logic/domain/featureFlags/featureFlags.slice";
import {
  createTestStore,
  TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import { ReduxStore } from "src/core-logic/storeConfig/store";

describe("feature flag slice", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore());
  });

  it("fetches feature flags", () => {
    store.dispatch(featureFlagsSlice.actions.retrieveFeatureFlagsRequested());
    const valueFromApi: FeatureFlags = {
      enableAdminUi: true,
      enableInseeApi: true,
      enablePeConnectApi: true,
      enableLogoUpload: false,
    };
    dependencies.technicalGateway.featureFlags$.next(valueFromApi);
    expect(featureFlagsSelector(store.getState())).toEqual(valueFromApi);
  });
});
