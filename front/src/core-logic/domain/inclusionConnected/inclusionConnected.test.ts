import {
  AgencyDtoBuilder,
  expectToEqual,
  InclusionConnectedUser,
  WithAgencyIds,
} from "shared";
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

const agency1 = new AgencyDtoBuilder().withId("agency-1").build();
describe("InclusionConnected", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore());
  });

  it("fetches the current IC user", () => {
    expectIsLoadingToBe(false);
    expectCurrentUserToBe(null);
    expectFeedbackToEqual({ kind: "idle" });
    store.dispatch(inclusionConnectedSlice.actions.currentUserFetchRequested());
    expectIsLoadingToBe(true);

    const expectedUser: InclusionConnectedUser = {
      email: "fake-user@inclusion-connect.fr",
      firstName: "Fake",
      lastName: "User",
      id: "fake-user-id",
      dashboardUrl: "https://placeholder.com/",
      agencyRights: [
        {
          role: "agencyOwner",
          agency: new AgencyDtoBuilder().build(),
        },
      ],
    };
    dependencies.inclusionConnectedGateway.currentUser$.next(expectedUser);
    expectIsLoadingToBe(false);
    expectCurrentUserToBe(expectedUser);
    expectFeedbackToEqual({ kind: "success" });
  });

  it("stores error on failure when trying to fetch current IC user", () => {
    expectIsLoadingToBe(false);
    expectCurrentUserToBe(null);
    store.dispatch(inclusionConnectedSlice.actions.currentUserFetchRequested());
    expectIsLoadingToBe(true);

    const errorMessage = "Something went wrong";
    dependencies.inclusionConnectedGateway.currentUser$.error(
      new Error(errorMessage),
    );
    expectIsLoadingToBe(false);
    expectCurrentUserToBe(null);
    expectFeedbackToEqual({ kind: "errored", errorMessage });
  });

  it("disconnects the users if the response includes : 'jwt expired'", () => {
    ({ store, dependencies } = createTestStore({
      auth: {
        federatedIdentityWithUser: {
          token: "some-existing-token",
          provider: "inclusionConnect",
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@mail.com",
        },
      },
    }));
    store.dispatch(inclusionConnectedSlice.actions.currentUserFetchRequested());
    expectIsLoadingToBe(true);

    const errorMessage = "Something went wrong : jwt expired";
    dependencies.inclusionConnectedGateway.currentUser$.error(
      new Error(errorMessage),
    );
    expectCurrentUserToBe(null);
    expectFeedbackToEqual({ kind: "idle" });
  });

  it("request agencies registration on the current user", () => {
    const agency1 = new AgencyDtoBuilder().withId("agency-1").build();
    const payload: WithAgencyIds = {
      agencies: [agency1.id],
    };

    store.dispatch(
      inclusionConnectedSlice.actions.registerAgenciesRequested(payload),
    );
    expectIsLoadingToBe(true);
    dependencies.inclusionConnectedGateway.registerAgenciesToCurrentUserResponse$.next(
      undefined,
    );
    expectIsLoadingToBe(false);
    expectFeedbackToEqual({ kind: "agencyRegistrationSuccess" });
  });

  it("request agencies registration on the current user to throw on error", () => {
    const payload: WithAgencyIds = {
      agencies: [agency1.id],
    };
    const errorMessage = "Error registering user to agencies to review";
    store.dispatch(
      inclusionConnectedSlice.actions.registerAgenciesRequested(payload),
    );
    expectIsLoadingToBe(true);
    dependencies.inclusionConnectedGateway.registerAgenciesToCurrentUserResponse$.error(
      new Error(errorMessage),
    );
    expectIsLoadingToBe(false);
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

  const expectCurrentUserToBe = (expected: InclusionConnectedUser | null) => {
    expect(inclusionConnectedSelectors.currentUser(store.getState())).toBe(
      expected,
    );
  };
});
