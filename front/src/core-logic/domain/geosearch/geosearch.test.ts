import {
  expectArraysToEqual,
  expectToEqual,
  LookupSearchResult,
} from "src/../../shared/src";
import {
  createTestStore,
  TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import { ReduxStore } from "src/core-logic/storeConfig/store";
import { geosearchSlice } from "./geosearch.slice";

describe("Geosearch epic", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore());
  });
  it("should update the searched query and reset the state", () => {
    const query = "fo";
    store.dispatch(geosearchSlice.actions.queryHasChanged(query));
    expectQueryToBe(query);
    expectLoadingToBe(false);
  });
  it("should trigger a new request to the gateway when query > threshold", () => {
    const query = "Poit";
    const expectedSuggestions: LookupSearchResult[] = [
      {
        label: "Saint-Georges-les-Baillargeaux",
        position: {
          lat: 45.984,
          lon: 2.5465,
        },
      },
    ];
    expectLoadingToBe(false);
    store.dispatch(geosearchSlice.actions.queryHasChanged(query));
    dependencies.scheduler.flush();
    expectLoadingToBe(true);
    expectSuggestionsToBe(expectedSuggestions);
  });
  const expectQueryToBe = (expected: string) => {
    expectToEqual(store.getState().geosearch.query, expected);
  };
  const expectLoadingToBe = (expected: boolean) => {
    expectToEqual(store.getState().geosearch.isLoading, expected);
  };
  const expectSuggestionsToBe = (expected: LookupSearchResult[]) => {
    expectArraysToEqual(store.getState().geosearch.suggestions, expected);
  };
});
