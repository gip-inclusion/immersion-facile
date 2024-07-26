import { ZodError } from "zod";
import { zToBoolean, zToNumber, zTrimmedString } from "./zodUtils";

describe("zToBolean schema validation", () => {
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

  it.each(["0,1", "not a number"])("boolean '%s' to be invalid", (boolean) => {
    expect(() => zToNumber.parse(boolean)).toThrow();
  });
});

describe("zStringMinLengh1 schema validation", () => {
  it.each([
    { input: "beaujolais", expected: "beaujolais" },
    {
      input: "test-123",
      expected: "test-123",
    },
    {
      input: " test-123 ",
      expected: "test-123",
    },
    {
      input: "   ",
      expected: new ZodError([
        {
          code: "too_small",
          minimum: 1,
          type: "string",
          inclusive: true,
          exact: false,
          message: "Obligatoire",
          path: [],
        },
        {
          code: "custom",
          message: "Obligatoire",
          path: [],
        },
      ]),
    },
  ] satisfies {
    input: string;
    expected: ZodError | string;
  }[])("parsing '$input' expect $expected", ({ input, expected }) => {
    typeof expected !== "string"
      ? expect(() => zTrimmedString.parse(input)).toThrow(expected)
      : expect(zTrimmedString.parse(input)).toBe(expected);
  });
});
