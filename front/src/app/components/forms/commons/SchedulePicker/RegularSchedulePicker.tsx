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
      <div className="schedule-picker schedule-picker--regular fr-grid-row fr-grid-row--gutters fr-mb-2w">
        <div className="schedule-picker__inner fr-col-12 fr-col-lg-8">
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

          <p className="fr-h5 fr-mt-2w">Sélectionnez les horaires</p>

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
        <div className="schedule-picker__week-hours-summary fr-col-12 fr-col-lg-4">
          <p className="fr-text--sm fr-mb-1w">
            <strong>Récapitulatif hebdomadaire</strong>
          </p>
          <hr className="fr-hr fr-pb-1w" />
          {weeksHoursIndicator(field.value)}
        </div>
      </div>
    </>
  );
};

const weeksHoursIndicator = (schedule: ScheduleDto) => (
  <ul>
    {calculateWeeklyHoursFromSchedule(schedule).map((weekTotalHours, index) => (
      <TotalWeeklyHoursIndicator
        key={`weeklyHoursIndicator-${index}`}
        week={index + 1}
        totalHours={weekTotalHours}
      />
    ))}
  </ul>
);
