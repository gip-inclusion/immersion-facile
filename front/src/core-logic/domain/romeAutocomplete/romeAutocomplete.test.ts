/* eslint-disable jest/require-top-level-describe */
/* eslint-disable jest/consistent-test-it */

import {
  feedRomeAutocompleteGatewayWith,
  thenIsSearchingIs,
  thenRomeOptionsAre,
  thenSearchTextIs,
  thenSelectedRomeDtoIs,
  thenSelectedRomeIs,
  whenRomeOptionIsSelected,
  whenSearchTextIsProvided,
} from "src/core-logic/domain/romeAutocomplete/romeAutocomplete.testHelpers";
import {
  fastForwardObservables,
  triggerTests,
} from "src/core-logic/domain/testHelpers/test.helpers";
import { createTestStore } from "src/core-logic/storeConfig/createTestStore";

describe("Rome Autocomplete", () => {
  describe("select one of the romeOptions", () => {
    const appAndDeps = createTestStore(
      {
        romeAutocomplete: {
          selectedRome: null,
          romeOptions: [
            { romeCode: "A1000", romeLabel: "Job A" },
            { romeCode: "B1000", romeLabel: "Job B" },
          ],
          romeSearchText: "job",
          isSearching: false,
        },
      },
      "Given there are 2 rome options Job A and Job B",
    );

    triggerTests(appAndDeps, [
      whenRomeOptionIsSelected({ romeCode: "B1000", romeLabel: "Job B" }),
      thenSelectedRomeDtoIs({ romeCode: "B1000", romeLabel: "Job B" }),
      thenSearchTextIs("Job B"),
    ]);
  });

  describe("triggers rome search when search text changes", () => {
    triggerTests(createTestStore(), [
      whenSearchTextIsProvided("bou"),
      fastForwardObservables("waits 400ms"),
      thenIsSearchingIs(true),
      feedRomeAutocompleteGatewayWith([
        { romeCode: "A10000", romeLabel: "Mon métier" },
      ]),
      thenRomeOptionsAre([{ romeCode: "A10000", romeLabel: "Mon métier" }]),
      thenIsSearchingIs(false),
    ]);
  });

  describe("A rome was already selected", () => {
    const appAndDeps = createTestStore(
      {
        romeAutocomplete: {
          selectedRome: "A1000",
          romeOptions: [
            { romeCode: "A1000", romeLabel: "Job A" },
            { romeCode: "B1000", romeLabel: "Job B" },
          ],
          romeSearchText: "A1000",
          isSearching: false,
        },
      },
      "Given code rome A1000 is selected",
    );

    triggerTests(appAndDeps, [
      whenSearchTextIsProvided("b"),
      thenSelectedRomeIs(null),
    ]);
  });

  describe("does not trigger search if text is less than 3 characters", () => {
    triggerTests(createTestStore(), [
      whenSearchTextIsProvided("bo"),
      fastForwardObservables("waits 400ms"),
      thenIsSearchingIs(false),
    ]);
  });
});
