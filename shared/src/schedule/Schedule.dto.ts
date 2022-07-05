import { NotEmptyArray } from "../utils";
export type Weekday =
  | "lundi"
  | "mardi"
  | "mercredi"
  | "jeudi"
  | "vendredi"
  | "samedi"
  | "dimanche";
export type ScheduleDto = {
  isSimple: boolean;
  selectedIndex: number;
  complexSchedule: ComplexScheduleDto;
};
export type TimePeriodDto = { start: string; end: string };
export type TimePeriodsDto = TimePeriodDto[];
export type ComplexScheduleDto = DailyScheduleDto[];
export type DailyScheduleDto = {
  date: string;
  timePeriods: TimePeriodsDto;
};
export type DayPeriodsDto = WeekDayRangeSchemaDTO[];
export type WeekdayNumber = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type WeekDayRangeSchemaDTO = [WeekdayNumber, WeekdayNumber];
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
