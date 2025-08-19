import { addressWithPostalCodeSchema } from "./postalCode";

describe("postalCode", () => {
  describe("addressWithPostalCodeSchema", () => {
    it("accepts valid postal codes", () => {
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
      expect(() =>
        addressWithPostalCodeSchema.parse(
          "14 Boulevard de Berlaimont 1000 Bruxelles, Belgique",
        ),
      ).not.toThrow();
    });

    it("rejects missing or invalid postal codes", () => {
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
});
