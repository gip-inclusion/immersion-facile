import { siretSchema } from "shared/src/siret";
import { zTrimmedString } from "shared/src/zodUtils";

describe("siretSchema", () => {
  it("accepts exactly 14 digits", () => {
    expect(() => siretSchema.parse("1234567890123")).toThrow(
      "SIRET doit étre composé de 14 chiffres",
    );
    expect(() => siretSchema.parse("12345678901234")).not.toThrow();
    expect(() => siretSchema.parse("123456789012345")).toThrow(
      "SIRET doit étre composé de 14 chiffres",
    );
  });

  it("allows any number of interspersed whitespaces", () => {
    expect(() => siretSchema.parse(" 12345678901234")).not.toThrow();
    expect(() => siretSchema.parse("1234567 8901234")).not.toThrow();
    expect(() => siretSchema.parse("12345678901234 ")).not.toThrow();
    expect(() =>
      siretSchema.parse("1 2 3 4 5 6 7 8 9 0 1 2 3 4"),
    ).not.toThrow();
    expect(() =>
      siretSchema.parse("1  23   4  5678 90 1   2 34"),
    ).not.toThrow();
  });

  it("parsing normalizes the siret number", () => {
    expect(siretSchema.parse("12345678901234")).toBe("12345678901234");
    expect(siretSchema.parse(" 12345678901234")).toBe("12345678901234");
    expect(siretSchema.parse("1234567 8901234")).toBe("12345678901234");
    expect(siretSchema.parse("12345678901234 ")).toBe("12345678901234");
    expect(siretSchema.parse("1 2 3 4 5 6 7 8 9 0 1 2 3 4")).toBe(
      "12345678901234",
    );
    expect(siretSchema.parse("1  23   4  5678 90 1   2 34")).toBe(
      "12345678901234",
    );
  });

  it("trims the given input", () => {
    expect(zTrimmedString.parse("yolo ")).toBe("yolo");
  });
});
