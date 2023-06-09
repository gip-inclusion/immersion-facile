// Matches valid dates of the format 'yyyy-mm-dd'.
import { format, isValid } from "date-fns";
import { Flavor } from "../typeFlavors";

export type DateStr = Flavor<string, "DateStr">;

export const dateRegExp = /\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])/;

// HH:MM 24-hour with leading 0
export const timeHHmmRegExp = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;

export const toDateString = (date: Date): string => format(date, "yyyy-MM-dd");

export const toDisplayedDate = (date: Date, withHours = false): string =>
  format(date, withHours ? "dd/MM/yyyy 'à' HH'h'mm" : "dd/MM/yyyy");

export const isStringDate = (string: string) => isValid(new Date(string));
