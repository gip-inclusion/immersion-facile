import { findMatchRanges, normalize } from "../../utils/textSearch";

describe("normalize", () => {
  it("removes accents", () => {
    expect(normalize("à")).toBe("a");
    expect(normalize("é")).toBe("e");
    expect(normalize("ï")).toBe("i");
    expect(normalize("ô")).toBe("o");
    expect(normalize("ü")).toBe("u");
  });

  it("converts to lower case", () => {
    expect(normalize("AaBbCc")).toBe("aabbcc");
  });
});

describe("findMatchRanges", () => {
  it("single term matches", () => {
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

  it("multiple term matches", () => {
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

  it("normalized matches", () => {
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
