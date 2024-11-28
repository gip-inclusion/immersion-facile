import { values } from "ramda";
import {
  AgencyDto,
  AgencyDtoBuilder,
  InclusionConnectedUser,
  errors,
  expectToEqual,
} from "shared";
import {
  NormalizedIcUserById,
  NormalizedInclusionConnectedUser,
} from "src/core-logic/domain/admin/icUsersAdmin/icUsersAdmin.slice";

import { agencyDashboardSelectors } from "src/core-logic/domain/dashboards/agencyDashboard/agencyDashboard.selectors";

import {
  AgencyDashboardState,
  agencyDashboardInitialState,
  agencyDashboardSlice,
} from "src/core-logic/domain/dashboards/agencyDashboard/agencyDashboard.slice";
import { feedbacksSelectors } from "src/core-logic/domain/feedback/feedback.selectors";
import {
  TestDependencies,
  createTestStore,
} from "src/core-logic/storeConfig/createTestStore";
import { ReduxStore } from "src/core-logic/storeConfig/store";

const agencyDto = new AgencyDtoBuilder().build();
const agency1 = new AgencyDtoBuilder().withId("agency-1").build();

describe("agencyDashboard", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore({
      dashboards: { agencyDashboard: agencyDashboardInitialState },
    }));
  });

  describe("agency", () => {
    const fakeAgencyUsers: NormalizedIcUserById = {
      "fake-user-id-1": {
        id: "fake-user-id-1",
        email: "jbon8745@wanadoo.fr",
        firstName: "Jean",
        lastName: "Bon",
        agencyRights: {
          [agencyDto.id]: {
            agency: agencyDto,
            isNotifiedByEmail: true,
            roles: ["agency-admin"],
          },
        },
        dashboards: { agencies: {}, establishments: {} },
        externalId: "fake-user-external-id-1",
        createdAt: new Date().toISOString(),
      },
      "user-in-error": {
        id: "user-in-error",
        email: "fake-user-email-4@test.fr",
        firstName: "Jean-Michel",
        lastName: "Jeplante",
        agencyRights: {
          [agencyDto.id]: {
            agency: agencyDto,
            isNotifiedByEmail: true,
            roles: ["agency-admin"],
          },
        },
        dashboards: { agencies: {}, establishments: {} },
        externalId: "fake-user-in-error-external-id",
        createdAt: new Date().toISOString(),
      },
    };

    describe("Fetch agency", () => {
      it("Fetch agency by id", () => {
        expectAgencyDashboardStateToMatch(agencyDashboardInitialState);

        store.dispatch(
          agencyDashboardSlice.actions.fetchAgencyRequested(agencyDto.id),
        );

        feedWithFetchedAgency(agencyDto);

        expectAgencyDashboardStateToMatch({
          isFetchingAgency: false,
          agency: agencyDto,
        });
      });

      it("Failed when no agency fetched", () => {
        expectAgencyDashboardStateToMatch(agencyDashboardInitialState);

        store.dispatch(
          agencyDashboardSlice.actions.fetchAgencyRequested(agencyDto.id),
        );

        dependencies.agencyGateway.fetchedAgencyForDashboard$.error(
          new Error("some-error"),
        );

        expectAgencyDashboardStateToMatch({
          isFetchingAgency: false,
          feedback: { kind: "errored", errorMessage: "some-error" },
          agency: null,
        });
      });
    });

    describe("Fetch agency users", () => {
      it("Fetch agency users by agency id", () => {
        expectAgencyDashboardStateToMatch(agencyDashboardInitialState);

        store.dispatch(
          agencyDashboardSlice.actions.fetchAgencyUsersRequested(agencyDto.id),
        );

        feedWithFetchedAgencyUsers(fakeAgencyUsers);

        expectAgencyDashboardStateToMatch({
          isFetchingAgencyUsers: false,
          agencyUsers: fakeAgencyUsers,
        });
      });

      it("Failed when no agency users fetched", () => {
        expectAgencyDashboardStateToMatch(agencyDashboardInitialState);

        store.dispatch(
          agencyDashboardSlice.actions.fetchAgencyUsersRequested(agencyDto.id),
        );

        dependencies.agencyGateway.fetchedAgencyUsers$.error(
          new Error("some-error"),
        );

        expectAgencyDashboardStateToMatch({
          isFetchingAgencyUsers: false,
          feedback: { kind: "errored", errorMessage: "some-error" },
          agencyUsers: {},
        });
      });
    });

    describe("clearAgencyAndUsers", () => {
      it("Clear agency and users", () => {
        expectAgencyDashboardStateToMatch(agencyDashboardInitialState);

        store.dispatch(
          agencyDashboardSlice.actions.fetchAgencyRequested(agencyDto.id),
        );
        store.dispatch(
          agencyDashboardSlice.actions.fetchAgencyUsersRequested(agencyDto.id),
        );

        feedWithFetchedAgencyUsers(fakeAgencyUsers);
        feedWithFetchedAgency(agencyDto);

        expectAgencyDashboardStateToMatch({
          agency: agencyDto,
          agencyUsers: fakeAgencyUsers,
        });

        store.dispatch(agencyDashboardSlice.actions.clearAgencyAndUsers());

        expectAgencyDashboardStateToMatch({
          agency: null,
          agencyUsers: {},
          feedback: { kind: "idle" },
        });
      });
    });

    describe("updateAgency", () => {
      const agencyDto = new AgencyDtoBuilder().build();

      it("shows when update is ongoing", () => {
        store.dispatch(
          agencyDashboardSlice.actions.updateAgencyRequested(agencyDto),
        );
        expectAgencyDashboardStateToMatch({
          isUpdating: true,
        });
      });

      it("reset feedback to idle when updating an agency", () => {
        ({ store, dependencies } = createTestStore({
          dashboards: {
            agencyDashboard: {
              ...agencyDashboardInitialState,
              feedback: { kind: "errored", errorMessage: "something wrong" },
            },
          },
        }));
        store.dispatch(
          agencyDashboardSlice.actions.updateAgencyRequested(agencyDto),
        );
        expectAgencyDashboardStateToMatch({
          isUpdating: true,
          feedback: { kind: "idle" },
        });
      });

      it("send request to update agency, shows feedback and stor the updating agency", () => {
        const updatedAgency: AgencyDto = {
          ...agencyDto,
          validatorEmails: ["a@b.com", "c@d.com"],
        };
        store.dispatch(
          agencyDashboardSlice.actions.updateAgencyRequested(updatedAgency),
        );

        dependencies.agencyGateway.updateAgencyFromDashboardResponse$.next(
          undefined,
        );

        expectAgencyDashboardStateToMatch({
          isUpdating: false,
          feedback: { kind: "agencyUpdated" },
        });
      });

      it("when something goes wrong, shows error", () => {
        store.dispatch(
          agencyDashboardSlice.actions.updateAgencyRequested(agencyDto),
        );

        dependencies.agencyGateway.updateAgencyFromDashboardResponse$.error(
          new Error("Something went wrong !"),
        );
        expectAgencyDashboardStateToMatch({
          isUpdating: false,
          feedback: { kind: "errored", errorMessage: "Something went wrong !" },
        });
      });
    });
  });

  describe("users", () => {
    const user1: NormalizedInclusionConnectedUser = {
      id: "user1-id",
      email: "user1-email@mail.com",
      firstName: "user1-first-name",
      lastName: "user1-last-name",
      externalId: null,
      createdAt: new Date().toISOString(),
      agencyRights: {
        [agencyDto.id]: {
          agency: agencyDto,
          isNotifiedByEmail: true,
          roles: ["validator"],
        },
      },
      dashboards: { agencies: {}, establishments: {} },
    };

    const user2: NormalizedInclusionConnectedUser = {
      id: "user2-id",
      email: "user2-email@mail.com",
      firstName: "user2-first-name",
      lastName: "user2-last-name",
      externalId: null,
      createdAt: new Date().toISOString(),
      agencyRights: {
        [agency1.id]: {
          agency: agency1,
          isNotifiedByEmail: true,
          roles: ["validator"],
        },
        [agencyDto.id]: {
          agency: agencyDto,
          isNotifiedByEmail: true,
          roles: ["counsellor"],
        },
      },
      dashboards: { agencies: {}, establishments: {} },
    };
    const testUserSet: NormalizedIcUserById = {
      [user1.id]: user1,
      [user2.id]: user2,
    };

    beforeEach(() => {
      ({ store, dependencies } = createTestStore({
        dashboards: {
          agencyDashboard: {
            ...agencyDashboardInitialState,
            agencyUsers: testUserSet,
          },
        },
      }));
    });
    describe("Create users on agency", () => {
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

      it("should create user successfully", () => {
        expectAgencyDashboardStateToMatch({
          ...agencyDashboardInitialState,
          agencyUsers: testUserSet,
        });

        store.dispatch(
          agencyDashboardSlice.actions.createUserOnAgencyRequested({
            userId: userToCreate.id,
            agencyId: agencyDto.id,
            roles: ["validator"],
            isNotifiedByEmail: false,
            email: userToCreate.email,
            feedbackTopic: "agency-user-for-dashboard",
          }),
        );

        expectIsUpdatingUserAgencyToBe(true);

        const icUser: InclusionConnectedUser = {
          ...userToCreate,
          agencyRights: [
            {
              agency: agencyDto,
              roles: ["validator"],
              isNotifiedByEmail: false,
            },
          ],
        };
        dependencies.agencyGateway.createUserForAgencyResponse$.next(icUser);

        expectIsUpdatingUserAgencyToBe(false);

        expectAgencyDashboardStateToMatch({
          agencyUsers: {
            ...testUserSet,
            [userToCreate.id]: {
              ...icUser,
              agencyRights: {
                [agencyDto.id]: {
                  agency: agencyDto,
                  roles: ["validator"],
                  isNotifiedByEmail: false,
                },
              },
            },
          },
        });

        expectToEqual(
          feedbacksSelectors.feedbacks(store.getState())[
            "agency-user-for-dashboard"
          ],
          {
            level: "success",
            message: "L'utilisateur a été créé et associé à cette agence.",
            on: "create",
            title: "L'utilisateur a été créé",
          },
        );
      });

      it("return an error if creation went wrong", () => {
        expectAgencyDashboardStateToMatch({
          ...agencyDashboardInitialState,
          agencyUsers: testUserSet,
        });

        store.dispatch(
          agencyDashboardSlice.actions.createUserOnAgencyRequested({
            userId: userToCreate.id,
            agencyId: agencyDto.id,
            roles: ["validator"],
            isNotifiedByEmail: false,
            email: userToCreate.email,
            feedbackTopic: "agency-user-for-dashboard",
          }),
        );

        expectIsUpdatingUserAgencyToBe(true);

        dependencies.agencyGateway.createUserForAgencyResponse$.error(
          errors.agency.notFound({ agencyId: agencyDto.id }),
        );

        expectIsUpdatingUserAgencyToBe(false);

        expectAgencyDashboardStateToMatch({
          ...agencyDashboardInitialState,
          agencyUsers: testUserSet,
        });

        expectToEqual(
          feedbacksSelectors.feedbacks(store.getState())[
            "agency-user-for-dashboard"
          ],
          {
            level: "error",
            message: errors.agency.notFound({ agencyId: agencyDto.id }).message,
            on: "create",
            title: "Problème lors de la création de l'utilisateur",
          },
        );
      });
    });

    describe("Update users on agency", () => {
      it("should update user successfully", () => {
        const originalUser = testUserSet[user1.id];

        const updatedUser: NormalizedInclusionConnectedUser = {
          ...originalUser,
          email: "updated-email@email.fr",
          agencyRights: {
            ...originalUser.agencyRights,
            [agencyDto.id]: {
              ...originalUser.agencyRights[agencyDto.id],
              roles: ["agency-admin", "validator"],
              isNotifiedByEmail: false,
            },
          },
        };

        expectAgencyDashboardStateToMatch({
          ...agencyDashboardInitialState,
          agencyUsers: testUserSet,
        });

        store.dispatch(
          agencyDashboardSlice.actions.updateUserOnAgencyRequested({
            userId: originalUser.id,
            agencyId: agencyDto.id,
            roles: updatedUser.agencyRights[agencyDto.id].roles,
            feedbackTopic: "agency-user-for-dashboard",
            isNotifiedByEmail: false,
            email: updatedUser.email,
          }),
        );

        expectIsUpdatingUserAgencyToBe(true);
        dependencies.agencyGateway.updateAgencyRoleForUserResponse$.next(
          undefined,
        );

        expectIsUpdatingUserAgencyToBe(false);

        expectAgencyDashboardStateToMatch({
          agencyUsers: { ...testUserSet, [originalUser.id]: updatedUser },
        });
        expectToEqual(
          feedbacksSelectors.feedbacks(store.getState())[
            "agency-user-for-dashboard"
          ],
          {
            level: "success",
            message:
              "Les données de l'utilisateur (rôles) ont été mises à jour.",
            on: "update",
            title: "L'utilisateur a été mis à jour",
          },
        );
      });
      it("should return an error if update went wrong", () => {
        const originalUser = testUserSet[user1.id];
        const errorMessage =
          "Une erreur est survenue lors de la mise à jour de l'utilisateur";

        expectAgencyDashboardStateToMatch({
          ...agencyDashboardInitialState,
          agencyUsers: testUserSet,
        });

        store.dispatch(
          agencyDashboardSlice.actions.updateUserOnAgencyRequested({
            userId: originalUser.id,
            agencyId: agencyDto.id,
            roles: originalUser.agencyRights[agencyDto.id].roles,
            feedbackTopic: "agency-user-for-dashboard",
            isNotifiedByEmail: false,
            email: "email@email.fr",
          }),
        );

        expectIsUpdatingUserAgencyToBe(true);
        dependencies.agencyGateway.updateAgencyRoleForUserResponse$.error(
          new Error(errorMessage),
        );
        expectIsUpdatingUserAgencyToBe(false);

        expectAgencyDashboardStateToMatch({
          ...agencyDashboardInitialState,
          agencyUsers: testUserSet,
        });

        expectToEqual(
          feedbacksSelectors.feedbacks(store.getState())[
            "agency-user-for-dashboard"
          ],
          {
            level: "error",
            message:
              "Une erreur est survenue lors de la mise à jour de l'utilisateur",
            on: "update",
            title: "Problème lors de la mise à jour de l'utilisateur",
          },
        );
      });
    });

    describe("Remove users from agency", () => {
      it("should remove user successfully", () => {
        const userToRemove = testUserSet[user2.id];

        expectAgencyDashboardStateToMatch({
          ...agencyDashboardInitialState,
          agencyUsers: testUserSet,
        });

        store.dispatch(
          agencyDashboardSlice.actions.removeUserFromAgencyRequested({
            userId: userToRemove.id,
            agencyId: agencyDto.id,
            feedbackTopic: "agency-user-for-dashboard",
          }),
        );

        expectIsUpdatingUserAgencyToBe(true);
        dependencies.agencyGateway.removeUserFromAgencyResponse$.next(
          undefined,
        );

        expectIsUpdatingUserAgencyToBe(false);

        expectAgencyDashboardStateToMatch({
          agencyUsers: { [user1.id]: testUserSet[user1.id] },
        });
        expectToEqual(
          feedbacksSelectors.feedbacks(store.getState())[
            "agency-user-for-dashboard"
          ],
          {
            level: "success",
            message:
              "Les données de l'utilisateur (rôles) ont été mises à jour.",
            on: "delete",
            title: "L'utilisateur n'est plus rattaché à cette agence",
          },
        );
      });

      it("should return an error if user removal went wrong", () => {
        const userToRemove = testUserSet[user2.id];
        const errorMessage =
          "Une erreur est survenue lors de la suppression du rattachement de l'utilisateur";

        expectAgencyDashboardStateToMatch({
          ...agencyDashboardInitialState,
          agencyUsers: testUserSet,
        });

        store.dispatch(
          agencyDashboardSlice.actions.removeUserFromAgencyRequested({
            userId: userToRemove.id,
            agencyId: agencyDto.id,
            feedbackTopic: "agency-user-for-dashboard",
          }),
        );

        expectIsUpdatingUserAgencyToBe(true);
        dependencies.agencyGateway.removeUserFromAgencyResponse$.error(
          new Error(errorMessage),
        );
        expectIsUpdatingUserAgencyToBe(false);

        expectAgencyDashboardStateToMatch({
          ...agencyDashboardInitialState,
          agencyUsers: testUserSet,
        });

        expectToEqual(
          feedbacksSelectors.feedbacks(store.getState())[
            "agency-user-for-dashboard"
          ],
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
  });

  const expectAgencyDashboardStateToMatch = (
    params: Partial<AgencyDashboardState>,
  ) => {
    expectToEqual(
      agencyDashboardSelectors.agencyDashboardState(store.getState()),
      {
        ...agencyDashboardInitialState,
        ...params,
      },
    );
  };

  const feedWithFetchedAgency = (agencyDto: AgencyDto) => {
    dependencies.agencyGateway.fetchedAgencyForDashboard$.next(agencyDto);
  };
  const feedWithFetchedAgencyUsers = (agencyUsers: NormalizedIcUserById) => {
    dependencies.agencyGateway.fetchedAgencyUsers$.next(
      values(agencyUsers).map((agencyUser) => ({
        ...agencyUser,
        agencyRights: values(agencyUser.agencyRights),
      })),
    );
  };

  const expectIsUpdatingUserAgencyToBe = (expected: boolean) => {
    expect(
      agencyDashboardSelectors.isUpdatingIcUserAgency(store.getState()),
    ).toBe(expected);
  };
});
