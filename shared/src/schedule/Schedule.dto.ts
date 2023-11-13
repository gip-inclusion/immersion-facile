import { NotEmptyArray } from "../utils";
import { DateString, DateTimeIsoString } from "../utils/date";

export type Weekday =
  | "lundi"
  | "mardi"
  | "mercredi"
  | "jeudi"
  | "vendredi"
  | "samedi"
  | "dimanche";

export type ScheduleDto = {
  totalHours: number;
  workedDays: number;
  isSimple: boolean;
  complexSchedule: DailyScheduleDto[];
};
export type TimePeriodDto = { start: DateString; end: DateString };
export type TimePeriodsDto = TimePeriodDto[];

export type DailyScheduleDto = {
  date: DateTimeIsoString;
  timePeriods: TimePeriodsDto;
};
export type SelectedDaysOfTheWeekDto = WeekdayNumber[];
export type WeekdayNumber = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type DateIntervalDto = {
  start: Date;
  end: Date;
};
export const weekdays: NotEmptyArray<Weekday> = [
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
  "dimanche",
];
