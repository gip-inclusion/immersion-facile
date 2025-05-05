import {
  type LookupSearchResult,
  expectArraysToEqual,
  expectObjectsToMatch,
  expectToEqual,
} from "shared";
import { makeGeosearchLocatorSelector } from "src/core-logic/domain/geosearch/geosearch.selectors";
import {
  type TestDependencies,
  createTestStore,
} from "src/core-logic/storeConfig/createTestStore";
import type { ReduxStore } from "src/core-logic/storeConfig/store";
import { geosearchSlice } from "./geosearch.slice";

describe("Geosearch epic", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;
  const locator = "search-form-place";
  beforeEach(() => {
    ({ store, dependencies } = createTestStore());
  });

  it("should reset the value and suggestions when the query has been emptied", () => {
    store.dispatch(
      geosearchSlice.actions.selectSuggestionRequested({
        locator,
        item: {
          label: "Paris",
          position: {
            lat: 48.8566,
            lon: 2.3522,
          },
        },
      }),
    );
    store.dispatch(geosearchSlice.actions.emptyQueryRequested({ locator }));
    expect(store.getState().geosearch.data[locator]?.value).toBeNull();
    expect(store.getState().geosearch.data[locator]?.suggestions).toEqual([]);
  });

  it("should update the searched query and reset the state", () => {
    const query = "foi";
    store.dispatch(
      geosearchSlice.actions.changeQueryRequested({ locator, lookup: query }),
    );
    expectDebouncingToBe(true);
    dependencies.scheduler.flush();
    expectDebouncingToBe(false);
    expectLoadingToBe(true);
    expectQueryToBe(query);
  });

  it("shouldn't update the searched query if threshold is not reached", () => {
    const query = "fo";
    store.dispatch(
      geosearchSlice.actions.changeQueryRequested({ locator, lookup: query }),
    );
    expectDebouncingToBe(true);
    dependencies.scheduler.flush();
    expectLoadingToBe(false);
    expectQueryToBe("");
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
    store.dispatch(
      geosearchSlice.actions.changeQueryRequested({ locator, lookup: query }),
    );
    expectDebouncingToBe(true);
    dependencies.scheduler.flush();
    expectDebouncingToBe(false);
    expectLoadingToBe(true);
    dependencies.addressGateway.lookupLocationResults$.next(
      expectedSuggestions,
    );
    expectLoadingToBe(false);
    expectSuggestionsToBe(expectedSuggestions);
  });

  it("should update selected suggestion in store", () => {
    const lookupSearchResult: LookupSearchResult = {
      label: "Mon super résultat",
      position: {
        lat: 49.6548,
        lon: 2.65498,
      },
    };
    store.dispatch(
      geosearchSlice.actions.selectSuggestionRequested({
        locator,
        item: lookupSearchResult,
      }),
    );
    expectSelectedSuggestionToBe(lookupSearchResult);
  });

  it("should throw an error if something goes wrong and returns error feedback", () => {
    const errorMessage = "Error trying to get location";
    store.dispatch(
      geosearchSlice.actions.fetchSuggestionsRequested({
        locator,
        lookup: "bord",
      }),
    );
    dependencies.addressGateway.lookupLocationResults$.error(
      new Error(errorMessage),
    );
    expectLoadingToBe(false);
  });

  const expectQueryToBe = (expected: string) => {
    expectToEqual(
      makeGeosearchLocatorSelector(locator)(store.getState())?.query,
      expected,
    );
  };
  const expectLoadingToBe = (expected: boolean) => {
    expectToEqual(
      makeGeosearchLocatorSelector(locator)(store.getState())?.isLoading,
      expected,
    );
  };
  const expectDebouncingToBe = (expected: boolean) => {
    expectToEqual(
      makeGeosearchLocatorSelector(locator)(store.getState())?.isDebouncing,
      expected,
    );
  };
  const expectSuggestionsToBe = (expected: LookupSearchResult[]) => {
    expectArraysToEqual(
      makeGeosearchLocatorSelector(locator)?.(store.getState())?.suggestions ??
        [],
      expected,
    );
  };
  const expectSelectedSuggestionToBe = (expected: LookupSearchResult) => {
    expectObjectsToMatch(
      makeGeosearchLocatorSelector(locator)(store.getState())?.value,
      expected,
    );
  };
});
