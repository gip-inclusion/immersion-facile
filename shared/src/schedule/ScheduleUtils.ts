import { addDays, getDay, parseISO } from "date-fns";
import {
  ComplexScheduleDto,
  DailyScheduleDto,
  DayPeriodsDto,
  LegacyScheduleDto,
  RegularScheduleDto,
  ScheduleDto,
  TimePeriodDto,
  TimePeriodsDto,
  Weekday,
  WeekDayRangeSchemaDTO,
  weekdays,
} from "./ScheduleSchema";

export type WeeklyImmersionTimetableDto = {
  dailySchedule: DailyScheduleDto | null;
  key: number;
}[];

type ImmersionTimeTable = WeeklyImmersionTimetableDto[];

export const emptyRegularSchedule: RegularScheduleDto = {
  dayPeriods: [[0, 6]],
  timePeriods: [],
};
export const maxPermittedHoursPerWeek = 35;

type WeekdayNumber = 0 | 1 | 2 | 3 | 4 | 5 | 6;

type UniversalDayMappingToFrenchCalendar = {
  universalDay: WeekdayNumber;
  frenchDay: WeekdayNumber;
  frenchDayName: Weekday;
};

const dayOfWeekMapping: UniversalDayMappingToFrenchCalendar[] = [
  { frenchDayName: "lundi", frenchDay: 0, universalDay: 1 },
  { frenchDayName: "mardi", frenchDay: 1, universalDay: 2 },
  { frenchDayName: "mercredi", frenchDay: 2, universalDay: 3 },
  { frenchDayName: "jeudi", frenchDay: 3, universalDay: 4 },
  { frenchDayName: "vendredi", frenchDay: 4, universalDay: 5 },
  { frenchDayName: "samedi", frenchDay: 5, universalDay: 6 },
  { frenchDayName: "dimanche", frenchDay: 6, universalDay: 0 },
];

// Calculate total hours per week for a given schedule.
export const calculateWeeklyHoursFromSchedule = (schedule: ScheduleDto) =>
  makeImmersionTimetable(schedule.complexSchedule).map((week) =>
    calculateWeeklyHours(week),
  );

export const isArrayOfWeekdays = (value: any): boolean =>
  Array.isArray(value) && value.every((el) => weekdays.includes(el));

export const prettyPrintDayFromSchedule = (
  schedule: ScheduleDto,
  dayIndex: number,
): string => {
  const complexSchedule = schedule.complexSchedule;
  return prettyPrintDaySchedule(complexSchedule[dayIndex].timePeriods);
};

type DatesOfImmersion = {
  dateStart: string;
  dateEnd: string;
};

type CalculateTotalHoursProps = DatesOfImmersion & {
  schedule: ScheduleDto;
};

export const calculateTotalImmersionHoursBetweenDate = ({
  schedule,
  ...dates
}: CalculateTotalHoursProps): number =>
  calculateTotalImmersionHoursBetweenDateComplex({
    complexSchedule: schedule.complexSchedule,
    ...dates,
  });

export const complexScheduleFromRegularSchedule = (
  complexSchedule: ComplexScheduleDto,
  regularSchedule: RegularScheduleDto,
): ComplexScheduleDto => {
  const isDailyScheduleOnRegularDayPeriod = (
    dailySchedule: DailyScheduleDto,
    regularDayPeriods: DayPeriodsDto,
  ): boolean =>
    regularDayPeriods.some(([startWorkingDay, endWorkingDay]) => {
      for (
        let currentWorkingDay = startWorkingDay;
        currentWorkingDay <= endWorkingDay;
        currentWorkingDay++
      ) {
        if (
          currentWorkingDay === frenchDayMapping(dailySchedule.date).frenchDay
        )
          return true;
      }
      return false;
    });
  for (let index = complexSchedule.length - 1; index >= 0; index--) {
    const check = isDailyScheduleOnRegularDayPeriod(
      complexSchedule[index],
      regularSchedule.dayPeriods,
    );
    if (check) complexSchedule[index].timePeriods = regularSchedule.timePeriods;
    else complexSchedule.splice(index, 1);
  }
  return complexSchedule;
};

export const prettyPrintSchedule = (schedule: ScheduleDto): string =>
  prettyPrintComplexSchedule(schedule.complexSchedule);

// Extract all weekday names for which there is at least one
export const convertToFrenchNamedDays = (schedule: ScheduleDto) => {
  const complexSchedule = schedule.complexSchedule;
  return complexSchedule
    .filter((daily) => daily.timePeriods.length > 0)
    .map((daily) => weekdays[frenchDayMapping(daily.date).frenchDay]);
};

export const frenchDayMapping = (
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

const minutesInDay = (timePeriods: TimePeriodDto[]): number =>
  timePeriods.reduce(
    (totalMinutes, period) => totalMinutes + timePeriodDurationMinutes(period),
    0,
  );

const periodStringToHoursMinutes = (s: string) => {
  const [hour, minute] = s.split(":").map(Number);
  return [hour, minute];
};

const timePeriodDurationMinutes = (period: TimePeriodDto) => {
  const [startHour, startMinute] = periodStringToHoursMinutes(period.start);
  const [endHour, endMinute] = periodStringToHoursMinutes(period.end);
  return Math.max(0, (endHour - startHour) * 60 + endMinute - startMinute);
};

const isTimePeriodPositive = (period: TimePeriodDto) => {
  const [startHour, startMinute] = periodStringToHoursMinutes(period.start);
  const [endHour, endMinute] = periodStringToHoursMinutes(period.end);
  const duration = (endHour - startHour) * 60 + endMinute - startMinute;
  return duration > 0;
};

const periodStringToMinutesFromMidnight = (s: string) => {
  const [hr, min] = periodStringToHoursMinutes(s);
  return hr * 60 + min;
};

// Returns true if the two periods overlap (for at least one minute).
const isPeriodsOverlap = (
  period1: TimePeriodDto,
  period2: TimePeriodDto,
): boolean => {
  const period1Start = periodStringToMinutesFromMidnight(period1.start);
  const period1End = periodStringToMinutesFromMidnight(period1.end);
  const period2Start = periodStringToMinutesFromMidnight(period2.start);

  // Force ordering
  return period1Start > period2Start
    ? isPeriodsOverlap(period2, period1)
    : period2Start < period1End;
};

// Generates a string in format: "(09:00 - 13:00)"
const periodToHumanReadableString = (period: TimePeriodDto): string =>
  "(" + period.start + " - " + period.end + ")";

export const isScheduleValid = (schedule: ScheduleDto) => {
  const totalWeeksHours = calculateWeeklyHoursFromSchedule(schedule);
  for (const [totalHoursIndex, totalHours] of totalWeeksHours.entries()) {
    if (totalHours > maxPermittedHoursPerWeek)
      return `Veuillez saisir moins de ${maxPermittedHoursPerWeek}h pour la semaine ${
        totalHoursIndex + 1
      }.`;
  }
  for (const dailySchedule of schedule.complexSchedule) {
    for (const [periodIndex, period] of dailySchedule.timePeriods.entries()) {
      // Check if all periods are positive.
      if (!isTimePeriodPositive(period))
        return `La plage horaire ${
          periodIndex + 1
        } ${periodToHumanReadableString(period)} du ${toFrenchReadableDate(
          dailySchedule.date,
        )} est incorrecte. L'heure de début doit précéder l'heure de fin.`;

      // Check for overlap with other periods
      for (const [
        otherPeriodIndex,
        otherPeriod,
      ] of dailySchedule.timePeriods.entries()) {
        if (
          periodIndex !== otherPeriodIndex &&
          isPeriodsOverlap(period, otherPeriod)
        )
          return `Les plages horaires ${
            periodIndex + 1
          } ${periodToHumanReadableString(period)} et ${
            otherPeriodIndex + 1
          } ${periodToHumanReadableString(
            otherPeriod,
          )} du ${toFrenchReadableDate(dailySchedule.date)} se chevauchent.`;
      }
    }
  }
  const totalScheduleHours = totalWeeksHours.reduce((a, b) => a + b, 0);
  if (totalScheduleHours === 0) return "Veuillez remplir les horaires.";
};

const toFrenchReadableDate = (date: Date) => {
  if (!(date instanceof Date)) date = parseISO(date);
  `${date.getDate()}/${date.getMonth() + 1}`;
};

// Converts an array of TimePeriodDto to a readable schedule, e.g.
// "08:00-12:00, 14:00-17:00". Empty arrays get converted to "libre".
const prettyPrintDaySchedule = (timePeriods: TimePeriodDto[]): string => {
  if (timePeriods.length == 0) {
    return "libre";
  }
  return timePeriods
    .slice(1)
    .reduce(
      (acc, { start, end }, timePeriodIndex) =>
        timePeriodIndex % 2
          ? `${acc},\n${start}-${end}`
          : `${acc}, ${start}-${end}`,
      `${timePeriods[0].start}-${timePeriods[0].end}`,
    );
};

// Converts a SimpleScheduleDto into a readable schdeule of the form:
// Heures de travail hebdomadaires: 28
// lundi: libre
// mardi: 08:00-12:00, 14:00-17:00
// ...
const prettyPrintComplexSchedule = (
  complexSchedule: ComplexScheduleDto,
): string => {
  const lines: string[] = [];
  makeImmersionTimetable(complexSchedule).forEach((week) => {
    lines.push(
      `Heures de travail hebdomadaires : ${calculateWeeklyHours(week)}`,
    );
    week.forEach((day, index) =>
      lines.push(
        day.dailySchedule
          ? `${
              weekdays[getIndexInWeekFromMonday(day.dailySchedule.date)]
            } : ${prettyPrintDaySchedule(day.dailySchedule.timePeriods)}`
          : `${weekdays[index]} : libre`,
      ),
    );
  });
  return lines.join("\n");
};

export const prettyPrintLegacySchedule = (
  schedule: LegacyScheduleDto,
): string =>
  [
    "Les jours de l'immersion seront " + schedule.workdays.join(", "),
    schedule.description,
  ].join("\n");

const getIndexInWeekFromMonday = (date: Date) => {
  const dayIndex = date.getDay();
  return dayIndex === 0 ? 6 : dayIndex - 1;
};

const calculateTotalImmersionHoursBetweenDateComplex = ({
  dateStart,
  dateEnd,
  complexSchedule,
}: DatesOfImmersion & { complexSchedule: ComplexScheduleDto }): number => {
  const start = parseISO(dateStart);
  const end = parseISO(dateEnd);
  let totalOfMinutes = 0;
  for (
    let currentDate = start;
    currentDate <= end;
    currentDate = addDays(currentDate, 1)
  ) {
    const date = complexSchedule.find(
      (dailySchedule) =>
        dailySchedule.date.getDate() === currentDate.getDate() &&
        dailySchedule.date.getMonth() === currentDate.getMonth() &&
        dailySchedule.date.getFullYear() === currentDate.getFullYear(),
    );
    if (date) totalOfMinutes += minutesInDay(date.timePeriods);
  }
  return totalOfMinutes / 60;
};

export const dayPeriodsFromComplexSchedule = (
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

export const makeImmersionTimetable = (
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

export const calculateWeeklyHours = (
  week: WeeklyImmersionTimetableDto,
): number =>
  week.reduce(
    (previousValue, currentDay) =>
      currentDay.dailySchedule
        ? previousValue +
          minutesInDay(currentDay.dailySchedule.timePeriods) / 60
        : previousValue,
    0,
  );

export const regularTimePeriods = (schedule: ScheduleDto): TimePeriodsDto => {
  const scheduleWithTimePeriods = schedule.complexSchedule.find(
    (dailySchedule) => dailySchedule.timePeriods.length > 0,
  );
  return scheduleWithTimePeriods ? scheduleWithTimePeriods.timePeriods : [];
};
