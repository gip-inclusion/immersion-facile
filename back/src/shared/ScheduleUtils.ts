import { LegacyScheduleDto } from "./ScheduleSchema";
import {
  ComplexScheduleDto,
  ScheduleDto,
  SimpleScheduleDto,
  TimePeriodDto,
  weekdays,
} from "./ScheduleSchema";

const minutesInDay = (timePeriods: TimePeriodDto[]): number => {
  return timePeriods.reduce(
    (totalMinutes, period) => totalMinutes + timePeriodDuration(period),
    0,
  );
};

export const calculateHoursOfComplexSchedule = (
  complexSchedule: ComplexScheduleDto,
): number =>
  complexSchedule.reduce(
    (minutesInWeek, day) => minutesInWeek + minutesInDay(day),
    0,
  ) / 60;

// Calculate total hours per week for a given schedule.
export const calculateHours = (schedule: ScheduleDto) => {
  if (schedule.isSimple) {
    let numberOfDays = 0;
    for (const period of schedule.simpleSchedule.dayPeriods) {
      numberOfDays += period[1] - period[0] + 1;
    }
    let numberOfHours = 0;
    for (const period of schedule.simpleSchedule.hours) {
      numberOfHours += timePeriodDuration(period);
    }

    return (numberOfDays * numberOfHours) / 60;
  } else {
    return calculateHoursOfComplexSchedule(schedule.complexSchedule);
  }
};

export const maxPermittedHoursPerWeek = 35;

const periodStringToHoursMinutes = (s: string) => {
  const [hour, minute] = s.split(":").map(Number);
  return [hour, minute];
};

const timePeriodDuration = (period: TimePeriodDto) => {
  const [startHour, startMinute] = periodStringToHoursMinutes(period.start);
  const [endHour, endMinute] = periodStringToHoursMinutes(period.end);
  return Math.max(0, (endHour - startHour) * 60 + endMinute - startMinute);
};

const checkTimePeriodPositive = (period: TimePeriodDto) => {
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
const checkTimePeriodsOverlap = (
  period1: TimePeriodDto,
  period2: TimePeriodDto,
): boolean => {
  const period1Start = periodStringToMinutesFromMidnight(period1.start);
  const period1End = periodStringToMinutesFromMidnight(period1.end);
  const period2Start = periodStringToMinutesFromMidnight(period2.start);
  const period2End = periodStringToMinutesFromMidnight(period2.end);

  // Force ordering
  if (period1Start > period2Start) {
    return checkTimePeriodsOverlap(period2, period1);
  }

  return period2Start < period1End;
};

export const checkSimpleSchedule = (schedule: SimpleScheduleDto) => {
  if (schedule.dayPeriods.length === 0) {
    return "Selectionnez au moins un jour !";
  }

  for (
    let periodIndex = 0;
    periodIndex < schedule.hours.length;
    periodIndex++
  ) {
    const period = schedule.hours[periodIndex];
    if (!checkTimePeriodPositive(period)) {
      return (
        "La plage horaire " +
        (periodIndex + 1) +
        " " +
        periodToHumanReadableString(period) +
        " est incorrecte. L'heure de début doit précéder l'heure de fin. "
      );
    }
  }

  // Check if all periods are positive.
  schedule.hours.forEach((period: TimePeriodDto, index: number) => {
    if (!checkTimePeriodPositive(period)) {
      return "La plage horaire " + index.toString() + " est incorrecte !";
    }
  });

  // Check if any periods overlap.
  for (let i = 0; i < schedule.hours.length; i++) {
    for (let j = i + 1; j < schedule.hours.length; j++) {
      const period1 = schedule.hours[i];
      const period2 = schedule.hours[j];
      if (checkTimePeriodsOverlap(schedule.hours[i], schedule.hours[j])) {
        return (
          "Les plages horaires " +
          periodToHumanReadableString(period1) +
          " et " +
          periodToHumanReadableString(period2) +
          " se chevauchent !"
        );
      }
    }
  }
};

// Generates a string in format: "(09:00 - 13:00)"
const periodToHumanReadableString = (period: TimePeriodDto): string => {
  return "(" + period.start + " - " + period.end + ")";
};

export const checkComplexSchedule = (schedule: ComplexScheduleDto) => {
  for (let dayIndex = 0; dayIndex < schedule.length; dayIndex++) {
    const day = schedule[dayIndex];
    for (let periodIndex = 0; periodIndex < day.length; periodIndex++) {
      const period = day[periodIndex];
      // Check if all periods are positive.
      if (!checkTimePeriodPositive(period)) {
        return (
          "La plage horaire " +
          (periodIndex + 1) +
          " " +
          periodToHumanReadableString(period) +
          " de " +
          weekdays[dayIndex] +
          " incorrecte. L'heure de début doit précéder l'heure de fin. "
        );
      }

      // Check for overlap with other periods
      for (let j = periodIndex + 1; j < day.length; j++) {
        const otherPeriod = day[j];
        if (checkTimePeriodsOverlap(period, otherPeriod)) {
          return (
            "Les plages horaires " +
            periodToHumanReadableString(period) +
            " et " +
            periodToHumanReadableString(otherPeriod) +
            " de " +
            weekdays[dayIndex] +
            " se chevauchent !"
          );
        }
      }
    }
  }
};

export const checkSchedule = (schedule: ScheduleDto) => {
  if (schedule.isSimple) {
    return checkSimpleSchedule(schedule.simpleSchedule);
  } else {
    return checkComplexSchedule(schedule.complexSchedule);
  }
};

// Converts a SimpleScheduleDto to its corresponding ComplexSchduleDto representation.
const convertSimpleToComplexSchedule = (
  simpleSchedule: SimpleScheduleDto,
): ComplexScheduleDto => {
  const complexSchedule: ComplexScheduleDto = Array.from(
    { length: 7 },
    () => [],
  );
  simpleSchedule.dayPeriods.forEach((dayPeriod) => {
    for (let dayIndex = dayPeriod[0]; dayIndex <= dayPeriod[1]; dayIndex++) {
      complexSchedule[dayIndex] = complexSchedule[dayIndex].concat(
        simpleSchedule.hours,
      );
    }
  });
  return complexSchedule;
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
  const lines: string[] = weekdays.map(
    (dayLabel: string, dayIndex: number) =>
      dayLabel + " : " + prettyPrintDaySchedule(complexSchedule[dayIndex]),
  );

  const hours = calculateHoursOfComplexSchedule(complexSchedule);
  lines.unshift(`Heures de travail hebdomadaires : ${hours}`);
  return lines.join("\n");
};

const prettyPrintSimpleSchedule = (simpleSchedule: SimpleScheduleDto): string =>
  prettyPrintComplexSchedule(convertSimpleToComplexSchedule(simpleSchedule));

export const prettyPrintSchedule = (schedule: ScheduleDto): string =>
  schedule.isSimple
    ? prettyPrintSimpleSchedule(schedule.simpleSchedule)
    : prettyPrintComplexSchedule(schedule.complexSchedule);

export const prettyPrintLegacySchedule = (
  schedule: LegacyScheduleDto,
): string =>
  [
    "Les jours de l'immersion seront " + schedule.workdays.join(", "),
    schedule.description,
  ].join("\n");

// Extract all weekday names for which there is at least one
export const convertToFrenchNamedDays = (aSchedule: ScheduleDto) => {
  const complexSchedule = aSchedule.isSimple
    ? convertSimpleToComplexSchedule(aSchedule.simpleSchedule)
    : aSchedule.complexSchedule;

  return weekdays.filter(
    (_dayLabel, dayIndex) => complexSchedule[dayIndex].length > 0,
  );
};

export const isArrayOfWeekdays = (value: any): boolean =>
  Array.isArray(value) && value.every((el) => weekdays.includes(el));
