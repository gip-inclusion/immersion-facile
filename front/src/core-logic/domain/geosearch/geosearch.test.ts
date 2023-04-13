import {
  expectArraysToEqual,
  expectObjectsToMatch,
  expectToEqual,
  LookupSearchResult,
} from "shared";

import {
  createTestStore,
  TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import { ReduxStore } from "src/core-logic/storeConfig/store";

import { GeoSearchFeedback, geosearchSlice } from "./geosearch.slice";

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
    store.dispatch(geosearchSlice.actions.queryHasChanged(query));
    dependencies.scheduler.flush();
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
      geosearchSlice.actions.suggestionHasBeenSelected(lookupSearchResult),
    );
    expectSelectedSuggestionToBe(lookupSearchResult);
  });

  it("should throw an error if something goes wrong and returns error feedback", () => {
    const errorMessage = "Error trying to get location";
    store.dispatch(geosearchSlice.actions.suggestionsHaveBeenRequested("bord"));
    dependencies.addressGateway.lookupLocationResults$.error(
      new Error(errorMessage),
    );
    expectLoadingToBe(false);
    expectFeedbackToEqual({
      kind: "errored",
      errorMessage,
    });
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
  const expectSelectedSuggestionToBe = (expected: LookupSearchResult) => {
    expectObjectsToMatch(store.getState().geosearch.value, expected);
  };
  const expectFeedbackToEqual = (feedback: GeoSearchFeedback) =>
    expect(store.getState().geosearch.feedback).toEqual(feedback);
});
