// Matches valid dates of the format 'yyyy-mm-dd'.
import { addHours, differenceInCalendarDays, isValid } from "date-fns";
import { z } from "zod";
import type { Flavor } from "../typeFlavors";
import { localization } from "../zodUtils";

export type DateString = Flavor<string, "DateString">;

export type DateTimeIsoString = Flavor<string, "DateTimeIsoString">;

export type DateRange = {
  from: Date;
  to: Date;
};

export const rtf = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });

const hourDisplayedSeparator = "h";

export const dateTimeIsoStringSchema: z.ZodISODateTime = z.iso.datetime({
  error: localization.invalidDate,
});

export const dateRegExp = /\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])/;

export const toDateUTCString = (date: Date): string => {
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid time value");
  }
  return date.toISOString().split("T")[0];
};

const isWinterClockHours = (date: Date): boolean => {
  const year = date.getUTCFullYear();

  const lastDayMarch = new Date(Date.UTC(year, 2, 31));
  const lastSundayMarch = new Date(
    Date.UTC(year, 2, 31 - lastDayMarch.getUTCDay()),
  );

  const lastDayOctober = new Date(Date.UTC(year, 9, 31));
  const lastSundayOctober = new Date(
    Date.UTC(year, 9, 31 - lastDayOctober.getUTCDay()),
  );

  return date < lastSundayMarch || date >= lastSundayOctober;
};

export const toDisplayedDate = ({
  date,
  withHours = false,
}:
  | { date: Date; withHours?: false }
  | { date: Date; withHours?: true }): string => {
  const [year, month, day] = toDateUTCString(date).split("-");

  if (withHours) {
    const parisOffset = isWinterClockHours(date) ? 1 : 2;
    const hours = String(date.getUTCHours() + parisOffset).padStart(2, "0");
    const minutes = String(date.getUTCMinutes()).padStart(2, "0");

    return `${day}/${month}/${year} à ${hours}h${minutes} (heure de Paris)`;
  }

  return `${day}/${month}/${year}`;
};

export const isStringDate = (string: string) => isValid(new Date(string));

export const convertLocaleDateToUtcTimezoneDate = (date: Date): Date => {
  if (date.getTimezoneOffset() < 0) return date; // if browser's timezone is ahead of UTC, return the date as is
  return addHours(date, date.getTimezoneOffset() / 60);
};

export const hoursValueToHoursDisplayed = ({
  hoursValue,
  padWithZero = true,
}: {
  hoursValue: number;
  padWithZero?: boolean;
}): string => {
  const hours = Math.floor(hoursValue);
  const minutes = Math.round((hoursValue - hours) * 60);
  const hoursDisplayed = `${hours < 10 && padWithZero ? `0${hours}` : hours}`;
  if (minutes === 0) return `${hoursDisplayed}${hourDisplayedSeparator}`;
  return `${hoursDisplayed}${hourDisplayedSeparator}${
    minutes < 10 ? `0${minutes}` : minutes
  }`;
};

export const getDaysBetween = (from: Date, to: Date) =>
  differenceInCalendarDays(
    convertLocaleDateToUtcTimezoneDate(to),
    convertLocaleDateToUtcTimezoneDate(from),
  );
