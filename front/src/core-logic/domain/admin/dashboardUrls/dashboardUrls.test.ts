import { AbsoluteUrl, expectToEqual } from "shared";
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
    it("should store AbsoluteUrl in convention when requesting conventions dashboard", () => {
      const initialDashboards = adminSelectors.dashboardUrls(store.getState());
      expectToEqual(initialDashboards.conventions, null);

      store.dispatch(
        dashboardUrlsSlice.actions.dashboardUrlRequested("conventions"),
      );

      const valueFromApi: AbsoluteUrl = "https://conventions.url";
      dependencies.adminGateway.dashboardUrl$.next(valueFromApi);
      const result = adminSelectors.dashboardUrls(store.getState());
      expectToEqual(result.conventions, valueFromApi);
    });

    it("should store AbsoluteUrl in events when requesting events dashboard", () => {
      const initialDashboards = adminSelectors.dashboardUrls(store.getState());
      expectToEqual(initialDashboards.events, null);
      initialDashboards.agency;

      store.dispatch(
        dashboardUrlsSlice.actions.dashboardUrlRequested("events"),
      );

      const valueFromApi: AbsoluteUrl = "https://events.url";
      dependencies.adminGateway.dashboardUrl$.next(valueFromApi);
      const result = adminSelectors.dashboardUrls(store.getState());
      expectToEqual(result.events, valueFromApi);
    });
  });
});
