import { addressWithPostalCodeSchema, uniqBy } from "../../shared/utils";

describe("utils", () => {
  describe("addressWithPostalCodeSchema", () => {
    test("accepts valid postal codes", () => {
      expect(() =>
        addressWithPostalCodeSchema.parse("20 AVENUE DE SEGUR 75007 PARIS 7"),
      ).not.toThrow();
      expect(() =>
        addressWithPostalCodeSchema.parse("75007 PARIS 7"),
      ).not.toThrow();
      expect(() =>
        addressWithPostalCodeSchema.parse("20 AVENUE DE SEGUR 75007"),
      ).not.toThrow();
      expect(() =>
        addressWithPostalCodeSchema.parse("20 AVENUE DE SEGUR,75007,PARIS 7"),
      ).not.toThrow();
    });

    test("rejects missing or invalid postal codes", () => {
      expect(() =>
        addressWithPostalCodeSchema.parse("20 AVENUE DE SEGUR PARIS 7"),
      ).toThrow();
      expect(() =>
        addressWithPostalCodeSchema.parse("20 AVENUE DE SEGUR 123456 PARIS 7"),
      ).toThrow();
      expect(() =>
        addressWithPostalCodeSchema.parse("123456 PARIS 7"),
      ).toThrow();
      expect(() =>
        addressWithPostalCodeSchema.parse("20 AVENUE DE SEGUR 123456"),
      ).toThrow();
      expect(() =>
        addressWithPostalCodeSchema.parse("20 AVENUE DE SEGUR,123456,PARIS 7"),
      ).toThrow();
    });
  });

  describe("uniqBy", () => {
    it("deduplicates in respect to provided function", () => {
      const array1 = ["bobby", "Bob", "tom", "bob"];
      const first3LettersCaseInsensitive = (str: string) =>
        str.slice(0, 3).toLowerCase();
      const newArray = uniqBy(array1, first3LettersCaseInsensitive);

      expect(newArray).toEqual(["bobby", "tom"]);
    });
  });
});
