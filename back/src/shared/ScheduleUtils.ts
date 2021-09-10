import {
  ComplexScheduleDto,
  SimpleScheduleDto,
  TimePeriodDto,
  ScheduleDto,
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
    let total = 0;
    for (const day of schedule.complexSchedule) {
      for (const period of day) {
        total += timePeriodDuration(period);
      }
    }
    return total / 60;
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
