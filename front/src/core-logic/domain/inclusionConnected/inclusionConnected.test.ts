import { expectToEqual } from "shared";
import { inclusionConnectedSelectors } from "src/core-logic/domain/inclusionConnected/inclusionConnected.selectors";
import {
  InclusionConnectedFeedback,
  inclusionConnectedSlice,
} from "src/core-logic/domain/inclusionConnected/inclusionConnected.slice";
import {
  createTestStore,
  TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import { ReduxStore } from "src/core-logic/storeConfig/store";

describe("InclusionConnected", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore());
  });

  it("fetches the Agency Dashboard", () => {
    expectIsLoadingToBe(false);
    expectDashboardUrlToBe(null);
    expectFeedbackToEqual({ kind: "idle" });
    store.dispatch(
      inclusionConnectedSlice.actions.agencyDashboardUrlFetchRequested(),
    );
    expectIsLoadingToBe(true);

    const dashboardUrl = "https://example.com";
    dependencies.inclusionConnectedGateway.dashboardUrl$.next(dashboardUrl);
    expectIsLoadingToBe(false);
    expectDashboardUrlToBe(dashboardUrl);
    expectFeedbackToEqual({ kind: "success" });
  });

  it("stores error on failure when trying to fetch agency dashboard", () => {
    expectIsLoadingToBe(false);
    expectDashboardUrlToBe(null);
    store.dispatch(
      inclusionConnectedSlice.actions.agencyDashboardUrlFetchRequested(),
    );
    expectIsLoadingToBe(true);

    const errorMessage = "Something went wrong";
    dependencies.inclusionConnectedGateway.dashboardUrl$.error(
      new Error(errorMessage),
    );
    expectIsLoadingToBe(false);
    expectDashboardUrlToBe(null);
    expectFeedbackToEqual({ kind: "errored", errorMessage });
  });

  const expectIsLoadingToBe = (expected: boolean) => {
    expect(inclusionConnectedSelectors.isLoading(store.getState())).toBe(
      expected,
    );
  };

  const expectFeedbackToEqual = (expected: InclusionConnectedFeedback) => {
    expectToEqual(
      inclusionConnectedSelectors.feedback(store.getState()),
      expected,
    );
  };

  const expectDashboardUrlToBe = (expected: string | null) => {
    expect(
      inclusionConnectedSelectors.agencyDashboardUrl(store.getState()),
    ).toBe(expected);
  };
});
