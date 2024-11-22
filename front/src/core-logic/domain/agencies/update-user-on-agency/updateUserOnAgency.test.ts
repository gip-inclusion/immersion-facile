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
        jwt: "coonected-user-jwt",
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
  });
});
