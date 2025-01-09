import {
  AgencyDtoBuilder,
  InclusionConnectedUser,
  errors,
  expectToEqual,
  toAgencyDtoForAgencyUsersAndAdmins,
} from "shared";
import { NormalizedInclusionConnectedUser } from "src/core-logic/domain/admin/icUsersAdmin/icUsersAdmin.slice";
import { agenciesPreloadedState } from "src/core-logic/domain/agencies/agenciesPreloadedState";
import { createUserOnAgencySelectors } from "src/core-logic/domain/agencies/create-user-on-agency/createUserOnAgency.selectors";
import { createUserOnAgencySlice } from "src/core-logic/domain/agencies/create-user-on-agency/createUserOnAgency.slice";

import { feedbacksSelectors } from "src/core-logic/domain/feedback/feedback.selectors";
import {
  TestDependencies,
  createTestStore,
} from "src/core-logic/storeConfig/createTestStore";
import { ReduxStore } from "src/core-logic/storeConfig/store";

const agencyDto = new AgencyDtoBuilder().build();

describe("CreateUserOnAgency", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore({
      agency: agenciesPreloadedState({}),
    }));
  });

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

    const icUser: InclusionConnectedUser = {
      ...userToCreate,
      agencyRights: [
        {
          agency: toAgencyDtoForAgencyUsersAndAdmins(agencyDto, []),
          roles: ["validator"],
          isNotifiedByEmail: false,
        },
      ],
    };
    dependencies.agencyGateway.createUserForAgencyResponse$.next(icUser);

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
