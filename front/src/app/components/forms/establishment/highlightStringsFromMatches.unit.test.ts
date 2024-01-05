import { expectToEqual } from "shared";
import { highlightStringsFromMatches } from "src/app/components/forms/establishment/highlightStringsFromMatches";

describe("hightlightStringsFromMatches", () => {
  it("match suggestions '' of 'Boulanger'", () => {
    // search text is "Boul"
    const result = highlightStringsFromMatches([], "Boulanger");
    expectToEqual(result, [
      { bolded: false, startIndexInclusive: 0, endIndexExclusive: 9 },
    ]);
  });

  it("match suggestions 'Boul' of 'Boulanger'", () => {
    // search text is "Boul"
    const result = highlightStringsFromMatches(
      [{ startIndexInclusive: 0, endIndexExclusive: 4 }],
      "Boulanger",
    );
    expectToEqual(result, [
      { bolded: true, startIndexInclusive: 0, endIndexExclusive: 4 },
      { bolded: false, startIndexInclusive: 4, endIndexExclusive: 9 },
    ]);
  });

  it("match suggestions 'Boul' of 'Boulanger / Boulangère'", () => {
    // search text is "Boul"
    const result = highlightStringsFromMatches(
      [
        { startIndexInclusive: 0, endIndexExclusive: 4 },
        { startIndexInclusive: 12, endIndexExclusive: 16 },
      ],
      "Boulanger / Boulangère",
    );
    expectToEqual(result, [
      { bolded: true, startIndexInclusive: 0, endIndexExclusive: 4 },
      { bolded: false, startIndexInclusive: 4, endIndexExclusive: 12 },
      { bolded: true, startIndexInclusive: 12, endIndexExclusive: 16 },
      { bolded: false, startIndexInclusive: 16, endIndexExclusive: 22 },
    ]);
  });

  it("match suggestions 'aide bou' of 'Aide-boulanger / Aide-boulangère'", () => {
    // search text is "aide bou"
    const result = highlightStringsFromMatches(
      [
        { startIndexInclusive: 0, endIndexExclusive: 4 },
        { startIndexInclusive: 5, endIndexExclusive: 8 },
        { startIndexInclusive: 17, endIndexExclusive: 21 },
        { startIndexInclusive: 22, endIndexExclusive: 25 },
      ],
      "Aide-boulanger / Aide-boulangère",
    );
    expectToEqual(result, [
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

  it("does not duplicate text when some matches are overlapping", () => {
    // search text is "boulanger oulan"
    const result = highlightStringsFromMatches(
      [
        { startIndexInclusive: 5, endIndexExclusive: 14 },
        { startIndexInclusive: 6, endIndexExclusive: 11 },
        { startIndexInclusive: 22, endIndexExclusive: 31 },
        { startIndexInclusive: 23, endIndexExclusive: 28 },
      ],
      "Aide-boulanger / Aide-boulangère",
    );

    expectToEqual(result, [
      { bolded: false, startIndexInclusive: 0, endIndexExclusive: 5 },
      { bolded: true, startIndexInclusive: 5, endIndexExclusive: 14 },
      { bolded: false, startIndexInclusive: 14, endIndexExclusive: 22 },
      { bolded: true, startIndexInclusive: 22, endIndexExclusive: 31 },
      { bolded: false, startIndexInclusive: 31, endIndexExclusive: 32 },
    ]);
  });

  it("match suggestions 'boulan oulangère' of 'Aide-Boulanger / Aide-Boulangère'", () => {
    // search text is "boulan oulangère"
    const result = highlightStringsFromMatches(
      [
        { startIndexInclusive: 5, endIndexExclusive: 11 },
        { startIndexInclusive: 22, endIndexExclusive: 28 },
        { startIndexInclusive: 23, endIndexExclusive: 32 },
      ],
      "Aide-Boulanger / Aide-Boulangère",
    );

    expectToEqual(result, [
      { bolded: false, startIndexInclusive: 0, endIndexExclusive: 5 },
      { bolded: true, startIndexInclusive: 5, endIndexExclusive: 11 },
      { bolded: false, startIndexInclusive: 11, endIndexExclusive: 22 },
      { bolded: true, startIndexInclusive: 22, endIndexExclusive: 32 },
    ]);
  });

  it("match suggestions 'boulan oulangère' of 'Boulanger-pâtissier / Boulangère-pâtissière'", () => {
    // search text is "boulan oulangère"
    const result = highlightStringsFromMatches(
      [
        { startIndexInclusive: 0, endIndexExclusive: 6 },
        { startIndexInclusive: 22, endIndexExclusive: 28 },
        { startIndexInclusive: 23, endIndexExclusive: 32 },
      ],
      "Boulanger-pâtissier / Boulangère-pâtissière",
    );

    expectToEqual(result, [
      { bolded: true, startIndexInclusive: 0, endIndexExclusive: 6 },
      { bolded: false, startIndexInclusive: 6, endIndexExclusive: 22 },
      { bolded: true, startIndexInclusive: 22, endIndexExclusive: 32 },
      { bolded: false, startIndexInclusive: 32, endIndexExclusive: 43 },
    ]);
  });
});
