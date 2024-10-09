import { values } from "ramda";
import {
  AgencyDto,
  AgencyDtoBuilder,
  AgencyId,
  AgencyRight,
  InclusionConnectedUser,
  RejectIcUserRoleForAgencyParams,
  User,
  UserParamsForAgency,
  errors,
  expectToEqual,
} from "shared";
import { adminPreloadedState } from "src/core-logic/domain/admin/adminPreloadedState";
import { icUsersAdminSelectors } from "src/core-logic/domain/admin/icUsersAdmin/icUsersAdmin.selectors";
import {
  IcUsersAdminFeedback,
  IcUsersAdminState,
  NormalizedIcUserById,
  NormalizedInclusionConnectedUser,
  icUsersAdminInitialState,
  icUsersAdminSlice,
} from "src/core-logic/domain/admin/icUsersAdmin/icUsersAdmin.slice";
import {
  TestDependencies,
  createTestStore,
} from "src/core-logic/storeConfig/createTestStore";
import { ReduxStore } from "src/core-logic/storeConfig/store";
import { feedbacksSelectors } from "../../feedback/feedback.selectors";
import { agencyAdminSelectors } from "../agenciesAdmin/agencyAdmin.selectors";
import { agencyAdminInitialState } from "../agenciesAdmin/agencyAdmin.slice";

const agency1 = new AgencyDtoBuilder().withId("agency-1").build();
const agency2 = new AgencyDtoBuilder().withId("agency-2").build();
const agency3 = new AgencyDtoBuilder().withId("agency-3").build();
const agency4 = new AgencyDtoBuilder().withId("agency-4").build();

const agency1Right: AgencyRight = {
  agency: agency1,
  roles: ["to-review"],
  isNotifiedByEmail: true,
};
const agency2Right: AgencyRight = {
  agency: agency2,
  roles: ["validator"],
  isNotifiedByEmail: true,
};
const user1AgencyRights: Record<AgencyId, AgencyRight> = {
  [agency1.id]: agency1Right,
  [agency2.id]: agency2Right,
};

const agency3Right: AgencyRight = {
  agency: agency3,
  roles: ["to-review"],
  isNotifiedByEmail: true,
};
const agency4Right: AgencyRight = {
  agency: agency4,
  roles: ["to-review"],
  isNotifiedByEmail: true,
};
const user2AgencyRights: Record<AgencyId, AgencyRight> = {
  [agency3.id]: agency3Right,
  [agency4.id]: agency4Right,
};

const user1Id = "user-id-1";
const authUser1: User = {
  id: user1Id,
  email: "user-email",
  firstName: "user-first-name",
  lastName: "user-last-name",
  externalId: "fake-user-external-id-1",
  createdAt: new Date().toISOString(),
};

const user2Id = "user-id-2";
const authUser2: User = {
  id: user2Id,
  email: "user-email-2",
  firstName: "user-first-name-2",
  lastName: "user-last-name-2",
  externalId: "fake-user-external-id-2",
  createdAt: new Date().toISOString(),
};

const testUserSet: NormalizedIcUserById = {
  [user1Id]: {
    ...authUser1,
    agencyRights: user1AgencyRights,
    dashboards: { agencies: {}, establishments: {} },
  },
  [user2Id]: {
    ...authUser2,
    agencyRights: user2AgencyRights,
    dashboards: { agencies: {}, establishments: {} },
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
            selectedUser: null,
            feedback: { kind: "usersToReviewFetchSuccess" },
          },
        }),
      }));

      store.dispatch(
        icUsersAdminSlice.actions.inclusionConnectedUserSelected(authUser2),
      );

      expectAgencyAdminStateToMatch({
        icUsersNeedingReview: testUserSet,
        selectedUser: authUser2,
        feedback: { kind: "usersToReviewFetchSuccess" },
      });
    });

    it("drops the error state when selecting", () => {
      ({ store, dependencies } = createTestStore({
        admin: adminPreloadedState({
          inclusionConnectedUsersAdmin: {
            ...icUsersAdminInitialState,
            icUsersNeedingReview: testUserSet,
            selectedUser: null,
            feedback: { kind: "errored", errorMessage: "Opps" },
          },
        }),
      }));

      store.dispatch(
        icUsersAdminSlice.actions.inclusionConnectedUserSelected(authUser2),
      );

      expectAgencyAdminStateToMatch({
        icUsersNeedingReview: testUserSet,
        selectedUser: authUser2,
        feedback: { kind: "usersToReviewFetchSuccess" },
      });
    });
  });

  describe("fetches inclusion connected users that have agencies to review", () => {
    it("gets the users by agencyId successfully", () => {
      expectToEqual(
        icUsersAdminSelectors.icUsersNeedingReview(store.getState()),
        [],
      );
      store.dispatch(
        icUsersAdminSlice.actions.fetchInclusionConnectedUsersToReviewRequested(
          {
            agencyId: agency2.id,
          },
        ),
      );
      expectIsFetchingIcUsersNeedingReviewToBe(true);

      dependencies.adminGateway.getAgencyUsersToReviewResponse$.next([
        {
          ...authUser1,
          agencyRights: [agency1Right, agency2Right],
          dashboards: { agencies: {}, establishments: {} },
        },
      ]);
      expectIsFetchingIcUsersNeedingReviewToBe(false);
      expectToEqual(
        icUsersAdminSelectors.icUsersNeedingReview(store.getState()),
        [authUser1],
      );
      expectFeedbackToEqual({ kind: "usersToReviewFetchSuccess" });
    });

    it("gets the users by agencyRole successfully", () => {
      expectToEqual(
        icUsersAdminSelectors.icUsersNeedingReview(store.getState()),
        [],
      );
      store.dispatch(
        icUsersAdminSlice.actions.fetchInclusionConnectedUsersToReviewRequested(
          {
            agencyRole: "to-review",
          },
        ),
      );
      expectIsFetchingIcUsersNeedingReviewToBe(true);

      dependencies.adminGateway.getAgencyUsersToReviewResponse$.next([
        {
          ...authUser1,
          agencyRights: [agency1Right, agency2Right],
          dashboards: { agencies: {}, establishments: {} },
        },
        {
          ...authUser2,
          agencyRights: [agency3Right, agency4Right],
          dashboards: { agencies: {}, establishments: {} },
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
        icUsersAdminSlice.actions.fetchInclusionConnectedUsersToReviewRequested(
          {
            agencyRole: "to-review",
          },
        ),
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

  describe("fetches agency users", () => {
    it("gets the users by agencyId successfully", () => {
      const agencyUser: NormalizedIcUserById[keyof NormalizedIcUserById] = {
        ...authUser1,
        agencyRights: {
          [agency1Right.agency.id]: agency1Right,
          [agency2Right.agency.id]: agency2Right,
        },
        dashboards: { agencies: {}, establishments: {} },
      };
      store.dispatch(
        icUsersAdminSlice.actions.fetchAgencyUsersRequested({
          agencyId: agency2.id,
        }),
      );
      expectIsFetchingAgencyUsersToBe(true);

      dependencies.adminGateway.getAgencyUsersToReviewResponse$.next([
        {
          ...authUser1,
          agencyRights: [agency1Right, agency2Right],
          dashboards: { agencies: {}, establishments: {} },
        },
      ]);
      expectIsFetchingAgencyUsersToBe(false);
      expectToEqual(icUsersAdminSelectors.agencyUsers(store.getState()), {
        [agencyUser.id]: agencyUser,
      });
      expectFeedbackToEqual({ kind: "agencyUsersFetchSuccess" });
    });

    it("stores error message when something goes wrong in fetching", () => {
      store.dispatch(
        icUsersAdminSlice.actions.fetchAgencyUsersRequested({
          agencyId: "any-id",
        }),
      );
      const errorMessage = "Error fetching users";
      expectIsFetchingAgencyUsersToBe(true);
      dependencies.adminGateway.getAgencyUsersToReviewResponse$.error(
        new Error(errorMessage),
      );
      expectIsFetchingAgencyUsersToBe(false);
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
            selectedUser: authUser2,
          },
        }),
      }));

      const payload: UserParamsForAgency = {
        agencyId: "agency-3",
        userId: user2Id,
        roles: ["validator"],
        isNotifiedByEmail: false,
        email: "email@email.fr",
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
      const payload: UserParamsForAgency = {
        agencyId: "agency-3",
        userId: "user-id",
        roles: ["validator"],
        isNotifiedByEmail: false,
        email: "email@email.fr",
      };
      const errorMessage = `Error registering user ${payload.userId} to agency ${payload.agencyId} with roles ${payload.roles}`;

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

  describe("Reject user registration for agency", () => {
    it("rejects successfully the user for agency", () => {
      ({ store, dependencies } = createTestStore({
        admin: adminPreloadedState({
          inclusionConnectedUsersAdmin: {
            ...icUsersAdminInitialState,
            icUsersNeedingReview: testUserSet,
          },
        }),
      }));
      const payload: RejectIcUserRoleForAgencyParams = {
        agencyId: agency3.id,
        justification: "osef",
        userId: user2Id,
      };

      store.dispatch(
        icUsersAdminSlice.actions.rejectAgencyWithRoleToUserRequested(payload),
      );

      expectIsUpdatingUserAgencyToBe(true);

      dependencies.adminGateway.rejectUserToAgencyResponse$.next();

      expectIsUpdatingUserAgencyToBe(false);
      expectFeedbackToEqual({ kind: "agencyRejectionForUserSuccess" });
    });

    it("Fail to rejects the user for agency", () => {
      const errorMessage = "reject user for agency failed";
      expectToEqual(
        store.getState().admin.inclusionConnectedUsersAdmin,
        icUsersAdminInitialState,
      );
      store.dispatch(
        icUsersAdminSlice.actions.rejectAgencyWithRoleToUserRequested({
          agencyId: "rejected-user-for-this-agency",
          justification: "osef",
          userId: "user-to-reject-id",
        }),
      );

      expectIsUpdatingUserAgencyToBe(true);

      dependencies.adminGateway.rejectUserToAgencyResponse$.error(
        new Error(errorMessage),
      );

      expectIsUpdatingUserAgencyToBe(false);
      expectFeedbackToEqual({ kind: "errored", errorMessage });
    });
  });

  describe("Update users on agency", () => {
    it("should update user successfully", () => {
      const prefilledAdminState = adminPreloadedState({
        inclusionConnectedUsersAdmin: {
          ...icUsersAdminInitialState,
          agencyUsers: testUserSet,
        },
      });
      ({ store, dependencies } = createTestStore({
        admin: prefilledAdminState,
      }));
      const originalUser = testUserSet[user1Id];
      const updatedUser: NormalizedInclusionConnectedUser = {
        ...originalUser,
        email: "updated-email@email.fr",
        agencyRights: {
          ...originalUser.agencyRights,
          [agency2.id]: {
            ...originalUser.agencyRights[agency2.id],
            roles: ["agency-admin", "validator"],
            isNotifiedByEmail: false,
          },
        },
      };

      expectToEqual(
        store.getState().admin.inclusionConnectedUsersAdmin,
        prefilledAdminState.inclusionConnectedUsersAdmin,
      );

      store.dispatch(
        icUsersAdminSlice.actions.updateUserOnAgencyRequested({
          userId: originalUser.id,
          agencyId: agency2.id,
          roles: updatedUser.agencyRights[agency2.id].roles,
          feedbackTopic: "agency-user",
          isNotifiedByEmail: false,
          email: "updated-email@email.fr",
        }),
      );

      expectIsUpdatingUserAgencyToBe(true);
      dependencies.adminGateway.updateAgencyRoleForUserResponse$.next(
        undefined,
      );
      const expected: NormalizedIcUserById = {
        ...icUsersAdminSelectors.agencyUsers(store.getState()),
        [originalUser.id]: updatedUser,
      };
      expectIsUpdatingUserAgencyToBe(false);

      expectToEqual(
        icUsersAdminSelectors.agencyUsers(store.getState()),
        expected,
      );
      expectToEqual(
        feedbacksSelectors.feedbacks(store.getState())["agency-user"],
        {
          level: "success",
          message: "Les données de l'utilisateur (rôles) ont été mises à jour.",
          on: "update",
          title: "L'utilisateur a été mis à jour",
        },
      );
    });
    it("should return an error if update went wrong", () => {
      const prefilledAdminState = adminPreloadedState({
        inclusionConnectedUsersAdmin: {
          ...icUsersAdminInitialState,
          agencyUsers: testUserSet,
        },
      });
      ({ store, dependencies } = createTestStore({
        admin: prefilledAdminState,
      }));
      const originalUser = testUserSet[user1Id];
      const errorMessage =
        "Une erreur est survenue lors de la mise à jour de l'utilisateur";

      expectToEqual(
        store.getState().admin.inclusionConnectedUsersAdmin,
        prefilledAdminState.inclusionConnectedUsersAdmin,
      );

      store.dispatch(
        icUsersAdminSlice.actions.updateUserOnAgencyRequested({
          userId: originalUser.id,
          agencyId: agency2.id,
          roles: originalUser.agencyRights[agency2.id].roles,
          feedbackTopic: "agency-user",
          isNotifiedByEmail: false,
          email: "email@email.fr",
        }),
      );

      expectIsUpdatingUserAgencyToBe(true);
      dependencies.adminGateway.updateAgencyRoleForUserResponse$.error(
        new Error(errorMessage),
      );
      expectIsUpdatingUserAgencyToBe(false);

      expectToEqual(
        feedbacksSelectors.feedbacks(store.getState())["agency-user"],
        {
          level: "error",
          message:
            "Une erreur est survenue lors de la mise à jour de l'utilisateur",
          on: "update",
          title: "Problème lors de la mise à jour de l'utilisateur",
        },
      );
    });
    it("should refetch agency after user updates", () => {
      const agency = new AgencyDtoBuilder()
        .withId("1")
        .withCounsellorEmails(["bob@mail.com"])
        .withValidatorEmails(["validator@mail.com"])
        .build();
      const agencyWithRefersToAgencyFields = {
        ...agency,
        refersToAgencyName: null,
      };

      ({ store, dependencies } = createTestStore({
        admin: adminPreloadedState({
          agencyAdmin: {
            ...agencyAdminInitialState,
            agency: agencyWithRefersToAgencyFields,
          },
          inclusionConnectedUsersAdmin: {
            ...icUsersAdminInitialState,
            agencyUsers: testUserSet,
          },
        }),
      }));

      store.dispatch(
        icUsersAdminSlice.actions.updateUserOnAgencyRequested({
          userId: user2Id,
          agencyId: agency3.id,
          roles: ["validator"],
          feedbackTopic: "agency-user",
          isNotifiedByEmail: false,
          email: "email@email.fr",
        }),
      );
      expectIsUpdatingUserAgencyToBe(true);
      dependencies.adminGateway.updateAgencyRoleForUserResponse$.next(
        undefined,
      );

      const expectedAgency: AgencyDto = {
        ...agencyWithRefersToAgencyFields,
        validatorEmails: ["bob@mail.com", "validator@mail.com"],
        counsellorEmails: [],
      };
      dependencies.agencyGateway.fetchedAgency$.next(expectedAgency);
      expectToEqual(
        agencyAdminSelectors.agency(store.getState()),
        expectedAgency,
      );
    });
  });

  describe("Create users on agency", () => {
    it("should create user successfully", () => {
      expectToEqual(
        store.getState().admin.inclusionConnectedUsersAdmin,
        icUsersAdminInitialState,
      );

      const userToCreate: NormalizedInclusionConnectedUser = {
        id: "fake-id",
        email: "fake-email@mail.com",
        firstName: "fake-first-name",
        lastName: "fake-last-name",
        externalId: null,
        createdAt: new Date().toISOString(),
        agencyRights: {},
        dashboards: { agencies: {}, establishments: {} },
      };

      store.dispatch(
        icUsersAdminSlice.actions.createUserOnAgencyRequested({
          userId: userToCreate.id,
          agencyId: agency2.id,
          roles: ["validator"],
          isNotifiedByEmail: false,
          email: userToCreate.email,
          feedbackTopic: "agency-user",
        }),
      );

      expectIsUpdatingUserAgencyToBe(true);

      const icUser: InclusionConnectedUser = {
        ...userToCreate,
        agencyRights: [
          {
            agency: agency2,
            roles: ["validator"],
            isNotifiedByEmail: false,
          },
        ],
      };
      dependencies.adminGateway.createUserForAgencyResponse$.next(icUser);

      expectIsUpdatingUserAgencyToBe(false);

      expectToEqual(icUsersAdminSelectors.agencyUsers(store.getState()), {
        [userToCreate.id]: {
          ...icUser,
          agencyRights: {
            [agency2.id]: {
              agency: agency2,
              roles: ["validator"],
              isNotifiedByEmail: false,
            },
          },
        },
      });
      expectToEqual(
        feedbacksSelectors.feedbacks(store.getState())["agency-user"],
        {
          level: "success",
          message: "L'utilisateur a été créé et associé à cette agence.",
          on: "create",
          title: "L'utilisateur a été créé",
        },
      );
    });

    it("return an error if creation went wrong", () => {
      expectToEqual(
        store.getState().admin.inclusionConnectedUsersAdmin,
        icUsersAdminInitialState,
      );

      const userToCreate: NormalizedInclusionConnectedUser = {
        id: "fake-id",
        email: "fake-email@mail.com",
        firstName: "fake-first-name",
        lastName: "fake-last-name",
        externalId: null,
        createdAt: new Date().toISOString(),
        agencyRights: {},
        dashboards: { agencies: {}, establishments: {} },
      };

      store.dispatch(
        icUsersAdminSlice.actions.createUserOnAgencyRequested({
          userId: userToCreate.id,
          agencyId: agency2.id,
          roles: ["validator"],
          isNotifiedByEmail: false,
          email: userToCreate.email,
          feedbackTopic: "agency-user",
        }),
      );

      expectIsUpdatingUserAgencyToBe(true);

      dependencies.adminGateway.createUserForAgencyResponse$.error(
        errors.agency.notFound({ agencyId: agency2.id }),
      );

      expectIsUpdatingUserAgencyToBe(false);

      expectToEqual(
        icUsersAdminSelectors.agencyUsers(store.getState()),
        icUsersAdminInitialState.agencyUsers,
      );
      expectToEqual(
        feedbacksSelectors.feedbacks(store.getState())["agency-user"],
        {
          level: "error",
          message: errors.agency.notFound({ agencyId: agency2.id }).message,
          on: "create",
          title: "Problème lors de la création de l'utilisateur",
        },
      );
    });
  });

  describe("Remove users from agency", () => {
    it("should remove user successfully", () => {
      const prefilledAdminState = adminPreloadedState({
        inclusionConnectedUsersAdmin: {
          ...icUsersAdminInitialState,
          agencyUsers: testUserSet,
        },
      });
      ({ store, dependencies } = createTestStore({
        admin: prefilledAdminState,
      }));
      const userToRemove = testUserSet[user1Id];

      expectToEqual(
        store.getState().admin.inclusionConnectedUsersAdmin,
        prefilledAdminState.inclusionConnectedUsersAdmin,
      );

      store.dispatch(
        icUsersAdminSlice.actions.removeUserFromAgencyRequested({
          userId: userToRemove.id,
          agencyId: agency1.id,
          feedbackTopic: "agency-user",
        }),
      );

      expectIsUpdatingUserAgencyToBe(true);
      dependencies.adminGateway.removeUserFromAgencyResponse$.next(undefined);

      expectIsUpdatingUserAgencyToBe(false);
      expectToEqual(icUsersAdminSelectors.agencyUsers(store.getState()), {
        [user2Id]: testUserSet[user2Id],
      });
      expectToEqual(
        feedbacksSelectors.feedbacks(store.getState())["agency-user"],
        {
          level: "success",
          message: "Les données de l'utilisateur (rôles) ont été mises à jour.",
          on: "delete",
          title: "L'utilisateur n'est plus rattaché à cette agence",
        },
      );
    });

    it("should return an error if user removal went wrong", () => {
      const prefilledAdminState = adminPreloadedState({
        inclusionConnectedUsersAdmin: {
          ...icUsersAdminInitialState,
          agencyUsers: testUserSet,
        },
      });
      ({ store, dependencies } = createTestStore({
        admin: prefilledAdminState,
      }));
      const userToRemove = testUserSet[user1Id];
      const errorMessage =
        "Une erreur est survenue lors de la suppression du rattachement de l'utilisateur";

      expectToEqual(
        store.getState().admin.inclusionConnectedUsersAdmin,
        prefilledAdminState.inclusionConnectedUsersAdmin,
      );

      store.dispatch(
        icUsersAdminSlice.actions.removeUserFromAgencyRequested({
          userId: userToRemove.id,
          agencyId: agency1.id,
          feedbackTopic: "agency-user",
        }),
      );

      expectIsUpdatingUserAgencyToBe(true);
      dependencies.adminGateway.removeUserFromAgencyResponse$.error(
        new Error(errorMessage),
      );
      expectIsUpdatingUserAgencyToBe(false);

      expectToEqual(
        feedbacksSelectors.feedbacks(store.getState())["agency-user"],
        {
          level: "error",
          message: errorMessage,
          on: "delete",
          title:
            "Problème lors de la suppression du rattachement l'utilisateur à cette agence",
        },
      );
    });
  });

  const expectIsUpdatingUserAgencyToBe = (expected: boolean) => {
    expect(icUsersAdminSelectors.isUpdatingIcUserAgency(store.getState())).toBe(
      expected,
    );
  };

  const expectIsFetchingIcUsersNeedingReviewToBe = (expected: boolean) => {
    expect(
      store.getState().admin.inclusionConnectedUsersAdmin
        .isFetchingAgenciesNeedingReviewForIcUser,
    ).toBe(expected);
  };

  const expectIsFetchingAgencyUsersToBe = (expected: boolean) => {
    expect(
      store.getState().admin.inclusionConnectedUsersAdmin.isFetchingAgencyUsers,
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
