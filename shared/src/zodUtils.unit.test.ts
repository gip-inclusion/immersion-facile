import { makePersonNameSchema } from "./utils/string.schema";
import { zToBoolean, zToNumber } from "./zodUtils";

describe("zodUtils", () => {
  describe("zToBoolean schema validation", () => {
    it.each([
      ["true", true],
      ["TRUE", true],
      [true, true],
      ["1", true],
      [1, true],
      ["false", false],
      ["FALSE", false],
      ["0", false],
      [undefined, false],
      [null, false],
      [false, false],
      [0, false],
    ])("boolean '%s' to be parsed to %s", (boolean, expectedBoolean) => {
      expect(zToBoolean.parse(boolean)).toBe(expectedBoolean);
    });
  });

  describe("zToNumber schema validation", () => {
    it.each([
      [1, 1],
      [1.2, 1.2],
      ["0", 0],
      ["0.1", 0.1],
    ])("boolean '%s' to be parsed to '%s'", (boolean, expectedNumber) => {
      expect(zToNumber.parse(boolean)).toBe(expectedNumber);
    });

    it.each([
      "0,1",
      "not a number",
    ])("boolean '%s' to be invalid", (boolean) => {
      expect(() => zToNumber.parse(boolean)).toThrow();
    });
  });

  describe("makePersonNameSchema basic validation", () => {
    it.each([
      { name: "julien", expectedName: "julien" },
      { name: "Julien", expectedName: "Julien" },
      { name: "jean-paul", expectedName: "jean-paul" },
      { name: "jean  paul", expectedName: "jean paul" },
      { name: "O'Brien", expectedName: "O'Brien" },
      { name: "Marie-Claire", expectedName: "Marie-Claire" },
      { name: "  trimmed  ", expectedName: "trimmed" },
      { name: "multiple   spaces", expectedName: "multiple spaces" },
      { name: "Éléonore", expectedName: "Éléonore" },
    ])("accepts valid name '%s' and transforms to '%s'", ({
      name,
      expectedName,
    }) => {
      expect(makePersonNameSchema("lastname").parse(name)).toBe(expectedName);
    });

    it.each([
      "123",
      "John@Doe",
      "John.Doe",
    ])("rejects invalid name '%s'", (name) => {
      expect(() => makePersonNameSchema("lastname").parse(name)).toThrow(
        "Le nom ne peut contenir que des lettres, espaces, tirets et apostrophes",
      );
    });
  });
});
