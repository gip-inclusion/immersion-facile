import { DashboardUrlAndName, expectObjectsToMatch } from "shared";
import { adminSelectors } from "src/core-logic/domain/admin/admin.selectors";
import {
  DashboardUrls,
  dashboardUrlsSlice,
} from "src/core-logic/domain/admin/dashboardUrls/dashboardUrls.slice";
import {
  TestDependencies,
  createTestStore,
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
      const valueFromApi: DashboardUrlAndName = {
        name: "conventions",
        url: "https://conventions.url",
      };
      dependencies.adminGateway.dashboardUrl$.next(valueFromApi);

      expectUrlsToMatch({ conventions: valueFromApi.url });
      expectDashboardError(null);
    });

    it("should store AbsoluteUrl in establishments when requesting establishments dashboard", () => {
      expectUrlsToMatch({ establishments: null });

      store.dispatch(
        dashboardUrlsSlice.actions.dashboardUrlRequested({
          name: "establishments",
        }),
      );
      const valueFromApi: DashboardUrlAndName = {
        name: "establishments",
        url: "https://establishments.url",
      };
      dependencies.adminGateway.dashboardUrl$.next(valueFromApi);

      expectUrlsToMatch({ establishments: valueFromApi.url });
      expectDashboardError(null);
    });

    it("should store AbsoluteUrl in events when requesting events dashboard", () => {
      expectUrlsToMatch({ agencyForAdmin: null });

      store.dispatch(
        dashboardUrlsSlice.actions.dashboardUrlRequested({
          name: "agencyForAdmin",
          agencyId: "my-agency-id",
        }),
      );
      const valueFromApi: DashboardUrlAndName = {
        name: "agencyForAdmin",
        url: "https://agency.url",
      };
      dependencies.adminGateway.dashboardUrl$.next(valueFromApi);

      expectUrlsToMatch({ agencyForAdmin: valueFromApi.url });
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

    it("should be able to load 2 different dashboards at the same time (agency and agencies for exemple)", () => {
      expectUrlsToMatch({ agencyForAdmin: null, agencies: null });

      store.dispatch(
        dashboardUrlsSlice.actions.dashboardUrlRequested({
          name: "agencyForAdmin",
          agencyId: "my-agency-id",
        }),
      );

      store.dispatch(
        dashboardUrlsSlice.actions.dashboardUrlRequested({
          name: "agencies",
        }),
      );

      const agencyValueFromApi: DashboardUrlAndName = {
        name: "agencyForAdmin",
        url: "https://my-agency.url",
      };
      dependencies.adminGateway.dashboardUrl$.next(agencyValueFromApi);

      const agenciesValueFromApi: DashboardUrlAndName = {
        name: "agencies",
        url: "https://agencies.url",
      };
      dependencies.adminGateway.dashboardUrl$.next(agenciesValueFromApi);

      expectUrlsToMatch({
        agencyForAdmin: agencyValueFromApi.url,
        agencies: agenciesValueFromApi.url,
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
