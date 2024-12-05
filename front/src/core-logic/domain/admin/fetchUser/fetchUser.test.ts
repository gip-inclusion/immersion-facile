import {
  AgencyDtoBuilder,
  AgencyRight,
  InclusionConnectedUser,
  InclusionConnectedUserBuilder,
  expectToEqual,
} from "shared";
import { adminPreloadedState } from "src/core-logic/domain/admin/adminPreloadedState";
import { adminFetchUserSelectors } from "src/core-logic/domain/admin/fetchUser/fetchUser.selectors";
import { fetchUserSlice } from "src/core-logic/domain/admin/fetchUser/fetchUser.slice";
import { updateUserOnAgencySlice } from "src/core-logic/domain/agencies/update-user-on-agency/updateUserOnAgency.slice";
import {
  TestDependencies,
  createTestStore,
} from "src/core-logic/storeConfig/createTestStore";
import { ReduxStore } from "src/core-logic/storeConfig/store";

const icUser = new InclusionConnectedUserBuilder().build();

describe("Admin Users slice", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore());
  });

  it("fetches the user successfully", () => {
    expectToEqual(adminFetchUserSelectors.isFetching(store.getState()), false);
    expectToEqual(adminFetchUserSelectors.fetchedUser(store.getState()), null);

    store.dispatch(
      fetchUserSlice.actions.fetchUserRequested({ userId: icUser.id }),
    );

    expectToEqual(adminFetchUserSelectors.isFetching(store.getState()), true);

    feedWithUsers(icUser);

    expectToEqual(adminFetchUserSelectors.isFetching(store.getState()), false);
    expectToEqual(
      adminFetchUserSelectors.fetchedUser(store.getState()),
      icUser,
    );
  });

  describe("on updateUserOnAgencySlice.actions.updateUserAgencyRightSucceeded", () => {
    it("if it is user in slice, update the user rights successfully", () => {
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
      }));

      store.dispatch(
        updateUserOnAgencySlice.actions.updateUserAgencyRightSucceeded({
          userId: user.id,
          agencyId: agency.id,
          email: user.email,
          roles: [...agencyRight.roles, "counsellor"],
          isNotifiedByEmail: agencyRight.isNotifiedByEmail,
          feedbackTopic: "user",
        }),
      );

      expectToEqual(adminFetchUserSelectors.fetchedUser(store.getState()), {
        ...user,
        agencyRights: [
          {
            ...agencyRight,
            roles: [...agencyRight.roles, "counsellor"],
          },
        ],
      });
    });

    it("if it is not user in slice, do nothing", () => {
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
      }));

      store.dispatch(
        updateUserOnAgencySlice.actions.updateUserAgencyRightSucceeded({
          userId: "another-user-id",
          agencyId: agency.id,
          email: "another-user-id@email.com",
          roles: [...agencyRight.roles, "counsellor"],
          isNotifiedByEmail: agencyRight.isNotifiedByEmail,
          feedbackTopic: "user",
        }),
      );

      expectToEqual(
        adminFetchUserSelectors.fetchedUser(store.getState()),
        user,
      );
    });
  });

  const feedWithUsers = (icUser: InclusionConnectedUser) => {
    dependencies.adminGateway.getIcUserResponse$.next(icUser);
  };
});
