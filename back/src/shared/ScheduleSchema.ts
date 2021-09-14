import * as Yup from "../../node_modules/yup";

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
  complexSchedule: Array.from({ length: 5 }, (e) => [
    ...reasonableHours,
  ]).concat([[], []]),
  simpleSchedule: {
    dayPeriods: [[0, 4]],
    hours: [...reasonableHours],
  },
};

// Time period within a day.
export const timePeriodSchema = Yup.object({
  start: Yup.string().required(),
  end: Yup.string().required(),
});

// Each element represents one weekday, starting with Monday.
export const complexScheduleSchema = Yup.array(
  Yup.array(timePeriodSchema).required()
).required();

// Represents a schedule where each day is worked on the same
// schedule, with any combinations of workdays.
export const simpleScheduleSchema = Yup.object({
  // Each tuple represents a weekday range, e.g.:
  // [0, 4] means "Monday to Friday, inclusive"
  // [0, 0] means "Monday"
  dayPeriods: Yup.array(
    Yup.array(Yup.number().required()).length(2).required()
  ).required(),
  hours: Yup.array(timePeriodSchema).required(),
}).required();

export const scheduleSchema = Yup.object({
  isSimple: Yup.boolean().required("Obligatoire"),
  selectedIndex: Yup.number().default(0),
  complexSchedule: complexScheduleSchema,
  simpleSchedule: simpleScheduleSchema,
}).required();

export type SimpleScheduleDto = Yup.InferType<typeof simpleScheduleSchema>;
export type ScheduleDto = Yup.InferType<typeof scheduleSchema>;
export type TimePeriodDto = Yup.InferType<typeof timePeriodSchema>;
export type ComplexScheduleDto = Yup.InferType<typeof complexScheduleSchema>;
