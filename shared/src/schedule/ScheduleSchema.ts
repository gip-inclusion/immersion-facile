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

export const emptySchedule: Readonly<ScheduleDto> = {
  isSimple: false,
  selectedIndex: 0,
  complexSchedule: [[], [], [], [], [], [], []],
  simpleSchedule: { dayPeriods: [], hours: [] },
};

const reasonableHours = [
  {
    start: "08:00",
    end: "12:00",
  },
  {
    start: "13:00",
    end: "16:00",
  },
];

export const reasonableSchedule: ScheduleDto = {
  isSimple: true,
  selectedIndex: 0,
  complexSchedule: Array.from({ length: 5 }, () => [...reasonableHours]).concat(
    [[], []],
  ),
  simpleSchedule: {
    dayPeriods: [[0, 4]],
    hours: [...reasonableHours],
  },
};

// Time period within a day.
export const timePeriodSchema = z.object({
  start: zTrimmedString,
  end: zTrimmedString,
});

// Each element represents one weekday, starting with Monday.
export const complexScheduleSchema = z.array(z.array(timePeriodSchema));

// Represents a schedule where each day is worked on the same
// schedule, with any combinations of workdays.
export const simpleScheduleSchema = z.object({
  // Each tuple represents a weekday range, e.g.:
  // [0, 4] means "Monday to Friday, inclusive"
  // [0, 0] means "Monday"
  dayPeriods: z.array(z.array(z.number()).length(2)),
  hours: z.array(timePeriodSchema),
});

export const scheduleSchema = z.object({
  isSimple: z.boolean(),
  selectedIndex: z.number().default(0),
  complexSchedule: complexScheduleSchema,
  simpleSchedule: simpleScheduleSchema,
});

export const legacyScheduleSchema = z.object({
  workdays: z.array(z.enum(weekdays)),
  description: zTrimmedString,
});

export type SimpleScheduleDto = z.infer<typeof simpleScheduleSchema>;
export type ScheduleDto = z.infer<typeof scheduleSchema>;
export type TimePeriodDto = z.infer<typeof timePeriodSchema>;
export type ComplexScheduleDto = z.infer<typeof complexScheduleSchema>;
export type LegacyScheduleDto = z.infer<typeof legacyScheduleSchema>;
