import { Store } from "@reduxjs/toolkit";
import { RomeCode } from "shared";
import { romeAutocompleteSelector } from "src/core-logic/domain/romeAutocomplete/romeAutocomplete.selectors";
import { romeAutocompleteSlice } from "src/core-logic/domain/romeAutocomplete/romeAutocomplete.slice";
import { createScenarioUnitTest } from "src/core-logic/domain/testHelpers/test.helpers";
import {
  StoreAndDeps,
  TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import { RomeDto } from "shared";
import { expectToEqual } from "shared";

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

export const thenSearchTextIs = createScenarioUnitTest<string>(
  (searchedText) =>
    ({ store }: StoreAndDeps) => {
      const expectSearchTextToBe = makeExpectSearchTextToBe(store);

      it(`then searched text is ${searchedText}`, () => {
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

export const thenSelectedRomeIs = createScenarioUnitTest<RomeCode | null>(
  (expected) =>
    ({ store }) => {
      it(`then selectedRome is ${expected}`, () => {
        expectToEqual(store.getState().romeAutocomplete.selectedRome, expected);
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
export const whenRomeOptionIsSelected = createScenarioUnitTest<RomeDto>(
  (romeDto) =>
    ({ store }: StoreAndDeps) => {
      it(`when ${romeDto.romeCode} rome code is selected`, () => {
        store.dispatch(romeAutocompleteSlice.actions.setSelectedRome(romeDto));
        expect(store.getState()?.romeAutocomplete.selectedRome).toBe(
          romeDto.romeCode,
        );
        expect(store.getState()?.romeAutocomplete.romeSearchText).toBe(
          romeDto.romeLabel,
        );
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
