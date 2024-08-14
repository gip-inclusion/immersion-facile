import { z } from "zod";
import { DateString, dateRegExp, dateTimeIsoStringSchema } from "../utils/date";
import { localization, zStringMinLength1, zTimeString } from "../zodUtils";
import {
  DailyScheduleDto,
  ScheduleDto,
  SelectedDaysOfTheWeekDto,
  TimePeriodDto,
  TimePeriodsDto,
  WeekdayNumber,
} from "./Schedule.dto";

// Time period within a day.
// TODO We could refine by checking that start < end
export const timePeriodSchema: z.Schema<TimePeriodDto> = z.object({
  start: zTimeString,
  end: zTimeString,
});

export const timePeriodsSchema: z.Schema<TimePeriodsDto> =
  z.array(timePeriodSchema);

export const makeDateStringSchema: (
  errorMessage?: string,
) => z.Schema<DateString> = (errorMessage) =>
  zStringMinLength1.refine(
    (dateString) => dateString.match(dateRegExp),
    errorMessage ?? localization.invalidDate,
  );

export const dailyScheduleSchema: z.Schema<DailyScheduleDto> = z.object({
  date: dateTimeIsoStringSchema,
  timePeriods: timePeriodsSchema,
});

export const immersionDaysScheduleSchema: z.Schema<DailyScheduleDto[]> =
  z.array(dailyScheduleSchema);

export const weekDaySchema = z
  .number()
  .int()
  .min(0)
  .max(6) as z.Schema<WeekdayNumber>;

// Each tuple represents a weekday range, e.g.:
// [0, 4] means "Monday to Friday, inclusive"
// [0, 0] means "Monday"
export const selectedDaysOfTheWeekSchema: z.Schema<SelectedDaysOfTheWeekDto> =
  z.array(weekDaySchema);

export const scheduleSchema: z.Schema<ScheduleDto> = z.object({
  totalHours: z.number(),
  workedDays: z.number(),
  isSimple: z.boolean(),
  complexSchedule: immersionDaysScheduleSchema,
});
export { dateTimeIsoStringSchema };
