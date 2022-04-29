import { Store } from "@reduxjs/toolkit";
import { romeAutocompleteSelector } from "src/core-logic/domain/romeAutocomplete/romeAutocomplete.selectors";
import { romeAutocompleteSlice } from "src/core-logic/domain/romeAutocomplete/romeAutocomplete.slice";
import { createScenarioUnitTest } from "src/core-logic/domain/test.helpers";
import {
  StoreAndDeps,
  TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import { expectToEqual } from "src/core-logic/storeConfig/redux.helpers";
import { RomeDto } from "shared/src/romeAndAppellationDtos/romeAndAppellation.dto";

const makeFeedRomeAutocompleteGatewayWithRomeDtos =
  (dependencies: TestDependencies) => (romeDtos: RomeDto[]) => {
    dependencies.romeAutocompleteGateway.romeDtos$.next(romeDtos);
  };

const makeExpectSelectedRomeToEqual =
  (store: Store) => (expected: RomeDto | null) => {
    expectToEqual(
      romeAutocompleteSelector(store.getState()).selectedRomeDto,
      expected,
    );
  };

const makeExpectRomeOptionsToEqual =
  (store: Store) => (expected: RomeDto[]) => {
    expectToEqual(
      romeAutocompleteSelector(store.getState()).romeOptions,
      expected,
    );
  };

const makeExpectIsSearchingToBe = (store: Store) => (expected: boolean) => {
  expectToEqual(
    romeAutocompleteSelector(store.getState()).isSearching,
    expected,
  );
};

const makeExpectSearchTextToBe = (store: Store) => (expected: string) => {
  expectToEqual(
    romeAutocompleteSelector(store.getState()).romeSearchText,
    expected,
  );
};

export const whenSearchTextIsProvided = createScenarioUnitTest<string>(
  (searchedText) =>
    ({ store }: StoreAndDeps) => {
      const expectIsSearchingToBe = makeExpectIsSearchingToBe(store);
      const expectSearchTextToBe = makeExpectSearchTextToBe(store);

      it("when a searched text is provided", () => {
        store.dispatch(
          romeAutocompleteSlice.actions.setRomeSearchText(searchedText),
        );

        expectIsSearchingToBe(false);
        expectSearchTextToBe(searchedText);
      });
    },
);

export const thenIsSearchingIs = createScenarioUnitTest<boolean>(
  (expected) =>
    ({ store }) => {
      const expectIsSearchingToBe = makeExpectIsSearchingToBe(store);

      it(`then isSearching is ${expected}`, () => {
        expectIsSearchingToBe(expected);
      });
    },
);

export const thenRomeOptionsAre = createScenarioUnitTest<RomeDto[]>(
  (expected) =>
    ({ store }) => {
      const expectRomeOptionsToEqual = makeExpectRomeOptionsToEqual(store);

      it(`then romeOptions are ${JSON.stringify(expected)}`, () => {
        expectRomeOptionsToEqual(expected);
      });
    },
);

export const feedRomeAutocompleteGatewayWith = createScenarioUnitTest<
  RomeDto[]
>((expected) => ({ dependencies }) => {
  const feedRomeAutocompleteGatewayWithRomeDtos =
    makeFeedRomeAutocompleteGatewayWithRomeDtos(dependencies);
  // eslint-disable-next-line jest/expect-expect
  it("feedRomeAutocompleteGatewayWith", () => {
    feedRomeAutocompleteGatewayWithRomeDtos(expected);
  });
});

// export const whenRomeOptionIsSelected: ScenarioUnitTestWithParams<string> =
export const whenRomeOptionIsSelected = createScenarioUnitTest<string>(
  (codeRome) =>
    ({ store }: StoreAndDeps) => {
      it(`when ${codeRome} rome code is selected`, () => {
        store.dispatch(romeAutocompleteSlice.actions.setSelectedRome(codeRome));
        expect(store.getState()?.romeAutocomplete.selectedRome).toBe(codeRome);
      });
    },
);

export const thenSelectedRomeDtoIs = createScenarioUnitTest<RomeDto>(
  (romeDto) =>
    ({ store }: StoreAndDeps) => {
      const expectSelectedRomeToEqual = makeExpectSelectedRomeToEqual(store);

      it(`then selected rome option is ${JSON.stringify(romeDto)}`, () => {
        expectSelectedRomeToEqual(romeDto);
      });
    },
);
