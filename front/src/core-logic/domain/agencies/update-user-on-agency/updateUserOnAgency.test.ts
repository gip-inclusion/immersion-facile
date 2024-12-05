import {
  AgencyDtoBuilder,
  AgencyRight,
  InclusionConnectedUser,
  InclusionConnectedUserBuilder,
  expectToEqual,
} from "shared";
import { adminPreloadedState } from "src/core-logic/domain/admin/adminPreloadedState";
import { updateUserOnAgencySelectors } from "src/core-logic/domain/agencies/update-user-on-agency/updateUserOnAgency.selectors";
import { updateUserOnAgencySlice } from "src/core-logic/domain/agencies/update-user-on-agency/updateUserOnAgency.slice";
import { feedbacksSelectors } from "src/core-logic/domain/feedback/feedback.selectors";
import {
  TestDependencies,
  createTestStore,
} from "src/core-logic/storeConfig/createTestStore";
import { ReduxStore } from "src/core-logic/storeConfig/store";

describe("UpdateUserOnAgency slice", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore());
  });

  it("update the user rights successfully", () => {
    const agency = new AgencyDtoBuilder().build();
    const agencyRight: AgencyRight = {
      agency,
      roles: ["validator"],
      isNotifiedByEmail: false,
    };
    const user: InclusionConnectedUser = new InclusionConnectedUserBuilder()
      .withId("user-id")
      .withIsAdmin(false)
      .withAgencyRights([agencyRight])
      .build();
    ({ store, dependencies } = createTestStore({
      admin: adminPreloadedState({
        fetchUser: {
          user,
          isFetching: false,
        },
      }),
      agency: {
        updateUserOnAgency: {
          isLoading: false,
        },
      },
    }));

    store.dispatch(
      updateUserOnAgencySlice.actions.updateUserAgencyRightRequested({
        user: {
          userId: user.id,
          agencyId: agency.id,
          email: user.email,
          roles: [...agencyRight.roles, "counsellor"],
          isNotifiedByEmail: agencyRight.isNotifiedByEmail,
        },
        jwt: "connected-user-jwt",
        feedbackTopic: "user",
      }),
    );

    expectToEqual(
      updateUserOnAgencySelectors.isLoading(store.getState()),
      true,
    );

    dependencies.agencyGateway.updateUserAgencyRightResponse$.next(undefined);

    expectToEqual(
      updateUserOnAgencySelectors.isLoading(store.getState()),
      false,
    );
    expectToEqual(feedbacksSelectors.feedbacks(store.getState()).user, {
      level: "success",
      message: "Les données de l'utilisateur (rôles) ont été mises à jour.",
      on: "update",
      title: "L'utilisateur a été mis à jour",
    });
  });

  it("not update the user rights if error", () => {
    store.dispatch(
      updateUserOnAgencySlice.actions.updateUserAgencyRightRequested({
        user: {
          userId: "userId",
          agencyId: "agencyId",
          email: "user@email.fr",
          roles: ["counsellor"],
          isNotifiedByEmail: true,
        },
        jwt: "connected-user-jwt",
        feedbackTopic: "user",
      }),
    );

    expectToEqual(
      updateUserOnAgencySelectors.isLoading(store.getState()),
      true,
    );

    dependencies.agencyGateway.updateUserAgencyRightResponse$.error(
      "Une erreur est survenue lors de la mise à jour de l'utilisateur",
    );

    expectToEqual(
      updateUserOnAgencySelectors.isLoading(store.getState()),
      false,
    );
    expectToEqual(feedbacksSelectors.feedbacks(store.getState()).user, {
      level: "error",
      message:
        "Une erreur est survenue lors de la mise à jour de l'utilisateur",
      on: "update",
      title: "Problème lors de la mise à jour de l'utilisateur",
    });
  });
});
