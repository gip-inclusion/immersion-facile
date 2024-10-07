import { expectToEqual, User } from "shared";
import { listUsersSelectors } from "src/core-logic/domain/admin/listUsers/listUsers.selectors";
import { listUsersSlice } from "src/core-logic/domain/admin/listUsers/listUsers.slice";
import {
  createTestStore,
  TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import { ReduxStore } from "src/core-logic/storeConfig/store";

const someUser: User = {
  id: "some-user-id",
  email: "yolo@mail.com",
  firstName: "Yo",
  lastName: "Lo",
  externalId: "external-123",
  createdAt: new Date().toISOString(),
};

describe("Admin Users slice", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore());
  });

  it("updates the query", () => {
    const query = "my query";
    store.dispatch(listUsersSlice.actions.queryUpdated(query));
    expectToEqual(listUsersSelectors.query(store.getState()), query);
  });

  it("fetches users successfully", () => {
    expectToEqual(listUsersSelectors.isFetching(store.getState()), false);
    expectToEqual(listUsersSelectors.users(store.getState()), []);

    store.dispatch(
      listUsersSlice.actions.fetchUsersRequested({ emailContains: "yo" }),
    );

    expectToEqual(listUsersSelectors.isFetching(store.getState()), true);

    feedWithUsers([someUser]);

    expectToEqual(listUsersSelectors.isFetching(store.getState()), false);
    expectToEqual(listUsersSelectors.users(store.getState()), [someUser]);
  });

  it("triggers fetch when query value changes, but not before 400 ms", () => {
    const query = "my query";
    store.dispatch(listUsersSlice.actions.queryUpdated(query));
    expectToEqual(listUsersSelectors.isFetching(store.getState()), false);
    fastForwardObservables()
    expectToEqual(listUsersSelectors.isFetching(store.getState()), true);

    feedWithUsers([someUser]);
    expectToEqual(listUsersSelectors.isFetching(store.getState()), false);
    expectToEqual(listUsersSelectors.users(store.getState()), [someUser]);
  })

  const feedWithUsers = (users: User[]) => {
    dependencies.adminGateway.listUsersResponse$.next(users);
  };

  const fastForwardObservables = () => dependencies.scheduler.flush();
});
