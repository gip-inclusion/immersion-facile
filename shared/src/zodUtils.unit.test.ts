import { zToBoolean, zToNumber } from "./zodUtils";

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
