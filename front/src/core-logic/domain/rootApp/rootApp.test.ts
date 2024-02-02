import { CombinedState } from "@reduxjs/toolkit";
import { rootAppSlice } from "src/core-logic/domain/rootApp/rootApp.slice";
import { searchSlice } from "src/core-logic/domain/search/search.slice";
import {
  TestDependencies,
  createTestStore,
} from "src/core-logic/storeConfig/createTestStore";
import { ReduxStore } from "src/core-logic/storeConfig/store";

describe("rootApp epic", () => {
  let store: ReduxStore;
  let afterResetStoreState: CombinedState<unknown>;
  let dependencies: TestDependencies;
  beforeEach(() => {
    ({ store, dependencies } = createTestStore());
    afterResetStoreState = { ...store.getState() };
  });

  it("should reset the app store", () => {
    store.dispatch(
      searchSlice.actions.searchRequested({
        distanceKm: 10,
        longitude: 0,
        latitude: 0,
        appellationCodes: ["11000"],
        sortedBy: "distance",
        place: "23 rue lunaire, 44000 Nantes",
      }),
    );
    expect(store.getState()).not.toEqual(afterResetStoreState);

    store.dispatch(rootAppSlice.actions.appResetRequested());

    expect(store.getState()).toEqual(afterResetStoreState);
  });

  it("should dispatch appIsReady action", () => {
    dependencies.deviceRepository.set("adminToken", "my-super-token");

    expect(store.getState().admin.adminAuth.adminToken).toBeNull();

    store.dispatch(rootAppSlice.actions.appResetRequested());

    expect(store.getState().admin.adminAuth.adminToken).toBe("my-super-token");
  });
});
