import {
  expectArraysToEqual,
  expectToEqual,
  type NafSectionSuggestion,
} from "shared";
import { nafSelectors } from "src/core-logic/domain/naf/naf.selectors";
import {
  initialState,
  type NafState,
  nafSlice,
} from "src/core-logic/domain/naf/naf.slice";
import {
  createTestStore,
  type TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import type { ReduxStore } from "src/core-logic/storeConfig/store";

describe("naf slice", () => {
  const expectedResults: NafSectionSuggestion[] = [
    {
      label: "Agriculture",
      nafCodes: ["1000A"],
    },
    {
      label: "Bâtiment",
      nafCodes: ["1000B"],
    },
  ];
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore());
  });

  it("should fetch all naf sections and update the state", () => {
    expectToMatchSelectors(initialState);
    store.dispatch(nafSlice.actions.getAllSectionsRequested());
    expectToMatchSelectors({
      allSections: [],
      isLoading: true,
    });
    dependencies.scheduler.flush();
    expectToMatchSelectors({
      allSections: [],
      isLoading: true,
    });
    // feed gateway
    dependencies.nafGateway.nafSuggestions$.next(expectedResults);
    expectToMatchSelectors({
      allSections: expectedResults,
      isLoading: false,
    });
  });

  it("should return to initial state when the request fails", () => {
    expectToMatchSelectors(initialState);
    store.dispatch(nafSlice.actions.getAllSectionsRequested());
    dependencies.scheduler.flush();
    expectToMatchSelectors({
      allSections: [],
      isLoading: true,
    });
    dependencies.nafGateway.nafSuggestions$.error(new Error("test"));
    expectToMatchSelectors(initialState);
  });

  const expectToMatchSelectors = ({
    allSections: expectedResults,
    isLoading: expectedLoading,
  }: NafState) => {
    const state = store.getState();
    expectToEqual(nafSelectors.isLoading(state), expectedLoading);
    expectArraysToEqual(nafSelectors.allSections(state), expectedResults);
  };
});
