import {
  NafSectionSuggestion,
  expectArraysToEqual,
  expectToEqual,
} from "shared";
import { nafSelectors } from "src/core-logic/domain/naf/naf.selectors";
import {
  NafState,
  initialState,
  nafSlice,
} from "src/core-logic/domain/naf/naf.slice";
import {
  TestDependencies,
  createTestStore,
} from "src/core-logic/storeConfig/createTestStore";
import { ReduxStore } from "src/core-logic/storeConfig/store";

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

  it("should fetch naf sections and update the state", () => {
    expectToMatchSelectors(initialState);
    store.dispatch(nafSlice.actions.queryHasChanged("query"));
    expectToMatchSelectors({
      currentNafSections: [],
      isLoading: false,
      isDebouncing: true,
    });
    dependencies.scheduler.flush();
    expectToMatchSelectors({
      currentNafSections: [],
      isLoading: true,
      isDebouncing: false,
    });
    // feed gateway
    dependencies.nafGateway.nafSuggestions$.next(expectedResults);
    expectToMatchSelectors({
      currentNafSections: expectedResults,
      isLoading: false,
      isDebouncing: false,
    });
  });

  it("should return to initial state when the request fails", () => {
    expectToMatchSelectors(initialState);
    store.dispatch(nafSlice.actions.queryHasChanged("query"));
    dependencies.scheduler.flush();
    expectToMatchSelectors({
      currentNafSections: [],
      isLoading: true,
      isDebouncing: false,
    });
    dependencies.nafGateway.nafSuggestions$.error(new Error("test"));
    expectToMatchSelectors(initialState);
  });

  it("shouldn't trigger a new request to the gateway when query < threshold", () => {
    expectToMatchSelectors(initialState);
    store.dispatch(nafSlice.actions.queryHasChanged("query"));
    dependencies.scheduler.flush();
    dependencies.nafGateway.nafSuggestions$.next(expectedResults);
    expectToMatchSelectors({
      currentNafSections: expectedResults,
      isLoading: false,
      isDebouncing: false,
    });
    store.dispatch(nafSlice.actions.queryHasChanged("qu"));
    dependencies.scheduler.flush();
    expectToMatchSelectors({
      ...initialState,
      isDebouncing: true,
    });
  });

  it("should clear the current state when the query is emptied", () => {
    expectToMatchSelectors(initialState);
    store.dispatch(nafSlice.actions.queryHasChanged("query"));
    dependencies.scheduler.flush();
    dependencies.nafGateway.nafSuggestions$.next(expectedResults);
    expectToMatchSelectors({
      currentNafSections: expectedResults,
      isLoading: false,
      isDebouncing: false,
    });
    store.dispatch(nafSlice.actions.queryWasEmptied());
    dependencies.scheduler.flush();
    expectToMatchSelectors(initialState);
  });

  const expectToMatchSelectors = ({
    currentNafSections: expectedResults,
    isLoading: expectedLoading,
    isDebouncing: expectedDebouncing,
  }: NafState) => {
    const state = store.getState();
    expectToEqual(nafSelectors.isLoading(state), expectedLoading);
    expectToEqual(nafSelectors.isDebouncing(state), expectedDebouncing);
    expectArraysToEqual(
      nafSelectors.currentNafSections(state),
      expectedResults,
    );
  };
});
