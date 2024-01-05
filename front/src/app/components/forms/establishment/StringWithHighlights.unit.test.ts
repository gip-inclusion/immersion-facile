import { expectToEqual } from "shared";
import { hightlightStringsFromMatches } from "src/app/components/forms/establishment/hightlightStringsFromMatches";

describe("hightlightStringsFromMatches", () => {
  it("match suggestions 'Boul' of 'Boulanger'", () => {
    const result = hightlightStringsFromMatches(
      [{ startIndexInclusive: 0, endIndexExclusive: 4 }],
      "Boulanger",
    );
    expectToEqual(result, [
      { bolded: false, startIndexInclusive: 0, endIndexExclusive: 0 },
      { bolded: true, startIndexInclusive: 0, endIndexExclusive: 4 },
      { bolded: false, startIndexInclusive: 4, endIndexExclusive: 9 },
    ]);
  });

  it("match suggestions 'Boul' of 'Boulanger / Boulangère'", () => {
    const result = hightlightStringsFromMatches(
      [
        { startIndexInclusive: 0, endIndexExclusive: 4 },
        { startIndexInclusive: 12, endIndexExclusive: 16 },
      ],
      "Boulanger / Boulangère",
    );
    expectToEqual(result, [
      { bolded: false, startIndexInclusive: 0, endIndexExclusive: 0 },
      { bolded: true, startIndexInclusive: 0, endIndexExclusive: 4 },
      { bolded: false, startIndexInclusive: 4, endIndexExclusive: 12 },
      { bolded: true, startIndexInclusive: 12, endIndexExclusive: 16 },
      { bolded: false, startIndexInclusive: 16, endIndexExclusive: 22 },
    ]);
  });

  it("match suggestions 'aide bou' of 'Aide-boulanger / Aide-boulangère'", () => {
    const result = hightlightStringsFromMatches(
      [
        { startIndexInclusive: 0, endIndexExclusive: 4 },
        { startIndexInclusive: 5, endIndexExclusive: 8 },
        { startIndexInclusive: 17, endIndexExclusive: 21 },
        { startIndexInclusive: 22, endIndexExclusive: 25 },
      ],
      "Aide-boulanger / Aide-boulangère",
    );
    expectToEqual(result, [
      { bolded: false, startIndexInclusive: 0, endIndexExclusive: 0 },
      { bolded: true, startIndexInclusive: 0, endIndexExclusive: 4 },
      { bolded: false, startIndexInclusive: 4, endIndexExclusive: 5 },
      { bolded: true, startIndexInclusive: 5, endIndexExclusive: 8 },
      { bolded: false, startIndexInclusive: 8, endIndexExclusive: 17 },
      { bolded: true, startIndexInclusive: 17, endIndexExclusive: 21 },
      { bolded: false, startIndexInclusive: 21, endIndexExclusive: 22 },
      { bolded: true, startIndexInclusive: 22, endIndexExclusive: 25 },
      { bolded: false, startIndexInclusive: 25, endIndexExclusive: 32 },
    ]);
  });
});
