import { AbsoluteUrl } from "shared/src/AbsoluteUrl";
import { expectToEqual } from "shared/src/expectToEqual";
import { adminSelectors } from "src/core-logic/domain/admin/admin.selectors";
import { dashboardUrlsSlice } from "src/core-logic/domain/admin/dashboardUrls/dashboardUrls.slice";
import {
  createTestStore,
  TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import { ReduxStore } from "src/core-logic/storeConfig/store";

describe("dashboardUrls slice", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore());
  });

  describe("get convention url for dashboardUrls", () => {
    it("should return an AbsoluteUrl when requesting dashboardUrls", () => {
      const initialDashboardUrl = adminSelectors.dashboardUrls.conventions(
        store.getState(),
      );
      expectToEqual(initialDashboardUrl, null);

      store.dispatch(
        dashboardUrlsSlice.actions.conventionsDashboardUrlRequested(),
      );

      const valueFromApi: AbsoluteUrl = "https://plop2";
      dependencies.adminGateway.conventionDashboardUrl$.next(valueFromApi);
      const result = adminSelectors.dashboardUrls.conventions(store.getState());
      expectToEqual(result, valueFromApi);
    });
  });
});
