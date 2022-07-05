import { useField } from "formik";
import React, { useEffect } from "react";
import { ConventionDto } from "shared/src/convention/convention.dto";
import { ScheduleDtoBuilder } from "shared/src/schedule/ScheduleDtoBuilder";

import {
  calculateWeeklyHoursFromSchedule,
  dayPeriodsFromComplexSchedule,
  reasonableSchedule,
  regularTimePeriods,
} from "shared/src/schedule/ScheduleUtils";
import {
  ScheduleDto,
  DailyScheduleDto,
  DateIntervalDto,
  DayPeriodsDto,
} from "shared/src/schedule/Schedule.dto";

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
  useEffect(() => {
    setValue(reasonableSchedule(props.interval));
  }, [props.interval.start.getTime(), props.interval.end.getTime()]);
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
          disabled={props.disabled}
        />

        <h4>Sélectionnez les horaires</h4>

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
