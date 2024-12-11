import { parseISO } from "date-fns";
import {
  convertLocaleDateToUtcTimezoneDate,
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

describe("Date utils tests - convertLocaleDateToUtcTimezoneDate", () => {
  it("should convert a date with timezone + to an absolute date (UTC)", () => {
    const date = parseISO("2024-10-19T05:00:00.000+02:00");
    expect(convertLocaleDateToUtcTimezoneDate(date)).toEqual(
      parseISO("2024-10-19T00:00:00.000Z"),
    );
  });
  it("should convert a date with timezone - to an absolute date (UTC)", () => {
    const date = parseISO("2024-01-01T00:00:00.000-05:00");
    expect(convertLocaleDateToUtcTimezoneDate(date)).toEqual(
      parseISO("2024-01-01T00:00:00.000Z"),
    );
  });
  it("should do nothing to an absolute date (UTC)", () => {
    const date = parseISO("2024-01-01T00:00:00.000Z");
    expect(convertLocaleDateToUtcTimezoneDate(date)).toEqual(
      parseISO("2024-01-01T00:00:00.000Z"),
    );
  });
  it("should handle hour switch", () => {
    const date = parseISO("2025-03-30T00:00:00.000+02:00");
    expect(convertLocaleDateToUtcTimezoneDate(date).toISOString()).toBe(
      "2025-03-30T00:00:00.000Z",
    );
  });
});
