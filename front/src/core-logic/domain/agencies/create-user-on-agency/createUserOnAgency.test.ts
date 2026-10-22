import {
  AgencyDtoBuilder,
  type AgencyUserForListing,
  type ConnectedUser,
  errors,
  expectToEqual,
  noAgencyDashboards,
  noEstablishmentDashboard,
  toAgencyDtoForAgencyUsersAndAdmins,
} from "shared";
import { agenciesPreloadedState } from "src/core-logic/domain/agencies/agenciesPreloadedState";
import { createUserOnAgencySelectors } from "src/core-logic/domain/agencies/create-user-on-agency/createUserOnAgency.selectors";
import { createUserOnAgencySlice } from "src/core-logic/domain/agencies/create-user-on-agency/createUserOnAgency.slice";

import { feedbacksSelectors } from "src/core-logic/domain/feedback/feedback.selectors";
import {
  createTestStore,
  type TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import type { ReduxStore } from "src/core-logic/storeConfig/store";

const agencyDto = new AgencyDtoBuilder().build();

describe("CreateUserOnAgency", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore({
      agency: agenciesPreloadedState({}),
    }));
  });

  const userToCreate: AgencyUserForListing = {
    id: "fake-id",
    email: "fake-email@mail.com",
    firstName: "fake-first-name",
    lastName: "fake-last-name",
    agencyRightsByAgencyId: {},
    isProConnectUser: false,
  };

  it("should create user successfully", () => {
    expectToEqual(
      createUserOnAgencySelectors.isLoading(store.getState()),
      false,
    );

    store.dispatch(
      createUserOnAgencySlice.actions.createUserOnAgencyRequested({
        userId: userToCreate.id,
        agencyId: agencyDto.id,
        roles: ["validator"],
        isNotifiedByEmail: false,
        email: userToCreate.email,
        feedbackTopic: "agency-user-for-dashboard",
      }),
    );

    expectToEqual(
      createUserOnAgencySelectors.isLoading(store.getState()),
      true,
    );

    const user: ConnectedUser = {
      id: userToCreate.id,
      email: userToCreate.email,
      firstName: userToCreate.firstName,
      lastName: userToCreate.lastName,
      createdAt: new Date().toISOString(),
      preventToDelete: false,
      proConnect: null,
      dashboards: {
        agencies: noAgencyDashboards,
        establishments: noEstablishmentDashboard,
      },
      agencyRights: [
        {
          agency: toAgencyDtoForAgencyUsersAndAdmins(agencyDto, []),
          roles: ["validator"],
          isNotifiedByEmail: false,
        },
      ],
    };
    dependencies.agencyGateway.createUserForAgencyResponse$.next(user);

    expectToEqual(
      createUserOnAgencySelectors.isLoading(store.getState()),
      false,
    );

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
    expectToEqual(
      createUserOnAgencySelectors.isLoading(store.getState()),
      false,
    );

    store.dispatch(
      createUserOnAgencySlice.actions.createUserOnAgencyRequested({
        userId: userToCreate.id,
        agencyId: agencyDto.id,
        roles: ["validator"],
        isNotifiedByEmail: false,
        email: userToCreate.email,
        feedbackTopic: "agency-user-for-dashboard",
      }),
    );

    expectToEqual(
      createUserOnAgencySelectors.isLoading(store.getState()),
      true,
    );

    dependencies.agencyGateway.createUserForAgencyResponse$.error(
      errors.agency.notFound({ agencyId: agencyDto.id }),
    );

    expectToEqual(
      createUserOnAgencySelectors.isLoading(store.getState()),
      false,
    );

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
