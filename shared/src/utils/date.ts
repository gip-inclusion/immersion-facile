// Matches valid dates of the format 'yyyy-mm-dd'.
import { format } from "date-fns";

export const dateRegExp = /\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])/;

// HH:MM 24-hour with leading 0
export const timeHHmmRegExp = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;

export const toDateString = (date: Date): string => format(date, "yyyy-MM-dd");

export const toDisplayedDate = (date: Date): string =>
  format(date, "dd/MM/yyyy");
