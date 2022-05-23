import { Store } from "@reduxjs/toolkit";
import { featureFlagsSelector } from "src/core-logic/domain/featureFlags/featureFlags.selector";
import { featureFlagsSlice } from "src/core-logic/domain/featureFlags/featureFlags.slice";
import {
  createTestStore,
  TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import { RootState } from "src/core-logic/storeConfig/store";
import { FeatureFlags } from "shared/src/featureFlags";

describe("feature flag slice", () => {
  let store: Store<RootState>;
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
