import {
  type AppellationDto,
  type AppellationMatchDto,
  expectArraysToEqual,
  expectObjectsToMatch,
  expectToEqual,
} from "shared";
import { appellationSelectors } from "src/core-logic/domain/appellation/appellation.selectors";
import {
  type TestDependencies,
  createTestStore,
} from "src/core-logic/storeConfig/createTestStore";
import type { ReduxStore } from "src/core-logic/storeConfig/store";
import { appellationSlice } from "./appellation.slice";

describe("Appellation epic", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore());
  });

  it("should reset the value and suggestions when the query has been emptied", () => {
    store.dispatch(
      appellationSlice.actions.suggestionHasBeenSelected({
        appellationMatch: {
          appellation: {
            appellationCode: "12345",
            appellationLabel: "Test Appellation",
            romeCode: "A1234",
            romeLabel: "Test Rome",
          },
          matchRanges: [
            {
              endIndexExclusive: 10,
              startIndexInclusive: 0,
            },
          ],
        },
        appellationAutocompleteLocator: "searchAppellation",
      }),
    );
    store.dispatch(appellationSlice.actions.queryWasEmptied());
    expect(store.getState().appellation.values).toBeNull();
    expect(store.getState().appellation.suggestions).toEqual([]);
  });

  it("should update the searched query and reset the state", () => {
    const query = "test";
    store.dispatch(
      appellationSlice.actions.queryHasChanged({
        locator: "searchAppellation",
        lookupAppellation: query,
      }),
    );
    expectDebouncingToBe(true);
    dependencies.scheduler.flush();
    expectDebouncingToBe(false);
    expectLoadingToBe(true);
    expectQueryToBe(query);
  });

  it("shouldn't update the searched query if threshold is not reached", () => {
    const query = "te";
    store.dispatch(
      appellationSlice.actions.queryHasChanged({
        locator: "searchAppellation",
        lookupAppellation: query,
      }),
    );
    expectDebouncingToBe(true);
    dependencies.scheduler.flush();
    expectLoadingToBe(false);
    expectQueryToBe("");
  });

  it("should trigger a new request to the gateway when query > threshold", () => {
    const query = "Test";
    const expectedSuggestions: AppellationMatchDto[] = [
      {
        appellation: {
          appellationCode: "12345",
          appellationLabel: "Test Appellation",
          romeCode: "A1234",
          romeLabel: "Test Rome",
        },
        matchRanges: [
          {
            endIndexExclusive: 10,
            startIndexInclusive: 0,
          },
        ],
      },
    ];
    store.dispatch(
      appellationSlice.actions.queryHasChanged({
        locator: "searchAppellation",
        lookupAppellation: query,
      }),
    );
    expectDebouncingToBe(true);
    dependencies.scheduler.flush();
    expectDebouncingToBe(false);
    expectLoadingToBe(true);
    dependencies.formCompletionGateway.appellationDtoMatching$.next(
      expectedSuggestions,
    );
    expectLoadingToBe(false);
    expectSuggestionsToBe(expectedSuggestions);
  });

  it("should update selected suggestion in store", () => {
    const appellation: AppellationDto = {
      appellationCode: "12345",
      appellationLabel: "Test Appellation",
    };
    const expected: AppellationMatchDto = {
      appellation: {
        ...appellation,
        romeCode: "A1234",
        romeLabel: "Test Rome",
      },
      matchRanges: [
        {
          endIndexExclusive: 10,
          startIndexInclusive: 0,
        },
      ],
    };
    store.dispatch(
      appellationSlice.actions.suggestionHasBeenSelected({
        appellationMatch: expected,
        appellationAutocompleteLocator: "searchAppellation",
      }),
    );
    expectSelectedSuggestionToBe(expected);
  });

  it("should throw an error if something goes wrong and returns error feedback", () => {
    const errorMessage = "Error trying to get appellation";
    store.dispatch(
      appellationSlice.actions.suggestionsHaveBeenRequested({
        locator: "searchAppellation",
        lookupAppellation: "test",
      }),
    );
    dependencies.formCompletionGateway.appellationDtoMatching$.error(
      new Error(errorMessage),
    );
    expectLoadingToBe(false);
  });

  const expectQueryToBe = (expected: string) => {
    expectToEqual(appellationSelectors.query(store.getState()), expected);
  };
  const expectLoadingToBe = (expected: boolean) => {
    expectToEqual(appellationSelectors.isLoading(store.getState()), expected);
  };
  const expectDebouncingToBe = (expected: boolean) => {
    expectToEqual(
      appellationSelectors.isDebouncing(store.getState()),
      expected,
    );
  };
  const expectSuggestionsToBe = (expected: AppellationMatchDto[]) => {
    expectArraysToEqual(
      appellationSelectors.suggestions(store.getState()),
      expected,
    );
  };
  const expectSelectedSuggestionToBe = (expected: AppellationMatchDto) => {
    expectObjectsToMatch(appellationSelectors.values(store.getState()), {
      searchAppellation: expected,
    });
  };
});
