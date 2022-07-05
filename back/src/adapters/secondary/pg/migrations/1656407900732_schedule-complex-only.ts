import { addDays, getDay, parseISO } from "date-fns";
import { MigrationBuilder } from "node-pg-migrate";
import { z } from "zod";

export async function up(pgm: MigrationBuilder): Promise<void> {
  await pgm.db.query(
    "ALTER TABLE immersion_applications RENAME TO conventions",
  );
  const result = await pgm.db.select(
    "SELECT id, date_start, date_end, schedule FROM conventions ORDER BY id",
  );

  const partialConventions = z
    .array(
      z.object({
        id: z.string(),
        schedule: scheduleSchemaV0,
        date_start: dateSchema,
        date_end: dateSchema,
      }),
    )
    .parse(result);

  const transformedPartialConventions = partialConventions.map(
    ({ id, schedule, date_start, date_end }) => ({
      id,
      schedule: tranformV0ScheduleToSchedule(schedule, date_start, date_end),
    }),
  );
  for (const { id, schedule } of transformedPartialConventions) {
    await pgm.db.query(
      `UPDATE conventions SET schedule = '${JSON.stringify(
        schedule,
      )}' WHERE id = '${id}'`,
    );
  }
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  await pgm.db.query(
    "ALTER TABLE conventions RENAME TO immersion_applications",
  );

  const result = await pgm.db.select(
    "SELECT id, date_start, date_end, schedule FROM immersion_applications ORDER BY id",
  );

  const partialConventions = z
    .array(
      z.object({
        id: z.string(),
        schedule: scheduleSchema,
      }),
    )
    .parse(result);

  const transformedPartialConventions = partialConventions.map(
    ({ id, schedule }) => ({
      id,
      schedule: tranformScheduleToV0Schedule(schedule),
    }),
  );
  for (const { id, schedule } of transformedPartialConventions) {
    await pgm.db.query(
      `UPDATE immersion_applications SET schedule = '${JSON.stringify(
        schedule,
      )}' WHERE id = '${id}'`,
    );
  }
}

const timePeriodSchema = z.object({
  start: z.string(),
  end: z.string(),
});
const dateSchema = z.preprocess((arg) => {
  if (typeof arg === "string") return new Date(arg);
  return arg;
}, z.date());
const weekDaySchema = z.number().min(0).max(6);
const weekDayRangeSchema = z.array(weekDaySchema).length(2);
const timePeriodsSchema = z.array(timePeriodSchema);
const dayPeriodsSchema = z.array(weekDayRangeSchema);

const regularScheduleSchema = z.object({
  dayPeriods: dayPeriodsSchema,
  hours: timePeriodsSchema,
});
type RegularScheduleSchemaV0 = z.infer<typeof regularScheduleSchema>;

const dailyScheduleSchema = z.object({
  date: dateSchema,
  timePeriods: timePeriodsSchema,
});
const complexScheduleSchema = z.array(dailyScheduleSchema);
const complexScheduleV0Schema = z.array(timePeriodsSchema);
type ComplexScheduleV0Dto = z.infer<typeof complexScheduleV0Schema>;
type ComplexScheduleDto = z.infer<typeof complexScheduleSchema>;

const scheduleSchema = z.object({
  isSimple: z.boolean(),
  selectedIndex: z.number().default(0),
  complexSchedule: complexScheduleSchema,
});
const scheduleSchemaV0 = z.object({
  isSimple: z.boolean(),
  selectedIndex: z.number(),
  complexSchedule: complexScheduleV0Schema,
  simpleSchedule: regularScheduleSchema,
});
type ScheduleDto = z.infer<typeof scheduleSchema>;
type ScheduleV0Dto = z.infer<typeof scheduleSchemaV0>;

type UniversalDayMappingToFrenchCalendar = {
  universalDay: WeekdayNumber;
  frenchDay: WeekdayNumber;
  frenchDayName: Weekday;
};
type Weekday =
  | "lundi"
  | "mardi"
  | "mercredi"
  | "jeudi"
  | "vendredi"
  | "samedi"
  | "dimanche";
type WeekdayNumber = 0 | 1 | 2 | 3 | 4 | 5 | 6;
type DayPeriodsDto = z.infer<typeof dayPeriodsSchema>;
type WeekDayRangeSchemaDTO = z.infer<typeof weekDayRangeSchema>;

type ImmersionTimeTable = WeeklyImmersionTimetableDto[];
type DailyScheduleDto = z.infer<typeof dailyScheduleSchema>;
type WeeklyImmersionTimetableDto = {
  dailySchedule: DailyScheduleDto | null;
  key: number;
}[];
const dayOfWeekMapping: UniversalDayMappingToFrenchCalendar[] = [
  { frenchDayName: "lundi", frenchDay: 0, universalDay: 1 },
  { frenchDayName: "mardi", frenchDay: 1, universalDay: 2 },
  { frenchDayName: "mercredi", frenchDay: 2, universalDay: 3 },
  { frenchDayName: "jeudi", frenchDay: 3, universalDay: 4 },
  { frenchDayName: "vendredi", frenchDay: 4, universalDay: 5 },
  { frenchDayName: "samedi", frenchDay: 5, universalDay: 6 },
  { frenchDayName: "dimanche", frenchDay: 6, universalDay: 0 },
];

const tranformScheduleToV0Schedule = ({
  complexSchedule,
  isSimple,
  selectedIndex,
}: ScheduleDto): ScheduleV0Dto => ({
  isSimple,
  selectedIndex,
  simpleSchedule:
    isSimple === true
      ? v0SimpleScheduleFromComplexSchedule(complexSchedule)
      : { dayPeriods: [], hours: [] },
  complexSchedule: v0ComplexScheduleFromComplexSchedule(complexSchedule),
});

const tranformV0ScheduleToSchedule = (
  { complexSchedule, isSimple, selectedIndex, simpleSchedule }: ScheduleV0Dto,
  start: Date,
  end: Date,
): ScheduleDto => ({
  isSimple,
  selectedIndex,
  complexSchedule: isSimple
    ? complexScheduleFromSimpleSchedule(simpleSchedule, start, end)
    : complexScheduleFromV0ComplexSchedule(complexSchedule, start, end),
});

const complexScheduleFromSimpleSchedule = (
  simpleSchedule: {
    dayPeriods: number[][];
    hours: { start: string; end: string }[];
  },
  start: Date,
  end: Date,
): ComplexScheduleDto => {
  const complexSchedule: ComplexScheduleDto = [];
  getDates(start, end).forEach((date) => {
    const frenchDay = frenchDayMapping(date).frenchDay;
    for (const [firstFrenchDay, lastFrenchDay] of simpleSchedule.dayPeriods) {
      if (firstFrenchDay <= frenchDay && frenchDay <= lastFrenchDay)
        complexSchedule.push({
          date,
          timePeriods: simpleSchedule.hours,
        });
    }
  });
  return complexSchedule;
};

const complexScheduleFromV0ComplexSchedule = (
  v0ComplexSchedule: { start: string; end: string }[][],
  start: Date,
  end: Date,
): ComplexScheduleDto => {
  const complexSchedule: ComplexScheduleDto = [];
  getDates(start, end).forEach((date) => {
    const timePeriods = v0ComplexSchedule.at(frenchDayMapping(date).frenchDay);
    if (timePeriods && timePeriods.length > 0)
      complexSchedule.push({
        date,
        timePeriods,
      });
  });
  return complexSchedule;
};

const getDates = (startDate: Date, stopDate: Date) => {
  const dateArray = [];
  let currentDate = startDate;
  while (currentDate <= stopDate) {
    dateArray.push(new Date(currentDate));
    currentDate = addDays(currentDate, 1);
  }
  return dateArray;
};

const v0SimpleScheduleFromComplexSchedule = (
  complexSchedule: ComplexScheduleDto,
): RegularScheduleSchemaV0 => {
  const firstComplexSchedule = complexSchedule.at(0);
  return {
    dayPeriods: dayPeriodsFromComplexSchedule(complexSchedule),
    hours: firstComplexSchedule ? firstComplexSchedule.timePeriods : [],
  };
};
const v0ComplexScheduleFromComplexSchedule = (
  complexSchedule: ComplexScheduleDto,
): ComplexScheduleV0Dto => {
  const v0ComplexSchedule: ComplexScheduleV0Dto = [[], [], [], [], [], [], []];
  for (const dailySchedule of complexSchedule) {
    v0ComplexSchedule[frenchDayMapping(dailySchedule.date).frenchDay] =
      dailySchedule.timePeriods;
  }
  return v0ComplexSchedule;
};

const frenchDayMapping = (
  date: Date | string,
): UniversalDayMappingToFrenchCalendar => {
  if (!(date instanceof Date)) date = parseISO(date);
  const universalDay = getDay(date);
  const mapping = dayOfWeekMapping.find(
    (value) => value.universalDay === universalDay,
  );
  if (mapping !== undefined) return mapping;
  throw new Error(
    `Universal day index ${universalDay} of date ${date} missing on dayMapping: ${JSON.stringify(
      dayOfWeekMapping,
    )}`,
  );
};

const dayPeriodsFromComplexSchedule = (
  complexSchedule: ComplexScheduleDto,
): DayPeriodsDto => {
  const dayPeriods: DayPeriodsDto = [];
  let currentWeekDayRange: null | WeekDayRangeSchemaDTO = null;
  const weekDayAlreadyInUse: WeekdayNumber[] = [];
  function addPeriod(currentWeekDayRange: number[]) {
    if (
      !dayPeriods.some(
        (dayPeriod) =>
          JSON.stringify(dayPeriod) === JSON.stringify(currentWeekDayRange),
      )
    )
      dayPeriods.push(currentWeekDayRange);
  }
  makeImmersionTimetable(complexSchedule).forEach((week) => {
    week.forEach((day) => {
      if (weekDayAlreadyInUse.length < 7) {
        if (day.dailySchedule) {
          const frenchDay = frenchDayMapping(day.dailySchedule.date).frenchDay;
          if (!weekDayAlreadyInUse.includes(frenchDay)) {
            if (!Array.isArray(currentWeekDayRange))
              currentWeekDayRange = [frenchDay];
            currentWeekDayRange[1] = frenchDay;
            weekDayAlreadyInUse.push(frenchDay);
          }
        }
        if (!day.dailySchedule && currentWeekDayRange) {
          addPeriod(currentWeekDayRange);
          currentWeekDayRange = null;
        }
      }
    });
    if (currentWeekDayRange !== null) {
      addPeriod(currentWeekDayRange);
      currentWeekDayRange = null;
    }
  });
  dayPeriods.sort((a, b) => a[0] - b[0]);
  return dayPeriods;
};

const makeImmersionTimetable = (
  complexSchedule: ComplexScheduleDto,
): ImmersionTimeTable => {
  const calendar: WeeklyImmersionTimetableDto[] = [];
  const lastDayOfTheWeekIndex = 6;
  applyDaysWithScheduleOnTimetable(complexSchedule, calendar);
  applyDaysWithoutScheduleOnTimetable(calendar, lastDayOfTheWeekIndex);
  return calendar;
};

const applyDaysWithoutScheduleOnTimetable = (
  calendar: WeeklyImmersionTimetableDto[],
  lastDayOfTheWeekIndex: number,
) => {
  let outOfRangeDayskey = 10000;
  for (let weekIndex = 0; weekIndex < calendar.length; weekIndex++) {
    for (let dayIndex = 0; dayIndex <= lastDayOfTheWeekIndex; dayIndex++) {
      if (calendar[weekIndex][dayIndex] === undefined) {
        calendar[weekIndex][dayIndex] = {
          dailySchedule: null,
          key: outOfRangeDayskey,
        };
        outOfRangeDayskey++;
      }
    }
  }
};

const applyDaysWithScheduleOnTimetable = (
  complexSchedule: ComplexScheduleDto,
  calendar: WeeklyImmersionTimetableDto[],
) => {
  let currentWeekIndex = 0;
  let higherWeekDay = 0;
  complexSchedule.forEach((dailySchedule, dayIndex) => {
    const frenchDay = frenchDayMapping(dailySchedule.date).frenchDay;
    if (frenchDay < higherWeekDay) currentWeekIndex++;
    if (calendar.at(currentWeekIndex) === undefined) calendar.push([]);
    calendar[currentWeekIndex][frenchDay] = {
      dailySchedule,
      key: dayIndex,
    };
    higherWeekDay = frenchDay;
  });
};
