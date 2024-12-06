import { values } from "ramda";
import {
  AgencyDto,
  AgencyDtoBuilder,
  AgencyRight,
  InclusionConnectedUser,
  expectToEqual,
} from "shared";
import {
  NormalizedIcUserById,
  NormalizedInclusionConnectedUser,
} from "src/core-logic/domain/admin/icUsersAdmin/icUsersAdmin.slice";
import { agenciesPreloadedState } from "src/core-logic/domain/agencies/agenciesPreloadedState";
import { createUserOnAgencySlice } from "src/core-logic/domain/agencies/create-user-on-agency/createUserOnAgency.slice";
import { fetchAgencySelectors } from "src/core-logic/domain/agencies/fetch-agency/fetchAgency.selectors";
import {
  FetchAgencyState,
  fetchAgencyInitialState,
  fetchAgencySlice,
} from "src/core-logic/domain/agencies/fetch-agency/fetchAgency.slice";
import { updateAgencySlice } from "src/core-logic/domain/agencies/update-agency/updateAgency.slice";
import { updateUserOnAgencySlice } from "src/core-logic/domain/agencies/update-user-on-agency/updateUserOnAgency.slice";

import { feedbacksSelectors } from "src/core-logic/domain/feedback/feedback.selectors";
import {
  TestDependencies,
  createTestStore,
} from "src/core-logic/storeConfig/createTestStore";
import { ReduxStore } from "src/core-logic/storeConfig/store";

const agencyDto = new AgencyDtoBuilder().build();

const user1: NormalizedInclusionConnectedUser = {
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
};

const user2: NormalizedInclusionConnectedUser = {
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
};

const fakeAgencyUsers: NormalizedIcUserById = {
  [user1.id]: user1,
  [user2.id]: user2,
};

describe("fetchAgency", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore({
      agency: agenciesPreloadedState({}),
    }));
  });

  describe("Fetch agency", () => {
    it("Fetch agency by id", () => {
      expectFetchAgencyStateToMatch(fetchAgencyInitialState);

      store.dispatch(
        fetchAgencySlice.actions.fetchAgencyRequested({
          agencyId: agencyDto.id,
          feedbackTopic: "agency-for-dashboard",
        }),
      );

      feedWithFetchedAgency(agencyDto);

      expectFetchAgencyStateToMatch({
        isLoading: false,
        agency: agencyDto,
      });
    });

    it("Failed when no agency fetched", () => {
      expectFetchAgencyStateToMatch(fetchAgencyInitialState);

      store.dispatch(
        fetchAgencySlice.actions.fetchAgencyRequested({
          agencyId: agencyDto.id,
          feedbackTopic: "agency-for-dashboard",
        }),
      );

      dependencies.agencyGateway.fetchedAgency$.error(
        new Error(
          "Une erreur est survenue lors de la récupération des données de cette agence",
        ),
      );

      expectFetchAgencyStateToMatch({
        isLoading: false,
        agency: null,
      });

      expectToEqual(
        feedbacksSelectors.feedbacks(store.getState())["agency-for-dashboard"],
        {
          level: "error",
          message:
            "Une erreur est survenue lors de la récupération des données de cette agence",
          on: "fetch",
          title:
            "Problème rencontré lors de la récupération des données de l'agence",
        },
      );
    });
  });

  describe("Fetch agency users", () => {
    it("Fetch agency users by agency id", () => {
      expectFetchAgencyStateToMatch(fetchAgencyInitialState);

      store.dispatch(
        fetchAgencySlice.actions.fetchAgencyUsersRequested({
          agencyId: agencyDto.id,
          feedbackTopic: "agency-user-for-dashboard",
        }),
      );

      feedWithFetchedAgencyUsers(fakeAgencyUsers);

      expectFetchAgencyStateToMatch({
        isLoading: false,
        agencyUsers: fakeAgencyUsers,
      });
    });

    it("Failed when no agency users fetched", () => {
      expectFetchAgencyStateToMatch(fetchAgencyInitialState);

      store.dispatch(
        fetchAgencySlice.actions.fetchAgencyUsersRequested({
          agencyId: agencyDto.id,
          feedbackTopic: "agency-user-for-dashboard",
        }),
      );

      dependencies.agencyGateway.fetchedAgencyUsers$.error(
        new Error(
          "Une erreur est survenue lors de la récupération de la liste des utilisateurs de cette agence",
        ),
      );

      expectFetchAgencyStateToMatch({
        isLoading: false,
        agencyUsers: {},
      });

      expectToEqual(
        feedbacksSelectors.feedbacks(store.getState())[
          "agency-user-for-dashboard"
        ],
        {
          level: "error",
          message:
            "Une erreur est survenue lors de la récupération de la liste des utilisateurs de cette agence",
          on: "fetch",
          title:
            "Problème rencontré lors de la récupération de la liste des utilisateurs",
        },
      );
    });
  });

  describe("clearAgencyAndUsers", () => {
    it("Clear agency and users", () => {
      ({ store, dependencies } = createTestStore({
        agency: agenciesPreloadedState({
          fetchAgency: {
            ...fetchAgencyInitialState,
            agency: agencyDto,
            agencyUsers: fakeAgencyUsers,
          },
        }),
      }));

      store.dispatch(fetchAgencySlice.actions.clearAgencyAndUsers());

      expectFetchAgencyStateToMatch({
        agency: null,
        agencyUsers: {},
      });
    });
  });

  describe("extra reducers", () => {
    it("update the agency successfully", () => {
      ({ store, dependencies } = createTestStore({
        agency: agenciesPreloadedState({
          fetchAgency: { ...fetchAgencyInitialState, agency: agencyDto },
        }),
      }));

      const updatedAgency = new AgencyDtoBuilder(agencyDto)
        .withName("updated-Name")
        .build();

      store.dispatch(
        updateAgencySlice.actions.updateAgencySucceeded({
          ...updatedAgency,
          feedbackTopic: "agency-for-dashboard",
        }),
      );

      expectFetchAgencyStateToMatch({ agency: updatedAgency });
    });

    it("should create user successfully", () => {
      ({ store, dependencies } = createTestStore({
        agency: agenciesPreloadedState({
          fetchAgency: {
            ...fetchAgencyInitialState,
            agency: agencyDto,
            agencyUsers: fakeAgencyUsers,
          },
        }),
      }));
      expectFetchAgencyStateToMatch({
        agency: agencyDto,
        agencyUsers: fakeAgencyUsers,
      });

      const agencyRight: AgencyRight = {
        agency: agencyDto,
        roles: ["validator"],
        isNotifiedByEmail: false,
      };

      const userToCreate: NormalizedInclusionConnectedUser = {
        id: "fake-id",
        email: "fake-email@mail.com",
        firstName: "fake-first-name",
        lastName: "fake-last-name",
        externalId: null,
        createdAt: new Date().toISOString(),
        agencyRights: {
          [agencyDto.id]: agencyRight,
        },
        dashboards: { agencies: {}, establishments: {} },
      };

      const icUser: InclusionConnectedUser = {
        ...userToCreate,
        agencyRights: [agencyRight],
      };

      store.dispatch(
        createUserOnAgencySlice.actions.createUserOnAgencySucceeded({
          agencyId: agencyDto.id,
          icUser: userToCreate,
          feedbackTopic: "agency-user-for-dashboard",
        }),
      );

      expectFetchAgencyStateToMatch({
        agency: agencyDto,
        agencyUsers: {
          ...fakeAgencyUsers,
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
    });

    it("should update user successfully", () => {
      ({ store, dependencies } = createTestStore({
        agency: agenciesPreloadedState({
          fetchAgency: {
            ...fetchAgencyInitialState,
            agencyUsers: fakeAgencyUsers,
          },
        }),
      }));

      const originalUser = fakeAgencyUsers[user1.id];

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

      expectFetchAgencyStateToMatch({
        agencyUsers: fakeAgencyUsers,
      });

      store.dispatch(
        updateUserOnAgencySlice.actions.updateUserAgencyRightSucceeded({
          userId: originalUser.id,
          agencyId: agencyDto.id,
          roles: updatedUser.agencyRights[agencyDto.id].roles,
          feedbackTopic: "agency-user-for-dashboard",
          isNotifiedByEmail: false,
          email: updatedUser.email,
        }),
      );

      expectFetchAgencyStateToMatch({
        agencyUsers: { ...fakeAgencyUsers, [originalUser.id]: updatedUser },
      });
    });
  });

  const expectFetchAgencyStateToMatch = (params: Partial<FetchAgencyState>) => {
    expectToEqual(fetchAgencySelectors.fetchAgencyState(store.getState()), {
      ...fetchAgencyInitialState,
      ...params,
    });
  };

  const feedWithFetchedAgency = (agencyDto: AgencyDto) => {
    dependencies.agencyGateway.fetchedAgency$.next(agencyDto);
  };
  const feedWithFetchedAgencyUsers = (agencyUsers: NormalizedIcUserById) => {
    dependencies.agencyGateway.fetchedAgencyUsers$.next(
      values(agencyUsers).map((agencyUser) => ({
        ...agencyUser,
        agencyRights: values(agencyUser.agencyRights),
      })),
    );
  };
});
