import { addDays, parseISO } from "date-fns";
import { z } from "zod";
import { NotEmptyArray } from "../utils";
import { zTrimmedString } from "../zodUtils";

export type Weekday =
  | "lundi"
  | "mardi"
  | "mercredi"
  | "jeudi"
  | "vendredi"
  | "samedi"
  | "dimanche";

export const weekdays: NotEmptyArray<Weekday> = [
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
  "dimanche",
];

export type DateInterval = {
  start: Date;
  end: Date;
};

export const emptySchedule = (
  interval: DateInterval,
): Readonly<ScheduleDto> => ({
  isSimple: false,
  selectedIndex: 0,
  complexSchedule: makeComplexSchedule(interval, []),
});

const reasonableTimePeriods: TimePeriodsDto = [
  {
    start: "08:00",
    end: "12:00",
  },
  {
    start: "13:00",
    end: "16:00",
  },
];

export const makeDailySchedule = (
  date: Date,
  schedules: TimePeriodsDto,
): DailyScheduleDto => ({
  date: date.toISOString(),
  timePeriods: [...schedules],
});

export const makeComplexSchedule = (
  { start, end }: DateInterval,
  timePeriods: TimePeriodsDto,
): ComplexScheduleDto => {
  const complexSchedules: ComplexScheduleDto = [];
  for (
    let currentDate = start;
    currentDate <= end;
    currentDate = addDays(currentDate, 1)
  )
    complexSchedules.push(makeDailySchedule(currentDate, timePeriods));
  return complexSchedules;
};

export const reasonableSchedule = (interval: DateInterval): ScheduleDto => ({
  isSimple: true,
  selectedIndex: 0,
  complexSchedule: makeComplexSchedule(interval, reasonableTimePeriods),
});

// Time period within a day.
export const timePeriodSchema = z.object({
  start: zTrimmedString,
  end: zTrimmedString,
});

const isoStringSchema = z.preprocess((arg) => {
  if (arg instanceof Date) return arg.toISOString();
  if (typeof arg === "string") return parseISO(arg).toISOString();
}, z.string());

const timePeriodsSchema = z.array(timePeriodSchema);
export const dailyScheduleSchema = z.object({
  date: isoStringSchema,
  timePeriods: timePeriodsSchema,
});

// Each element represents one weekday, starting with Monday.
export const complexScheduleSchema_V0 = z.array(z.array(timePeriodSchema));
export const complexScheduleSchema = z.array(dailyScheduleSchema);

const weekDaySchema = z.number().min(0).max(6);
export const weekDayRangeSchema = z.array(weekDaySchema).length(2);
export type WeekDayRangeSchemaDTO = z.infer<typeof weekDayRangeSchema>;
// Each tuple represents a weekday range, e.g.:
// [0, 4] means "Monday to Friday, inclusive"
// [0, 0] means "Monday"
const dayPeriodsSchema = z.array(weekDayRangeSchema);
export type DayPeriodsDto = z.infer<typeof dayPeriodsSchema>;

// Represents a schedule where each day is worked on the same
// schedule, with any combinations of workdays.
export const regularScheduleSchema = z.object({
  dayPeriods: dayPeriodsSchema,
  timePeriods: timePeriodsSchema,
});

export const makeDateInterval = (
  complexSchedule: ComplexScheduleDto,
): DateInterval => {
  const dates = complexSchedule.map((schedule) => schedule.date);
  return {
    start: new Date(Math.min(...dates.map((date) => new Date(date).getTime()))),
    end: new Date(Math.max(...dates.map((date) => new Date(date).getTime()))),
  };
};

export const scheduleSchema = z.object({
  isSimple: z.boolean(),
  selectedIndex: z.number().default(0),
  complexSchedule: complexScheduleSchema,
});

export const legacyScheduleSchema = z.object({
  workdays: z.array(z.enum(weekdays)),
  description: zTrimmedString,
});

export type ScheduleDto = z.infer<typeof scheduleSchema>;
export type TimePeriodDto = z.infer<typeof timePeriodSchema>;
export type TimePeriodsDto = z.infer<typeof timePeriodsSchema>;
export type ComplexScheduleDto = z.infer<typeof complexScheduleSchema>;
export type RegularScheduleDto = z.infer<typeof regularScheduleSchema>;
export type LegacyScheduleDto = z.infer<typeof legacyScheduleSchema>;
export type DailyScheduleDto = z.infer<typeof dailyScheduleSchema>;
