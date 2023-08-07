import {
  addDays,
  addHours,
  differenceInCalendarWeeks,
  differenceInDays,
  format,
  getDay,
  parseISO,
  subDays,
} from "date-fns";
import { clone, prop, uniq } from "ramda";
import { arrayFromNumber } from "../utils";
import { DateIsoString } from "../utils/date";
import {
  DailyScheduleDto,
  DateIntervalDto,
  ScheduleDto,
  SelectedDaysOfTheWeekDto,
  TimePeriodDto,
  TimePeriodsDto,
  Weekday,
  WeekdayNumber,
  weekdays,
} from "./Schedule.dto";

export type DailyImmersionTimetableDto = {
  timePeriods: TimePeriodsDto | null;
  date: DateIsoString;
};

export type WeeklyImmersionTimetableDto = DailyImmersionTimetableDto[];

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

type DatesOfImmersion = {
  dateStart: string;
  dateEnd: string;
};

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
  interval: DateIntervalDto,
  displayFreeDays = true,
): string => {
  const lines: string[] = [];
  const weeks = makeImmersionTimetable(schedule.complexSchedule, interval);
  const weeksWithoutEmptyDays = weeks.map((week, weekIndex) => {
    const isStartingWeek = weekIndex === 0;
    const isEndingWeek = weekIndex === weeks.length - 1;
    const shouldModifyWeek = isStartingWeek || isEndingWeek;
    if (!shouldModifyWeek) return week;
    return week.filter((day, dayIndex) => {
      if (isStartingWeek) {
        return !(
          dayIndex <
            week.findIndex((otherDay) => otherDay.timePeriods !== null) &&
          day.timePeriods === null
        );
      }
      if (isEndingWeek) {
        return !(
          dayIndex >
            week.findLastIndex((otherDay) => otherDay.timePeriods !== null) &&
          day.timePeriods === null
        );
      }
    });
  });
  weeksWithoutEmptyDays.forEach((week) => {
    lines.push(
      `Heures de travail hebdomadaires : ${calculateWeeklyHours(week)}`,
    );
    week.forEach((day) => {
      const isDateOutOfInterval =
        day.date < interval.start.toISOString() ||
        day.date > interval.end.toISOString();
      const isFreeDaySkipped = !day.timePeriods && !displayFreeDays;
      return (
        !isDateOutOfInterval &&
        !isFreeDaySkipped &&
        lines.push(
          `${
            frenchDayMapping(day.date).frenchDayName
          } : ${prettyPrintDaySchedule(day.timePeriods)}`,
        )
      );
    });
  });
  return lines.join("\n");
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

export const isValidInterval = (interval: DateIntervalDto): boolean =>
  !(isNaN(interval.start.getTime()) || isNaN(interval.end.getTime()));

export const reasonableSchedule = (
  interval: DateIntervalDto,
  excludedDays: Weekday[] = [],
  timePeriods: TimePeriodsDto = reasonableTimePeriods,
): ScheduleDto => {
  const complexSchedule = isValidInterval(interval)
    ? makeComplexSchedule(interval, timePeriods, excludedDays)
    : [];
  return {
    totalHours:
      calculateTotalImmersionHoursFromComplexSchedule(complexSchedule),
    workedDays: calculateNumberOfWorkedDays(complexSchedule),
    isSimple: true,
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

export const validateSchedule = (
  schedule: ScheduleDto,
  interval: DateIntervalDto,
): string | undefined => {
  const totalWeeksHours = calculateWeeklyHoursFromSchedule(schedule, interval);
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
const prettyPrintDaySchedule = (
  timePeriods: TimePeriodDto[] | null,
): string => {
  if (!timePeriods || timePeriods.length == 0) {
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

const calculateTotalImmersionHoursBetweenDateComplex = ({
  dateStart,
  dateEnd,
  complexSchedule,
}: DatesOfImmersion & {
  complexSchedule: DailyScheduleDto[];
}): number => {
  const start = parseISO(dateStart);
  const end = parseISO(dateEnd);
  let totalOfMinutes = 0;
  for (
    let currentDate = start;
    currentDate < addDays(end, 1);
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

export const selectedDaysFromComplexSchedule = (
  complexSchedule: DailyScheduleDto[],
): SelectedDaysOfTheWeekDto =>
  uniq(
    complexSchedule
      .filter((day) => day.timePeriods.length > 0)
      .map((day) => frenchDayMapping(day.date).frenchDay),
  ).sort();

export const makeImmersionTimetable = (
  complexSchedule: DailyScheduleDto[],
  { start: startDay, end: endDay }: DateIntervalDto,
): ImmersionTimeTable => {
  const differenceInCalendarWeeksBetweenDates =
    differenceInCalendarWeeks(endDay, startDay, {
      weekStartsOn: 1,
    }) + 1;
  return isValidInterval({
    start: startDay,
    end: endDay,
  })
    ? arrayFromNumber(differenceInCalendarWeeksBetweenDates).map(
        (_, weekIndex) =>
          arrayFromNumber(weekdays.length).map((dayIndex) => {
            const mondayOfFirstWeek = subDays(
              startDay,
              frenchDayMapping(startDay.toISOString()).frenchDay,
            );
            const date = addDays(
              mondayOfFirstWeek,
              dayIndex + weekIndex * weekdays.length,
            );
            const dailySchedule = complexSchedule.find(
              (dailySchedule) =>
                parseISO(dailySchedule.date).getDate() === date.getDate() &&
                parseISO(dailySchedule.date).getMonth() === date.getMonth() &&
                parseISO(dailySchedule.date).getFullYear() ===
                  date.getFullYear(),
            );
            return {
              timePeriods: dailySchedule?.timePeriods ?? null,
              date: date.toISOString(),
            } satisfies DailyImmersionTimetableDto;
          }),
      )
    : [];
};

// Calculate total hours per week for a given schedule.
export const calculateWeeklyHoursFromSchedule = (
  schedule: ScheduleDto,
  interval: DateIntervalDto,
) =>
  makeImmersionTimetable(schedule.complexSchedule, interval).map(
    calculateWeeklyHours,
  );

export const calculateWeeklyHours = (
  week: WeeklyImmersionTimetableDto,
): number =>
  week.reduce(
    (previousValue, currentDay) =>
      currentDay.timePeriods
        ? previousValue + minutesInDay(currentDay.timePeriods) / 60
        : previousValue,
    0,
  );

export const defaultTimePeriods: TimePeriodsDto = [
  {
    start: "09:00",
    end: "12:00",
  },
  {
    start: "13:00",
    end: "17:00",
  },
];

export const regularTimePeriods = (
  timePeriods: TimePeriodsDto,
): TimePeriodsDto =>
  timePeriods.length > 0 ? timePeriods : defaultTimePeriods;

export const emptySchedule = (
  interval: DateIntervalDto,
): Readonly<ScheduleDto> => ({
  totalHours: 0,
  workedDays: 0,
  isSimple: false,
  complexSchedule: makeComplexSchedule(interval, []),
});

export const scheduleWithFirstDayActivity = (
  interval: DateIntervalDto,
  excludedDays: Weekday[] = [],
): Readonly<ScheduleDto> => {
  const complexSchedule = makeComplexSchedule(interval, [], excludedDays).map(
    (schedule) => {
      if (schedule.date === interval.start.toISOString()) {
        schedule.timePeriods = [
          { start: "09:00", end: "12:00" },
          { start: "13:00", end: "17:00" },
        ];
      }
      return schedule;
    },
  );
  return {
    totalHours:
      calculateTotalImmersionHoursFromComplexSchedule(complexSchedule),
    workedDays: calculateNumberOfWorkedDays(complexSchedule),
    isSimple: false,
    complexSchedule,
  };
};

export const makeDailySchedule = (
  date: Date,
  schedules: TimePeriodsDto,
): DailyScheduleDto => {
  const timePeriods = clone(schedules);
  return {
    date: date.toISOString(),
    timePeriods,
  };
};

export const makeComplexSchedule = (
  { start, end }: DateIntervalDto,
  timePeriods: TimePeriodsDto,
  excludedDays?: Weekday[],
): DailyScheduleDto[] => {
  const complexSchedules: DailyScheduleDto[] = [];
  const excludedDayNumbers =
    excludedDays?.map(
      (weekday) =>
        dayOfWeekMapping.find((value) => value.frenchDayName === weekday)
          ?.universalDay,
    ) || [];

  for (
    let currentDate = start;
    currentDate <= end;
    currentDate = addHours(currentDate, 24)
  ) {
    if (!excludedDayNumbers.includes(getDay(currentDate)))
      complexSchedules.push(makeDailySchedule(currentDate, timePeriods));
  }
  return complexSchedules;
};

export const calculateScheduleTotalDurationInDays = (
  complexSchedule: DailyScheduleDto[],
) => {
  const dates = complexSchedule.map(prop("date"));
  const dateStart = dates.sort()[0];
  const dateEnd = dates.reverse()[0];
  return differenceInDays(new Date(dateEnd), new Date(dateStart));
};

export const isSundayInSchedule = (complexSchedule: DailyScheduleDto[]) => {
  const sunday = 0;
  return complexSchedule.some(
    (week) =>
      getDay(parseISO(week.date)) === sunday && week.timePeriods.length > 0,
  );
};
