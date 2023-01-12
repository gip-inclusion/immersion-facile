import { addDays, format, getDay, parseISO } from "date-fns";
import { prop } from "ramda";

import {
  DailyScheduleDto,
  DateIntervalDto,
  DayPeriodsDto,
  ScheduleDto,
  TimePeriodDto,
  TimePeriodsDto,
  Weekday,
  WeekdayNumber,
  WeekDayRangeSchemaDTO,
  weekdays,
} from "./Schedule.dto";

export type WeeklyImmersionTimetableDto = {
  dailySchedule: DailyScheduleDto | null;
  key: number;
}[];

type ImmersionTimeTable = WeeklyImmersionTimetableDto[];

export const maxPermittedHoursPerWeek = 48;

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

export const calculateTotalImmersionHoursFromComplexSchedule = (
  complexSchedule: DailyScheduleDto[],
): number => {
  const dates = complexSchedule.map(prop("date"));
  const dateStart = dates.sort()[0];
  const dateEnd = dates.reverse()[0];
  return calculateTotalImmersionHoursBetweenDateComplex({
    complexSchedule,
    dateStart,
    dateEnd,
  });
};

export const prettyPrintSchedule = (
  schedule: ScheduleDto,
  displayFreeDays = true,
): string =>
  prettyPrintComplexSchedule(schedule.complexSchedule, displayFreeDays);

// Extract all weekday names for which there is at least one
export const convertToFrenchNamedDays = (schedule: ScheduleDto): Weekday[] => {
  const complexSchedule = schedule.complexSchedule;
  return complexSchedule
    .filter((daily) => daily.timePeriods.length > 0)
    .map((daily) => weekdays[frenchDayMapping(daily.date).frenchDay]);
};

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
export const reasonableSchedule = (interval: DateIntervalDto): ScheduleDto => {
  const complexSchedule = makeComplexSchedule(interval, reasonableTimePeriods);

  return {
    totalHours:
      calculateTotalImmersionHoursFromComplexSchedule(complexSchedule),
    workedDays: calculateNumberOfWorkedDays(complexSchedule),
    isSimple: true,
    selectedIndex: 0,
    complexSchedule,
  };
};

export const frenchDayMapping = (
  originalDate: string,
): UniversalDayMappingToFrenchCalendar => {
  const date = parseISO(originalDate);
  const universalDay = getDay(date);
  const mapping = dayOfWeekMapping.find(
    (value) => value.universalDay === universalDay,
  );
  if (mapping) return mapping;
  throw new Error(
    `Universal day index ${universalDay} of date ${originalDate} missing on dayMapping: ${JSON.stringify(
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

export const calculateNumberOfWorkedDays = (
  complexSchedule: DailyScheduleDto[],
): number => complexSchedule.filter((v) => v.timePeriods.length > 0).length;

export const validateSchedule = (schedule: ScheduleDto): string | undefined => {
  const totalWeeksHours = calculateWeeklyHoursFromSchedule(schedule);
  for (const [totalHoursIndex, totalHours] of totalWeeksHours.entries()) {
    if (totalHours > maxPermittedHoursPerWeek)
      return `Veuillez saisir moins de ${maxPermittedHoursPerWeek}h pour la semaine ${
        totalHoursIndex + 1
      }.`;
  }

  const totalHoursFromComplexSchedule =
    calculateTotalImmersionHoursFromComplexSchedule(schedule.complexSchedule);

  if (totalHoursFromComplexSchedule !== schedule.totalHours)
    return `Le nombre total d'heure ne correspond pas à celui du calendrier. Calcul du calendrier: ${totalHoursFromComplexSchedule}, Nombre total heures fourni: ${schedule.totalHours}`;

  const workedDays = calculateNumberOfWorkedDays(schedule.complexSchedule);
  if (workedDays !== schedule.workedDays)
    return `Le nombre total de jours travaillés ne correspond pas à celui du calendrier. Calcul du calendrier: ${workedDays}, Nombre de jours fourni: ${schedule.workedDays}`;

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

const toFrenchReadableDate = (isoStringDate: string): string =>
  format(parseISO(isoStringDate), "dd/MM/yyyy");

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
export const prettyPrintComplexSchedule = (
  complexSchedule: DailyScheduleDto[],
  displayFreeDays = true,
): string => {
  const lines: string[] = [];
  makeImmersionTimetable(complexSchedule).forEach((week) => {
    lines.push(
      `Heures de travail hebdomadaires : ${calculateWeeklyHours(week)}`,
    );
    week.forEach((day, index) => {
      const freeDay = displayFreeDays ? `${weekdays[index]} : libre` : "";
      const dayToPush = day.dailySchedule
        ? `${
            frenchDayMapping(day.dailySchedule.date).frenchDayName
          } : ${prettyPrintDaySchedule(day.dailySchedule.timePeriods)}`
        : freeDay;
      return dayToPush !== "" && lines.push(dayToPush);
    });
  });
  return lines.join("\n");
};

const calculateTotalImmersionHoursBetweenDateComplex = ({
  dateStart,
  dateEnd,
  complexSchedule,
}: DatesOfImmersion & { complexSchedule: DailyScheduleDto[] }): number => {
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
        parseISO(dailySchedule.date).getDate() === currentDate.getDate() &&
        parseISO(dailySchedule.date).getMonth() === currentDate.getMonth() &&
        parseISO(dailySchedule.date).getFullYear() ===
          currentDate.getFullYear(),
    );
    if (date) totalOfMinutes += minutesInDay(date.timePeriods);
  }
  return totalOfMinutes / 60;
};

export const dayPeriodsFromComplexSchedule = (
  complexSchedule: DailyScheduleDto[],
): DayPeriodsDto => {
  const manageTimePeriodOnDay = (frenchDay: number) => {
    const isSameFrenchDay = (day: DailyScheduleDto, frenchDay: number) =>
      frenchDayMapping(day.date).frenchDay === frenchDay;
    const hasTimePeriod = (day: DailyScheduleDto) => day.timePeriods.length > 0;
    complexSchedule.some(
      (day) => isSameFrenchDay(day, frenchDay) && hasTimePeriod(day),
    ) && timePeriodsOnFrenchDays.splice(frenchDay, 1, true);
  };
  const timePeriodsOnFrenchDays: boolean[] = [
    false,
    false,
    false,
    false,
    false,
    false,
    false,
  ];

  timePeriodsOnFrenchDays.forEach((_, frenchDay) =>
    manageTimePeriodOnDay(frenchDay),
  );

  const dayPeriods: DayPeriodsDto = [];
  for (
    let frenchDay = 0;
    frenchDay < timePeriodsOnFrenchDays.length;
    frenchDay++
  ) {
    if (timePeriodsOnFrenchDays[frenchDay] === true) {
      let lastFrenchDayWithTimePeriod = frenchDay;
      while (timePeriodsOnFrenchDays[lastFrenchDayWithTimePeriod + 1] === true)
        lastFrenchDayWithTimePeriod++;
      dayPeriods.push([
        frenchDay,
        lastFrenchDayWithTimePeriod,
      ] as WeekDayRangeSchemaDTO);
      frenchDay = lastFrenchDayWithTimePeriod;
    }
  }
  return dayPeriods;
};

export const makeImmersionTimetable = (
  complexSchedule: DailyScheduleDto[],
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
  complexSchedule: DailyScheduleDto[],
  calendar: WeeklyImmersionTimetableDto[],
) => {
  let currentWeekIndex = 0;
  let higherWeekDay = 0;
  complexSchedule.forEach((dailySchedule, dayIndex) => {
    const frenchDay = frenchDayMapping(dailySchedule.date).frenchDay;
    if (frenchDay < higherWeekDay) currentWeekIndex++;
    if (calendar[currentWeekIndex] === undefined) calendar.push([]);
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

export const emptySchedule = (
  interval: DateIntervalDto,
): Readonly<ScheduleDto> => ({
  totalHours: 0,
  workedDays: 0,
  isSimple: false,
  selectedIndex: 0,
  complexSchedule: makeComplexSchedule(interval, []),
});

export const scheduleWithFirstDayActivity = (
  interval: DateIntervalDto,
): Readonly<ScheduleDto> => {
  const complexSchedule = makeComplexSchedule(interval, []).map((schedule) => {
    if (schedule.date === interval.start.toISOString()) {
      schedule.timePeriods = [
        { start: "09:00", end: "12:00" },
        { start: "13:00", end: "17:00" },
      ];
    }
    return schedule;
  });
  return {
    totalHours:
      calculateTotalImmersionHoursFromComplexSchedule(complexSchedule),
    workedDays: calculateNumberOfWorkedDays(complexSchedule),
    isSimple: false,
    selectedIndex: 0,
    complexSchedule,
  };
};

export const makeDailySchedule = (
  date: Date,
  schedules: TimePeriodsDto,
): DailyScheduleDto => ({
  date: date.toISOString(),
  timePeriods: [...schedules],
});

export const makeComplexSchedule = (
  { start, end }: DateIntervalDto,
  timePeriods: TimePeriodsDto,
): DailyScheduleDto[] => {
  const complexSchedules: DailyScheduleDto[] = [];
  for (
    let currentDate = start;
    currentDate <= end;
    currentDate = addDays(currentDate, 1)
  )
    complexSchedules.push(makeDailySchedule(currentDate, timePeriods));
  return complexSchedules;
};
