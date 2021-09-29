import { findMatchRanges, normalize } from "../../utils/textSearch";

describe("normalize", () => {
  test("removes accents", () => {
    expect(normalize("à")).toEqual("a");
    expect(normalize("é")).toEqual("e");
    expect(normalize("ï")).toEqual("i");
    expect(normalize("ô")).toEqual("o");
    expect(normalize("ü")).toEqual("u");
  });

  test("converts to lower case", () => {
    expect(normalize("AaBbCc")).toEqual("aabbcc");
  });
});

describe("findMatchRanges", () => {
  test("single term matches", () => {
    expect(findMatchRanges("a", "")).toEqual([]);
    expect(findMatchRanges("a", "a")).toEqual([
      {
        startIndexInclusive: 0,
        endIndexExclusive: 1,
      },
    ]);
    expect(findMatchRanges("a", "aa")).toEqual([
      {
        startIndexInclusive: 0,
        endIndexExclusive: 1,
      },
      {
        startIndexInclusive: 1,
        endIndexExclusive: 2,
      },
    ]);
    expect(findMatchRanges("aa", "aaa")).toEqual([
      {
        startIndexInclusive: 0,
        endIndexExclusive: 2,
      },
      {
        startIndexInclusive: 1,
        endIndexExclusive: 3,
      },
    ]);
  });

  test("multiple term matches", () => {
    expect(findMatchRanges("a b", "a")).toEqual([
      {
        startIndexInclusive: 0,
        endIndexExclusive: 1,
      },
    ]);
    expect(findMatchRanges("a b", "b")).toEqual([
      {
        startIndexInclusive: 0,
        endIndexExclusive: 1,
      },
    ]);
    expect(findMatchRanges("a b", "ab")).toEqual([
      {
        startIndexInclusive: 0,
        endIndexExclusive: 1,
      },
      {
        startIndexInclusive: 1,
        endIndexExclusive: 2,
      },
    ]);
  });

  test("normalized matches", () => {
    expect(findMatchRanges("A", "âáàä")).toEqual([
      {
        startIndexInclusive: 0,
        endIndexExclusive: 1,
      },
      {
        startIndexInclusive: 1,
        endIndexExclusive: 2,
      },
      {
        startIndexInclusive: 2,
        endIndexExclusive: 3,
      },
      {
        startIndexInclusive: 3,
        endIndexExclusive: 4,
      },
    ]);
  });
});
