import { z } from "zod";
import { zTrimmedString } from "../zodUtils";
import {
  ComplexScheduleDto,
  DailyScheduleDto,
  DayPeriodsDto,
  ScheduleDto,
  TimePeriodDto,
  TimePeriodsDto,
  WeekdayNumber,
  WeekDayRangeSchemaDTO,
} from "./Schedule.dto";

// Time period within a day.
export const timePeriodSchema: z.Schema<TimePeriodDto> = z.object({
  start: zTrimmedString,
  end: zTrimmedString,
});
export const timePeriodsSchema: z.Schema<TimePeriodsDto> =
  z.array(timePeriodSchema);

export const isoStringSchema = z.preprocess((arg) => {
  if (arg instanceof Date) return arg.toISOString();
  if (typeof arg === "string") return new Date(arg).toISOString();
}, z.string());

export const dailyScheduleSchema: z.Schema<DailyScheduleDto> = z.object({
  date: isoStringSchema,
  timePeriods: timePeriodsSchema,
});

// Each element represents one weekday, starting with Monday.
//export const complexScheduleSchema_V0 = z.array(z.array(timePeriodSchema));

export const complexScheduleSchema: z.Schema<ComplexScheduleDto> =
  z.array(dailyScheduleSchema);

export const weekDaySchema = z
  .number()
  .int()
  .min(0)
  .max(6) as z.Schema<WeekdayNumber>;
export const weekDayRangeSchema: z.Schema<WeekDayRangeSchemaDTO> = z.tuple([
  weekDaySchema,
  weekDaySchema,
]);

// Each tuple represents a weekday range, e.g.:
// [0, 4] means "Monday to Friday, inclusive"
// [0, 0] means "Monday"
export const dayPeriodsSchema: z.Schema<DayPeriodsDto> =
  z.array(weekDayRangeSchema);

export const scheduleSchema: z.Schema<ScheduleDto> = z.object({
  isSimple: z.boolean(),
  selectedIndex: z.number(),
  complexSchedule: complexScheduleSchema,
});
