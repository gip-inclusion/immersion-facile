// Matches valid dates of the format 'yyyy-mm-dd'.
import { addHours, format, isValid } from "date-fns";
import { z } from "zod";
import { Flavor } from "../typeFlavors";

export type DateString = Flavor<string, "DateString">;

export type DateTimeIsoString = Flavor<string, "DateTimeIsoString">;

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

export const convertLocaleDateToUtcTimezoneDate = (date: Date): Date =>
  addHours(date, date.getTimezoneOffset() / 60);
