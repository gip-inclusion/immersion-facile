// Matches valid dates of the format 'yyyy-mm-dd'.
import { format } from "date-fns";

export const dateRegExp = /\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])/;

export const toDateString = (date: Date): string => format(date, "yyyy-MM-dd");
