import { addSeconds, addYears, parseISO, subYears } from "date-fns";
import { ZodError } from "zod";
import { expectToEqual } from "../test.helpers";
import { localization } from "../zodUtils";
import {
  hoursValueToHoursDisplayed,
  makeDateStringSchema,
  toDateUTCString,
  toDisplayedDate,
} from "./date";

describe("Date utils tests - toDateUTCString", () => {
  it("should format a valid date", () => {
    const date = parseISO("2021-01-01T00:00:00.000Z");
    expect(toDateUTCString(date)).toBe("2021-01-01");
  });

  it("can't format an empty string", () => {
    const date = parseISO("");
    expect(() => toDateUTCString(date)).toThrow("Invalid time value");
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
      "29/01/2024 à 12h36 (heure de Paris)",
    );
  });

  it("can't format an empty string", () => {
    const date = new Date("");
    expect(() => toDisplayedDate({ date })).toThrow("Invalid time value");
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
    expect(hoursValueToHoursDisplayed({ hoursValue: input })).toBe(expected);
  });
});

describe("Date utils tests - makeDateStringSchema", () => {
  const invalidDateZodError = new ZodError([
    { code: "custom", message: localization.invalidDate, path: [] },
  ]);

  const unsupportedDateZodError = new ZodError([
    { code: "custom", message: localization.unsupportedDate, path: [] },
  ]);
  const now = new Date();

  it.each([
    {
      title: "invalid not a date string",
      dateString: "kiki",
      error: invalidDateZodError,
    },
    {
      title: "invalid almost a date string",
      dateString: "2026-01-001",
      error: invalidDateZodError,
    },
    {
      title: "valid date string basic YYYY-MM-DD",
      dateString: "2026-01-01",
    },
    {
      title: "valid date string ISO YYYY-MM-DD HH:MM:SS:XXX+TZ",
      dateString: "2026-01-01 00:00:00:000+01",
    },
    {
      title: "valid date string ISO without TZ YYYY-MM-DD HH:MM:SS:XXX",
      dateString: "2026-01-01 00:00:00:000",
    },
    {
      title: "valid date string ISO without XXX & TZ YYYY-MM-DD HH:MM:SS",
      dateString: "2026-01-01 00:00:00",
    },
    {
      title: "invalid date string ISO with typo in TZ",
      dateString: "2026-01-01 00:00:00:000+b1",
      error: invalidDateZodError,
    },
    {
      title: "invalid date string ISO with typo in HH",
      dateString: "2026-01-01 AA:00:00:000+00",
      error: invalidDateZodError,
    },
    {
      title:
        "invalid date string ISO out of range in past (juste before 130 years ago)",
      dateString: subYears(now, 130).toISOString(),
      error: unsupportedDateZodError,
    },
    {
      title:
        "invalid date string ISO out of range in future (just after 5 years)",
      dateString: addSeconds(addYears(now, 5), 1).toISOString(),
      error: unsupportedDateZodError,
    },
    {
      title: "invalid date string  out of range with common 2026 > 20256 typo",
      dateString: new Date("20256-01-01").toISOString(),
      error: unsupportedDateZodError,
    },
    {
      title: "valid date string ISO from Date().toISOString()",
      dateString: now.toISOString(),
    },
  ] satisfies {
    title: string;
    dateString: string;
    error?: ZodError;
  }[])("$title : '$dateString'", ({ dateString, error }) => {
    const schema = makeDateStringSchema();
    !error
      ? expectToEqual(schema.parse(dateString), dateString)
      : expect(() => schema.parse(dateString)).toThrow(error);
  });
});
