import {
  type AppellationDto,
  type AppellationMatchDto,
  expectArraysToEqual,
  expectObjectsToMatch,
  expectToEqual,
} from "shared";
import { makeAppellationLocatorSelector } from "src/core-logic/domain/appellation/appellation.selectors";
import {
  type TestDependencies,
  createTestStore,
} from "src/core-logic/storeConfig/createTestStore";
import type { ReduxStore } from "src/core-logic/storeConfig/store";
import {
  type AppellationAutocompleteLocator,
  appellationSlice,
} from "./appellation.slice";

describe("Appellation epic", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;
  const locator: AppellationAutocompleteLocator = "search-form-appellation";
  beforeEach(() => {
    ({ store, dependencies } = createTestStore());
  });

  it("should reset the value and suggestions when the field is cleared", () => {
    store.dispatch(
      appellationSlice.actions.selectSuggestionRequested({
        locator,
        item: {
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
      }),
    );
    store.dispatch(
      appellationSlice.actions.clearLocatorDataRequested({ locator }),
    );
    expect(store.getState().appellation.data[locator]?.value).toBeNull();
    expect(store.getState().appellation.data[locator]?.suggestions).toEqual([]);
  });

  it("should update the searched query and reset the state", () => {
    const query = "test";
    store.dispatch(
      appellationSlice.actions.changeQueryRequested({
        locator,
        lookup: query,
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
      appellationSlice.actions.changeQueryRequested({
        locator,
        lookup: query,
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
      appellationSlice.actions.changeQueryRequested({
        locator,
        lookup: query,
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
      appellationSlice.actions.selectSuggestionRequested({
        locator,
        item: expected,
      }),
    );
    expectSelectedSuggestionToBe(expected);
  });

  it("should throw an error if something goes wrong and returns error feedback", () => {
    const errorMessage = "Error trying to get appellation";
    store.dispatch(
      appellationSlice.actions.fetchSuggestionsRequested({
        locator,
        lookup: "test",
      }),
    );
    dependencies.formCompletionGateway.appellationDtoMatching$.error(
      new Error(errorMessage),
    );
    expectLoadingToBe(false);
  });

  const expectQueryToBe = (expected: string) => {
    expectToEqual(
      makeAppellationLocatorSelector(locator)(store.getState())?.query,
      expected,
    );
  };
  const expectLoadingToBe = (expected: boolean) => {
    expectToEqual(
      makeAppellationLocatorSelector(locator)(store.getState())?.isLoading,
      expected,
    );
  };
  const expectDebouncingToBe = (expected: boolean) => {
    expectToEqual(
      makeAppellationLocatorSelector(locator)(store.getState())?.isDebouncing,
      expected,
    );
  };
  const expectSuggestionsToBe = (expected: AppellationMatchDto[]) => {
    expectArraysToEqual(
      makeAppellationLocatorSelector(locator)(store.getState())?.suggestions ??
        [],
      expected,
    );
  };
  const expectSelectedSuggestionToBe = (expected: AppellationMatchDto) => {
    expectObjectsToMatch(
      makeAppellationLocatorSelector(locator)(store.getState())?.value,
      expected,
    );
  };
});
