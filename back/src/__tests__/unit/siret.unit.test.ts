import { siretSchema } from "../../shared/siret";

describe("siretSchema", () => {
  test("accepts exactly 14 digits", () => {
    expect(() => siretSchema.parse("1234567890123")).toThrowError(
      "SIRET doit étre composé de 14 chiffres",
    );
    expect(() => siretSchema.parse("12345678901234")).not.toThrowError();
    expect(() => siretSchema.parse("123456789012345")).toThrowError(
      "SIRET doit étre composé de 14 chiffres",
    );
  });

  test("allows any number of interspersed whitespaces", () => {
    expect(() => siretSchema.parse(" 12345678901234")).not.toThrowError();
    expect(() => siretSchema.parse("1234567 8901234")).not.toThrowError();
    expect(() => siretSchema.parse("12345678901234 ")).not.toThrowError();
    expect(() =>
      siretSchema.parse("1 2 3 4 5 6 7 8 9 0 1 2 3 4"),
    ).not.toThrowError();
    expect(() =>
      siretSchema.parse("1  23   4  5678 90 1   2 34"),
    ).not.toThrowError();
  });

  test("parsing normalizes the siret number", () => {
    expect(siretSchema.parse("12345678901234")).toEqual("12345678901234");
    expect(siretSchema.parse(" 12345678901234")).toEqual("12345678901234");
    expect(siretSchema.parse("1234567 8901234")).toEqual("12345678901234");
    expect(siretSchema.parse("12345678901234 ")).toEqual("12345678901234");
    expect(siretSchema.parse("1 2 3 4 5 6 7 8 9 0 1 2 3 4")).toEqual(
      "12345678901234",
    );
    expect(siretSchema.parse("1  23   4  5678 90 1   2 34")).toEqual(
      "12345678901234",
    );
  });
});
