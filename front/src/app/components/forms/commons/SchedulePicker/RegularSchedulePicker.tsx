import { useField } from "formik";
import React from "react";
import {
  calculateNumberOfWorkedDays,
  calculateTotalImmersionHoursFromComplexSchedule,
  calculateWeeklyHoursFromSchedule,
  ConventionDto,
  DailyScheduleDto,
  DateIntervalDto,
  DayPeriodsDto,
  dayPeriodsFromComplexSchedule,
  regularTimePeriods,
  ScheduleDto,
  ScheduleDtoBuilder,
} from "shared";

import { HourPicker } from "./HourPicker";
import { TotalWeeklyHoursIndicator } from "./TotaWeeklylHoursIndicator";
import { WeekdayPicker } from "./WeekdayPicker";

export type RegularSchedulePickerProps = {
  interval: DateIntervalDto;
  disabled?: boolean;
};

export const RegularSchedulePicker = (props: RegularSchedulePickerProps) => {
  const name: keyof ConventionDto = "schedule";
  const [field, _, { setValue }] = useField<ScheduleDto>({ name });
  return (
    <>
      <div className="schedule-picker">
        <WeekdayPicker
          name={name}
          dayPeriods={dayPeriodsFromComplexSchedule(
            field.value.complexSchedule,
          )}
          onValueChange={(dayPeriods: DayPeriodsDto) => {
            field.value = new ScheduleDtoBuilder(field.value)
              .withEmptyComplexSchedule(props.interval)
              .withRegularSchedule({
                dayPeriods,
                timePeriods: regularTimePeriods(field.value),
              })
              .build();
            setValue(field.value);
          }}
          interval={props.interval}
          disabled={props.disabled}
        />

        <span className="fr-h5">Sélectionnez les horaires</span>

        <HourPicker
          name={name}
          timePeriods={regularTimePeriods(field.value)}
          onValueChange={(newHours) => {
            const complexSchedule = field.value.complexSchedule.map(
              (dailySchedule): DailyScheduleDto => ({
                date: dailySchedule.date,
                timePeriods: newHours,
              }),
            );
            const schedule: ScheduleDto = { ...field.value, complexSchedule };
            schedule.totalHours =
              calculateTotalImmersionHoursFromComplexSchedule(
                schedule.complexSchedule,
              );
            schedule.workedDays = calculateNumberOfWorkedDays(
              schedule.complexSchedule,
            );
            setValue(schedule);
          }}
          disabled={props.disabled}
        />
      </div>
      {weeksHoursIndicator(field.value)}
    </>
  );
};

const weeksHoursIndicator = (schedule: ScheduleDto) =>
  calculateWeeklyHoursFromSchedule(schedule).map((weekTotalHours, index) => (
    <TotalWeeklyHoursIndicator
      key={`weeklyHoursIndicator-${index}`}
      week={index + 1}
      totalHours={weekTotalHours}
    />
  ));
