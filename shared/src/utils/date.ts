// Matches valid dates of the format 'yyyy-mm-dd'.
import { addHours, format, isValid } from "date-fns";
import { z } from "zod";
import type { Flavor } from "../typeFlavors";

export type DateString = Flavor<string, "DateString">;

export type DateTimeIsoString = Flavor<string, "DateTimeIsoString">;

const hourDisplayedSeparator = "h";

export const dateTimeIsoStringSchema: z.Schema<DateTimeIsoString> = z
  .string()
  .datetime();

export const dateRegExp = /\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])/;

// HH:MM 24-hour with leading 0
export const timeHHmmRegExp = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;

export const toDateString = (date: Date): string => format(date, "yyyy-MM-dd");

export const toDisplayedDate = ({
  date,
  withHours = false,
  showGMT,
}:
  | { date: Date; withHours?: false; showGMT?: false }
  | { date: Date; withHours?: true; showGMT?: boolean }): string =>
  `${format(date, withHours ? "dd/MM/yyyy 'à' HH'h'mm" : "dd/MM/yyyy")}${
    showGMT ? " (heure de Paris GMT+1)" : ""
  }`;

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
