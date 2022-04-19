import { Store } from "@reduxjs/toolkit";
import { romeAutocompleteSelector } from "src/core-logic/domain/romeAutocomplete/romeAutocomplete.selectors";
import { romeAutocompleteSlice } from "src/core-logic/domain/romeAutocomplete/romeAutocomplete.slice";
import {
  createTestStore,
  TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import { expectToEqual } from "src/core-logic/storeConfig/redux.helpers";
import { RootState } from "src/core-logic/storeConfig/store";
import { RomeDto } from "src/shared/romeAndAppellationDtos/romeAndAppellation.dto";

describe("rome Autocomplete", () => {
  let store: Store<RootState>;
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore());
  });

  it("updates searchedText immediately", () => {
    const searchedText = "bou";
    store.dispatch(
      romeAutocompleteSlice.actions.setRomeSearchText(searchedText),
    );
    expectSearchTextToBe(searchedText);
  });

  it("set the selected rome", () => {
    ({ store, dependencies } = createTestStore({
      romeAutocomplete: {
        selectedRome: null,
        romeOptions: [
          { romeCode: "A1000", romeLabel: "Métier A" },
          { romeCode: "B1000", romeLabel: "Métier B" },
        ],
        romeSearchText: "méti",
        isSearching: false,
      },
    }));

    store.dispatch(romeAutocompleteSlice.actions.setSelectedRome("B1000"));

    expectSelectedRomeToEqual({ romeCode: "B1000", romeLabel: "Métier B" });
  });

  // eslint-disable-next-line jest/no-disabled-tests
  it.skip("triggers rome search when search text changes", () => {
    const searchedText = "bou";
    store.dispatch(
      romeAutocompleteSlice.actions.setRomeSearchText(searchedText),
    );
    expectIsSearchingToBe(false);

    // need to go forward by 400 ms, not sure how to test this...

    expectIsSearchingToBe(true);

    dependencies.romeAutocompleteGateway.romeDtos$.next([
      { romeCode: "A10000", romeLabel: "Mon métier" },
    ]);

    expectRomeOptionsToEqual([{ romeCode: "A10000", romeLabel: "Mon métier" }]);
    expectIsSearchingToBe(false);
  });

  const expectIsSearchingToBe = (expected: boolean) => {
    expectToEqual(
      romeAutocompleteSelector(store.getState()).isSearching,
      expected,
    );
  };

  const expectSearchTextToBe = (expected: string) => {
    expectToEqual(
      romeAutocompleteSelector(store.getState()).romeSearchText,
      expected,
    );
  };

  const expectRomeOptionsToEqual = (expected: RomeDto[]) => {
    expectToEqual(
      romeAutocompleteSelector(store.getState()).romeOptions,
      expected,
    );
  };

  const expectSelectedRomeToEqual = (expected: RomeDto | null) => {
    expectToEqual(
      romeAutocompleteSelector(store.getState()).selectedRomeDto,
      expected,
    );
  };
});
