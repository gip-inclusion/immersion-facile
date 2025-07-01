import {
  cleanStringToHTMLAttribute,
  doesStringContainsHTML,
  getFormattedFirstnameAndLastname,
  looksLikeSiret,
  removeDiacritics,
  slugify,
  toLowerCaseWithoutDiacritics,
} from "./string";

describe("string utils", () => {
  describe("cleanStringToHTMLAttribute", () => {
    it.each([
      [
        "Confirmer un projet professionnel",
        null,
        null,
        "confirmer-un-projet-professionnel",
      ],
      [
        "Intitulé du poste / métier observé *",
        "input",
        3,
        "input-intitule-du-poste-metier-observe-3",
      ],
      [
        "Mille sabords, capitaine !",
        "input",
        "-super",
        "input-mille-sabords-capitaine--super",
      ],
      [
        "Mille sabords,   capitaine 21",
        "input",
        "-super",
        "input-mille-sabords-capitaine-21--super",
      ],
      ["autocomplete-input", null, ":rb1:", "autocomplete-input-rb1"],
    ])(
      "should clean strings to HTML attribute value",
      (input, prefix, suffix, expected) => {
        expect(cleanStringToHTMLAttribute(input, prefix, suffix)).toBe(
          expected,
        );
      },
    );
  });
  describe("slugify", () => {
    it.each([
      [
        "Confirmer un projet professionnel",
        "confirmer-un-projet-professionnel",
      ],
      [
        "Intitulé du poste / métier observé *",
        "intitule-du-poste---metier-observe--",
      ],
      ["Mille sabords, capitaine !", "mille-sabords--capitaine--"],
      ["Mille sabords,   capitaine 21", "mille-sabords----capitaine-21"],
      ["autocomplete-input", "autocomplete-input"],
    ])("should slugify strings", (input, expected) => {
      expect(slugify(input)).toBe(expected);
    });
  });

  describe("toLowerCaseWithoutDiacritics", () => {
    it.each([
      [
        "Confirmer un projet professionnel",
        "confirmer un projet professionnel",
      ],
      [
        "Intitulé du poste / métier observé *",
        "intitule du poste / metier observe *",
      ],
      ["Mille sabords, capitaine !", "mille sabords, capitaine !"],
      ["Mille sabords,   capitaine 21", "mille sabords,   capitaine 21"],
      ["autocomplete-input", "autocomplete-input"],
    ])("should remove diacritics and lowercase strings", (input, expected) => {
      expect(toLowerCaseWithoutDiacritics(input)).toBe(expected);
    });
  });
  describe("removeDiacritics", () => {
    it.each([
      [
        "Confirmer un projet professionnel",
        "Confirmer un projet professionnel",
      ],
      [
        "Intitulé du poste / métier observé *",
        "Intitule du poste / metier observe *",
      ],
      ["Mille sabords, capitaine !", "Mille sabords, capitaine !"],
      ["Mille sabords,   capitaine 21", "Mille sabords,   capitaine 21"],
      ["autocomplete-input", "autocomplete-input"],
    ])("should remove diacritics", (input, expected) => {
      expect(removeDiacritics(input)).toBe(expected);
    });
  });
  describe("looksLikeSiret", () => {
    it.each([
      "123 456 789 00010",
      "1234567890001 0",
      "1234567890 0010",
      "123 456 789 000 10",
    ])(`should return true for "%s"`, (input) => {
      expect(looksLikeSiret(input)).toBe(true);
    });
    it.each(["123 456 789 AAA10 1", "not-a-siret", ""])(
      `should return false for "%s"`,
      (input) => {
        expect(looksLikeSiret(input)).toBe(false);
      },
    );
  });

  describe("doesStringContainsHTML", () => {
    it.each([
      ["<script>alert('XSS')</script>", true],
      ["some content with a <a href='example.com'>link</a>", true],
      ["some content with a <!-- beginning of html comment", true],
      ["some content with a <!-- html comment -->", true],
      ["some content with an --> ending of html comment", false],
      ["some content with an < open tag", false],
      ["> < emoji ?", false],
    ])(`should return true for "%s"`, (input, expected) => {
      expect(doesStringContainsHTML(input)).toBe(expected);
    });
  });

  describe("getFullname", () => {
    it.each([
      {
        inputs: {
          firstname: "John",
          lastname: "Doe",
        },
        expectedOutput: "John DOE",
      },
      {
        inputs: {
          lastname: "Doe",
        },
        expectedOutput: "DOE",
      },
      {
        inputs: {
          firstname: "john",
        },
        expectedOutput: "John",
      },
      {
        inputs: {
          firstname: "jean-claude",
          lastname: "Duss",
        },
        expectedOutput: "Jean-Claude DUSS",
      },
      {
        inputs: {
          firstname: "jean claude",
          lastname: "Duss",
        },
        expectedOutput: "Jean Claude DUSS",
      },
      {
        inputs: {
          firstname: "Chris",
          lastname: "O'donnell",
        },
        expectedOutput: "Chris O'DONNELL",
      },
      {
        inputs: {
          firstname: "PrénOM-cheLOu composé",
          lastname: "Nom-cheLOU composé",
        },
        expectedOutput: "PrénOM-CheLOu-Composé NOM-CHELOU COMPOSÉ",
      },
      {
        inputs: {},
        expectedOutput: "",
      },
    ])("for $inputs return $expectedOutput", ({ inputs, expectedOutput }) => {
      expect(getFormattedFirstnameAndLastname(inputs)).toBe(expectedOutput);
    });
  });
});
