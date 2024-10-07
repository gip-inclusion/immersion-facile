import {
  listUsersSlice
} from "src/core-logic/domain/admin/listUsers/listUsers.slice";
import {
  createTestStore,
  TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import { ReduxStore } from "src/core-logic/storeConfig/store";

describe("Admin Users slice", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore());
  });

  it("fetches users", () => {
    store.dispatch(listUsersSlice.actions.fetchUsersRequested({emailContains: "yo"}))
    expect
  });
});
