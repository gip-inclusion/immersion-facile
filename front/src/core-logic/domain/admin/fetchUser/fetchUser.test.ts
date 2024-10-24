import {
  InclusionConnectedUser,
  InclusionConnectedUserBuilder,
  expectToEqual,
} from "shared";
import { adminFetchUserSelectors } from "src/core-logic/domain/admin/fetchUser/fetchUser.selectors";
import { fetchUserSlice } from "src/core-logic/domain/admin/fetchUser/fetchUser.slice";
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

  const feedWithUsers = (icUser: InclusionConnectedUser) => {
    dependencies.adminGateway.getIcUserResponse$.next(icUser);
  };
});
