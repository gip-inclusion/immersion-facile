import { AbsoluteUrl, expectObjectsToMatch } from "shared";
import { adminSelectors } from "src/core-logic/domain/admin/admin.selectors";
import {
  DashboardUrls,
  dashboardUrlsSlice,
} from "src/core-logic/domain/admin/dashboardUrls/dashboardUrls.slice";
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
      expectUrlsToMatch({ conventions: null });

      store.dispatch(
        dashboardUrlsSlice.actions.dashboardUrlRequested({
          name: "conventions",
        }),
      );
      const valueFromApi: AbsoluteUrl = "https://conventions.url";
      dependencies.adminGateway.dashboardUrl$.next(valueFromApi);

      expectUrlsToMatch({ conventions: valueFromApi });
      expectDashboardError(null);
    });

    it("should store AbsoluteUrl in events when requesting events dashboard", () => {
      expectUrlsToMatch({ agency: null });

      store.dispatch(
        dashboardUrlsSlice.actions.dashboardUrlRequested({
          name: "agency",
          agencyId: "my-agency-id",
        }),
      );
      const valueFromApi: AbsoluteUrl = "https://agency.url";
      dependencies.adminGateway.dashboardUrl$.next(valueFromApi);

      expectUrlsToMatch({ agency: valueFromApi });
      expectDashboardError(null);
    });

    it("should fails on requesting conventions dashboard with error", () => {
      expectUrlsToMatch({ conventions: null });

      store.dispatch(
        dashboardUrlsSlice.actions.dashboardUrlRequested({
          name: "conventions",
        }),
      );
      const errorMessage = "It Fails";
      dependencies.adminGateway.dashboardUrl$.error(new Error(errorMessage));

      expectUrlsToMatch({ conventions: null });
      expectDashboardError(errorMessage);
    });
  });

  const expectUrlsToMatch = (urls: Partial<DashboardUrls>) => {
    expectObjectsToMatch(
      adminSelectors.dashboardUrls.urls(store.getState()),
      urls,
    );
  };

  const expectDashboardError = (error: string | null) => {
    expect(adminSelectors.dashboardUrls.error(store.getState())).toBe(error);
  };
});
