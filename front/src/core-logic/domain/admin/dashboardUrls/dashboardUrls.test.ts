import { type DashboardUrlAndName, expectObjectsToMatch } from "shared";
import { adminSelectors } from "src/core-logic/domain/admin/admin.selectors";
import {
  type DashboardUrls,
  dashboardUrlsSlice,
} from "src/core-logic/domain/admin/dashboardUrls/dashboardUrls.slice";
import {
  createTestStore,
  type TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import type { ReduxStore } from "src/core-logic/storeConfig/store";

describe("dashboardUrls slice", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore());
  });

  describe("get convention url for dashboardUrls", () => {
    it("should store AbsoluteUrl in convention when requesting conventions dashboard", () => {
      expectUrlsToMatch({ adminConventions: null });

      store.dispatch(
        dashboardUrlsSlice.actions.dashboardUrlRequested({
          name: "adminConventions",
        }),
      );
      const valueFromApi: DashboardUrlAndName = {
        name: "adminConventions",
        url: "https://conventions.url",
      };
      dependencies.adminGateway.dashboardUrl$.next(valueFromApi);

      expectUrlsToMatch({ adminConventions: valueFromApi.url });
      expectDashboardError(null);
    });

    it("should store AbsoluteUrl in establishments when requesting establishments dashboard", () => {
      expectUrlsToMatch({ adminEstablishments: null });

      store.dispatch(
        dashboardUrlsSlice.actions.dashboardUrlRequested({
          name: "adminEstablishments",
        }),
      );
      const valueFromApi: DashboardUrlAndName = {
        name: "adminEstablishments",
        url: "https://establishments.url",
      };
      dependencies.adminGateway.dashboardUrl$.next(valueFromApi);

      expectUrlsToMatch({ adminEstablishments: valueFromApi.url });
      expectDashboardError(null);
    });

    it("should store AbsoluteUrl in events when requesting events dashboard", () => {
      expectUrlsToMatch({ adminAgencyDetails: null });

      store.dispatch(
        dashboardUrlsSlice.actions.dashboardUrlRequested({
          name: "adminAgencyDetails",
          agencyId: "my-agency-id",
        }),
      );
      const valueFromApi: DashboardUrlAndName = {
        name: "adminAgencyDetails",
        url: "https://agency.url",
      };
      dependencies.adminGateway.dashboardUrl$.next(valueFromApi);

      expectUrlsToMatch({ adminAgencyDetails: valueFromApi.url });
      expectDashboardError(null);
    });

    it("should fails on requesting conventions dashboard with error", () => {
      expectUrlsToMatch({ adminConventions: null });

      store.dispatch(
        dashboardUrlsSlice.actions.dashboardUrlRequested({
          name: "adminConventions",
        }),
      );
      const errorMessage = "It Fails";
      dependencies.adminGateway.dashboardUrl$.error(new Error(errorMessage));

      expectUrlsToMatch({ adminConventions: null });
      expectDashboardError(errorMessage);
    });

    it("should be able to load 2 different dashboards at the same time (agency and agencies for exemple)", () => {
      expectUrlsToMatch({ adminAgencyDetails: null, adminAgencies: null });

      store.dispatch(
        dashboardUrlsSlice.actions.dashboardUrlRequested({
          name: "adminAgencyDetails",
          agencyId: "my-agency-id",
        }),
      );

      store.dispatch(
        dashboardUrlsSlice.actions.dashboardUrlRequested({
          name: "adminAgencies",
        }),
      );

      const agencyValueFromApi: DashboardUrlAndName = {
        name: "adminAgencyDetails",
        url: "https://my-agency.url",
      };
      dependencies.adminGateway.dashboardUrl$.next(agencyValueFromApi);

      const agenciesValueFromApi: DashboardUrlAndName = {
        name: "adminAgencies",
        url: "https://agencies.url",
      };
      dependencies.adminGateway.dashboardUrl$.next(agenciesValueFromApi);

      expectUrlsToMatch({
        adminAgencyDetails: agencyValueFromApi.url,
        adminAgencies: agenciesValueFromApi.url,
      });
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
