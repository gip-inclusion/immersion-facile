import { parseISO } from "date-fns";
import { toDateString, toDisplayedDate } from "./date";

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
