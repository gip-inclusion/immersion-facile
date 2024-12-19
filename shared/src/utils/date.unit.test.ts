import { parseISO } from "date-fns";
import {
  hoursDisplayedToHoursValue,
  hoursValueToHoursDisplayed,
  toDateString,
  toDisplayedDate,
} from "./date";

describe("Date utils tests - toDateString", () => {
  it("should format a valid date", () => {
    const date = parseISO("2021-01-01");
    expect(toDateString(date)).toBe("2021-01-01");
  });

  it("can't format an empty string", () => {
    const date = parseISO("");
    expect(() => toDateString(date)).toThrow("Invalid time value");
  });
});

describe("Date utils tests - toDisplayedDate", () => {
  it("should format a valid date", () => {
    const date = parseISO("2024-01-29 11:36:50.274+00");
    expect(toDisplayedDate({ date })).toBe("29/01/2024");
  });

  it("should format a valid date with hours", () => {
    const date = parseISO("2024-01-29 11:36:50.274+00");
    expect(toDisplayedDate({ date, withHours: true })).toBe(
      "29/01/2024 à 12h36",
    );
  });

  it("should format a valid date with hours (with GMT mention)", () => {
    const date = parseISO("2024-01-29 11:36:50.274+00");
    expect(toDisplayedDate({ date, withHours: true, showGMT: true })).toBe(
      "29/01/2024 à 12h36 (heure de Paris GMT+1)",
    );
  });

  it("can't format an empty string", () => {
    const date = new Date("");
    expect(() => toDisplayedDate({ date })).toThrow("Invalid time value");
  });
});

describe("Date utils tests - hoursDisplayedToHoursValue", () => {
  it.each([
    { input: "10h15", expected: 10.25 },
    { input: "10h", expected: 10 },
    { input: "08h05", expected: 8.08 },
    { input: "00h", expected: 0 },
    { input: "67h45", expected: 67.75 },
    { input: "", expected: 0 },
    { input: "h", expected: 0 },
    { input: "10", expected: 10 },
    { input: "0", expected: 0 },
    { input: "10h3", expected: 10.5 },
  ])("convert $input to $expected", ({ input, expected }) => {
    expect(hoursDisplayedToHoursValue(input)).toBe(expected);
  });
});

describe("Date utils tests - hoursValueToHoursDisplayed", () => {
  it.each([
    { expected: "10h15", input: 10.25 },
    { expected: "10h", input: 10 },
    { expected: "08h05", input: 8.08 },
    { expected: "00h", input: 0 },
    { expected: "67h45", input: 67.75 },
  ])("convert $input to $expected", ({ input, expected }) => {
    expect(hoursValueToHoursDisplayed(input)).toBe(expected);
  });
});
