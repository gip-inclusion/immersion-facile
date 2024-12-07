import { AgencyDtoBuilder, expectToEqual } from "shared";
import { agenciesPreloadedState } from "src/core-logic/domain/agencies/agenciesPreloadedState";
import { removeUserFromAgencySelectors } from "src/core-logic/domain/agencies/remove-user-from-agency/removeUserFromAgency.selectors";
import { removeUserFromAgencySlice } from "src/core-logic/domain/agencies/remove-user-from-agency/removeUserFromAgency.slice";

import { feedbacksSelectors } from "src/core-logic/domain/feedback/feedback.selectors";
import {
  TestDependencies,
  createTestStore,
} from "src/core-logic/storeConfig/createTestStore";
import { ReduxStore } from "src/core-logic/storeConfig/store";

const agencyDto = new AgencyDtoBuilder().build();

describe("RemoveUserFromAgency", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore({
      agency: agenciesPreloadedState({}),
    }));
  });

  const userToRemove = {
    id: "fake-id",
    email: "fake-email@mail.com",
    firstName: "fake-first-name",
    lastName: "fake-last-name",
    externalId: null,
    createdAt: new Date().toISOString(),
    agencyRights: {},
    dashboards: { agencies: {}, establishments: {} },
  };

  it("should remove user successfully", () => {
    expectToEqual(
      removeUserFromAgencySelectors.isLoading(store.getState()),
      false,
    );

    store.dispatch(
      removeUserFromAgencySlice.actions.removeUserFromAgencyRequested({
        userId: userToRemove.id,
        agencyId: agencyDto.id,
        feedbackTopic: "agency-user-for-dashboard",
      }),
    );

    expectToEqual(
      removeUserFromAgencySelectors.isLoading(store.getState()),
      true,
    );
    dependencies.agencyGateway.removeUserFromAgencyResponse$.next(undefined);

    expectToEqual(
      removeUserFromAgencySelectors.isLoading(store.getState()),
      false,
    );
    expectToEqual(
      feedbacksSelectors.feedbacks(store.getState())[
        "agency-user-for-dashboard"
      ],
      {
        level: "success",
        message: "Les données de l'utilisateur (rôles) ont été mises à jour.",
        on: "delete",
        title: "L'utilisateur n'est plus rattaché à cette agence",
      },
    );
  });

  it("should return an error if user removal went wrong", () => {
    const errorMessage =
      "Une erreur est survenue lors de la suppression du rattachement de l'utilisateur";

    expectToEqual(
      removeUserFromAgencySelectors.isLoading(store.getState()),
      false,
    );

    store.dispatch(
      removeUserFromAgencySlice.actions.removeUserFromAgencyRequested({
        userId: userToRemove.id,
        agencyId: agencyDto.id,
        feedbackTopic: "agency-user-for-dashboard",
      }),
    );

    expectToEqual(
      removeUserFromAgencySelectors.isLoading(store.getState()),
      true,
    );
    dependencies.agencyGateway.removeUserFromAgencyResponse$.error(
      new Error(errorMessage),
    );

    expectToEqual(
      removeUserFromAgencySelectors.isLoading(store.getState()),
      false,
    );

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
