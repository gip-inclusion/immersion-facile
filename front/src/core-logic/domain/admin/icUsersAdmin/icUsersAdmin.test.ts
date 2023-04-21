import { values } from "ramda";
import {
  AgencyDtoBuilder,
  AgencyId,
  AgencyRight,
  AuthenticatedUser,
  expectToEqual,
  IcUserRoleForAgencyParams,
} from "shared";
import { adminPreloadedState } from "src/core-logic/domain/admin/adminPreloadedState";
import { icUsersAdminSelectors } from "src/core-logic/domain/admin/icUsersAdmin/icUsersAdmin.selectors";
import {
  IcUsersAdminFeedback,
  icUsersAdminInitialState,
  icUsersAdminSlice,
  IcUsersAdminState,
  NormalizedIcUserById,
} from "src/core-logic/domain/admin/icUsersAdmin/icUsersAdmin.slice";
import {
  createTestStore,
  TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import { ReduxStore } from "src/core-logic/storeConfig/store";

const agency1 = new AgencyDtoBuilder().withId("agency-1").build();
const agency2 = new AgencyDtoBuilder().withId("agency-2").build();
const agency3 = new AgencyDtoBuilder().withId("agency-3").build();
const agency4 = new AgencyDtoBuilder().withId("agency-4").build();

const agency1Right: AgencyRight = { agency: agency1, role: "toReview" };
const agency2Right: AgencyRight = { agency: agency2, role: "validator" };
const user1AgencyRights: Record<AgencyId, AgencyRight> = {
  [agency1.id]: agency1Right,
  [agency2.id]: agency2Right,
};

const agency3Right: AgencyRight = { agency: agency3, role: "toReview" };
const agency4Right: AgencyRight = { agency: agency4, role: "toReview" };
const user2AgencyRights: Record<AgencyId, AgencyRight> = {
  [agency3.id]: agency3Right,
  [agency4.id]: agency4Right,
};

const user1Id = "user-id-1";
const authUser1: AuthenticatedUser = {
  id: user1Id,
  email: "user-email",
  firstName: "user-first-name",
  lastName: "user-last-name",
};

const user2Id = "user-id-2";
const authUser2: AuthenticatedUser = {
  id: user2Id,
  email: "user-email-2",
  firstName: "user-first-name-2",
  lastName: "user-last-name-2",
};

const testUserSet: NormalizedIcUserById = {
  [user1Id]: {
    ...authUser1,
    agencyRights: user1AgencyRights,
  },
  [user2Id]: {
    ...authUser2,
    agencyRights: user2AgencyRights,
  },
};

describe("Agency registration for authenticated users", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore());
  });

  describe("user selection", () => {
    it("selects the user to review", () => {
      ({ store, dependencies } = createTestStore({
        admin: adminPreloadedState({
          inclusionConnectedUsersAdmin: {
            ...icUsersAdminInitialState,
            icUsersNeedingReview: testUserSet,
            selectedUserId: null,
            feedback: { kind: "usersToReviewFetchSuccess" },
          },
        }),
      }));

      store.dispatch(
        icUsersAdminSlice.actions.inclusionConnectedUserSelected(user2Id),
      );

      expectAgencyAdminStateToMatch({
        icUsersNeedingReview: testUserSet,
        selectedUserId: user2Id,
        feedback: { kind: "usersToReviewFetchSuccess" },
      });
    });

    it("drops the error state when selecting", () => {
      ({ store, dependencies } = createTestStore({
        admin: adminPreloadedState({
          inclusionConnectedUsersAdmin: {
            ...icUsersAdminInitialState,
            icUsersNeedingReview: testUserSet,
            selectedUserId: null,
            feedback: { kind: "errored", errorMessage: "Opps" },
          },
        }),
      }));

      store.dispatch(
        icUsersAdminSlice.actions.inclusionConnectedUserSelected(user2Id),
      );

      expectAgencyAdminStateToMatch({
        icUsersNeedingReview: testUserSet,
        selectedUserId: user2Id,
        feedback: { kind: "usersToReviewFetchSuccess" },
      });
    });
  });

  describe("fetches inclusion connected users that have agencies to review", () => {
    it("gets the users successfully", () => {
      store.dispatch(
        icUsersAdminSlice.actions.fetchInclusionConnectedUsersToReviewRequested(),
      );
      expectIsFetchingIcUsersNeedingReviewToBe(true);

      dependencies.adminGateway.getAgencyUsersToReviewResponse$.next([
        {
          ...authUser1,
          agencyRights: [agency1Right, agency2Right],
        },
        {
          ...authUser2,
          agencyRights: [agency3Right, agency4Right],
        },
      ]);
      expectIsFetchingIcUsersNeedingReviewToBe(false);
      expectToEqual(
        icUsersAdminSelectors.icUsersNeedingReview(store.getState()),
        [authUser1, authUser2],
      );
      expectFeedbackToEqual({ kind: "usersToReviewFetchSuccess" });
    });

    it("stores error message when something goes wrong in fetching", () => {
      store.dispatch(
        icUsersAdminSlice.actions.fetchInclusionConnectedUsersToReviewRequested(),
      );
      const errorMessage = "Error fetching users to review";
      expectIsFetchingIcUsersNeedingReviewToBe(true);
      dependencies.adminGateway.getAgencyUsersToReviewResponse$.error(
        new Error(errorMessage),
      );
      expectIsFetchingIcUsersNeedingReviewToBe(false);
      expectFeedbackToEqual({ kind: "errored", errorMessage });
    });
  });

  describe("sets a role to a user for a given agency", () => {
    it("sets successfully the given role the agency for a given user", () => {
      ({ store, dependencies } = createTestStore({
        admin: adminPreloadedState({
          inclusionConnectedUsersAdmin: {
            ...icUsersAdminInitialState,
            icUsersNeedingReview: testUserSet,
            selectedUserId: user2Id,
          },
        }),
      }));

      const payload: IcUserRoleForAgencyParams = {
        agencyId: "agency-3",
        userId: user2Id,
        role: "validator",
      };

      expectToEqual(
        icUsersAdminSelectors.agenciesNeedingReviewForSelectedUser(
          store.getState(),
        ),
        values(user2AgencyRights),
      );
      store.dispatch(
        icUsersAdminSlice.actions.registerAgencyWithRoleToUserRequested(
          payload,
        ),
      );
      expectIsUpdatingUserAgencyToBe(true);
      dependencies.adminGateway.updateAgencyRoleForUserResponse$.next(
        undefined,
      );
      expectIsUpdatingUserAgencyToBe(false);

      expectToEqual(
        icUsersAdminSelectors.agenciesNeedingReviewForSelectedUser(
          store.getState(),
        ),
        [agency4Right],
      );
      expectFeedbackToEqual({ kind: "agencyRegisterToUserSuccess" });
    });

    it("stores error message when something goes wrong in the update", () => {
      const payload: IcUserRoleForAgencyParams = {
        agencyId: "agency-3",
        userId: "user-id",
        role: "validator",
      };
      const errorMessage = `Error registering user ${payload.userId} to agency ${payload.agencyId} with role ${payload.role}`;

      store.dispatch(
        icUsersAdminSlice.actions.registerAgencyWithRoleToUserRequested(
          payload,
        ),
      );
      expectIsUpdatingUserAgencyToBe(true);
      dependencies.adminGateway.updateAgencyRoleForUserResponse$.error(
        new Error(errorMessage),
      );
      expectIsUpdatingUserAgencyToBe(false);
      expectFeedbackToEqual({ kind: "errored", errorMessage });
    });
  });

  const expectIsUpdatingUserAgencyToBe = (expected: boolean) => {
    expect(
      store.getState().admin.inclusionConnectedUsersAdmin
        .isUpdatingIcUserAgency,
    ).toBe(expected);
  };

  const expectIsFetchingIcUsersNeedingReviewToBe = (expected: boolean) => {
    expect(
      store.getState().admin.inclusionConnectedUsersAdmin
        .isFetchingAgenciesNeedingReviewForIcUser,
    ).toBe(expected);
  };

  const expectFeedbackToEqual = (expected: IcUsersAdminFeedback) => {
    expectToEqual(icUsersAdminSelectors.feedback(store.getState()), expected);
  };

  const expectAgencyAdminStateToMatch = (
    params: Partial<IcUsersAdminState>,
  ) => {
    expectToEqual(store.getState().admin.inclusionConnectedUsersAdmin, {
      ...icUsersAdminInitialState,
      ...params,
    });
  };
});
