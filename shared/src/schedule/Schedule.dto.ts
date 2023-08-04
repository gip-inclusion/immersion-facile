import { NotEmptyArray } from "../utils";
import { DateIsoString } from "../utils/date";

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
export type TimePeriodDto = { start: DateIsoString; end: DateIsoString };
export type TimePeriodsDto = TimePeriodDto[];

export type DailyScheduleDto = {
  date: DateIsoString;
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
