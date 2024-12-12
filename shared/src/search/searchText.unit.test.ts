import { searchTextSchema } from "./searchText.schema";

describe("searchTextSchema", () => {
  it("accepts if not empty", () => {
    expect(() => searchTextSchema.parse("")).toThrow();
    expect(() => searchTextSchema.parse("taxi")).not.toThrow();
  });

  it.each([
    { initialSearchText: "<lapins", expectedSearchText: "lapins" },
    {
      initialSearchText: "montage-assemblage",
      expectedSearchText: "montage-assemblage",
    },
    {
      initialSearchText: "secrétaire",
      expectedSearchText: "secrétaire",
    },
    {
      initialSearchText: "secrétaire#",
      expectedSearchText: "secrétaire",
    },
    {
      initialSearchText: "boulanger / patissier",
      expectedSearchText: "boulanger   patissier",
    },
  ])(
    "for $initialSearchText, replace special characters by space then trim",
    ({ initialSearchText, expectedSearchText }) => {
      const newSearchText = searchTextSchema.parse(initialSearchText);
      expect(newSearchText).toBe(expectedSearchText);
    },
  );
});
