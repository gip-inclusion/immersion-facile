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
  totalHours: number;
  workedDays: number;
  isSimple: boolean;
  selectedIndex: number; // TODO this is a view constraint and should be removed
  complexSchedule: DailyScheduleDto[];
};
export type TimePeriodDto = { start: string; end: string }; //TODO Type better ? Format ISO ISO 8601 "HH-mm"
export type TimePeriodsDto = TimePeriodDto[];

export type DailyScheduleDto = {
  date: string; //TODO Type better ? Format ISO 8601 "YYYY-MM-DDT00:00:00.000Z"
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
