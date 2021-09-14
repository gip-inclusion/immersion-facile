import {
  ComplexScheduleDto,
  ScheduleDto,
  SimpleScheduleDto,
  TimePeriodDto,
} from "./ScheduleSchema";

export const weekdays = [
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
  "dimanche",
];

const minutesInDay = (timePeriods: TimePeriodDto[]): number => {
  return timePeriods.reduce(
    (totalMinutes, period) => totalMinutes + timePeriodDuration(period),
    0
  );
};

export const calculateHoursOfComplexSchedule = (
  complexSchedule: ComplexScheduleDto
): number =>
  complexSchedule.reduce(
    (minutesInWeek, day) => minutesInWeek + minutesInDay(day),
    0
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

export const periodStringToHoursMinutes = (s: string) => {
  let [hour, minute] = s.split(":").map(Number);
  return [hour, minute];
};

export const timePeriodDuration = (period: TimePeriodDto) => {
  let [startHour, startMinute] = periodStringToHoursMinutes(period.start);
  let [endHour, endMinute] = periodStringToHoursMinutes(period.end);
  return Math.max(0, (endHour - startHour) * 60 + endMinute - startMinute);
};

export const checkTimePeriodPositive = (period: TimePeriodDto) => {
  let [startHour, startMinute] = periodStringToHoursMinutes(period.start);
  let [endHour, endMinute] = periodStringToHoursMinutes(period.end);
  const duration = (endHour - startHour) * 60 + endMinute - startMinute;

  return duration > 0;
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
    let period = schedule.hours[periodIndex];
    if (!checkTimePeriodPositive(period)) {
      return (
        "Sous-periode " +
        (periodIndex + 1) +
        " (" +
        period.start +
        " — " +
        period.end +
        ")" +
        " incorrect. Le début doit être avant la fin. "
      );
    }
  }

  schedule.hours.forEach((period: TimePeriodDto, index: Number) => {
    if (!checkTimePeriodPositive(period)) {
      return "Sous-periode " + index.toString() + " incorrect!";
    }
  });
};

export const checkComplexSchedule = (schedule: ComplexScheduleDto) => {
  for (let dayIndex = 0; dayIndex < schedule.length; dayIndex++) {
    const day = schedule[dayIndex];
    for (let periodIndex = 0; periodIndex < day.length; periodIndex++) {
      let period = day[periodIndex];
      if (!checkTimePeriodPositive(period)) {
        return (
          "Sous-periode " +
          (periodIndex + 1) +
          " (" +
          period.start +
          " — " +
          period.end +
          ")" +
          " de " +
          weekdays[dayIndex] +
          " incorrect. Le début doit être avant la fin. "
        );
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
  simpleSchedule: SimpleScheduleDto
): ComplexScheduleDto => {
  const complexSchedule: ComplexScheduleDto = Array.from(
    { length: 7 },
    () => []
  );
  simpleSchedule.dayPeriods.forEach((dayPeriod) => {
    for (let dayIndex = dayPeriod[0]; dayIndex <= dayPeriod[1]; dayIndex++) {
      complexSchedule[dayIndex] = complexSchedule[dayIndex].concat(
        simpleSchedule.hours
      );
    }
  });
  return complexSchedule;
};

// Converts an array of TimePeriodDto to a readable schedule, e.g.
// "08:00-12:00, 14:00-17:00". Empty arrays get converted to "libre".
export const prettyPrintDaySchedule = (
  timePeriods: TimePeriodDto[]
): string => {
  if (timePeriods.length == 0) {
    return "libre";
  }
  return timePeriods.map(({ start, end }) => `${start}-${end}`).join(", ");
};

// Converts a SimpleScheduleDto into a readable schdeule of the form:
// Heures de travail hebdomadaires: 28
// lundi: libre
// mardi: 08:00-12:00, 14:00-17:00
// ...
const prettyPrintComplexSchedule = (
  complexSchedule: ComplexScheduleDto
): string => {
  const lines: string[] = weekdays.map(
    (dayLabel: string, dayIndex: number) =>
      dayLabel + ": " + prettyPrintDaySchedule(complexSchedule[dayIndex])
  );

  const hours = calculateHoursOfComplexSchedule(complexSchedule);
  lines.unshift(`Heures de travail hebdomadaires: ${hours}`);
  return lines.join("\n");
};

const prettyPrintSimpleSchedule = (simpleSchedule: SimpleScheduleDto): string =>
  prettyPrintComplexSchedule(convertSimpleToComplexSchedule(simpleSchedule));

export const prettyPrintSchedule = (schedule: ScheduleDto): string =>
  schedule.isSimple
    ? prettyPrintSimpleSchedule(schedule.simpleSchedule)
    : prettyPrintComplexSchedule(schedule.complexSchedule);

// Extract all weekday names for which there is at least one
export const convertToFrenchNamedDays = (aSchedule: ScheduleDto) => {
  const complexSchedule = aSchedule.isSimple
    ? convertSimpleToComplexSchedule(aSchedule.simpleSchedule)
    : aSchedule.complexSchedule;

  return weekdays.filter(
    (_dayLabel, dayIndex) => complexSchedule[dayIndex].length > 0
  );
};
