import { FieldHookConfig, useField } from "formik";
import React from "react";
import { ScheduleDto } from "src/shared/ScheduleSchema";
import { HourPicker } from "./HourPicker";
import { WeekdayPicker } from "./WeekdayPicker";

export type SimpleSchedulePickerProps = {
  setFieldValue: (updatedSchedule: ScheduleDto) => void;
  disabled?: boolean;
} & FieldHookConfig<ScheduleDto>;

export const SimpleSchedulePicker = (props: SimpleSchedulePickerProps) => {
  const [field] = useField(props);

  return (
    <div className="schedule-picker">
      <WeekdayPicker
        name={props.name}
        schedule={field.value.simpleSchedule.dayPeriods}
        onValueChange={(updatedWeekdays: number[][]) => {
          const schedule = field.value;
          schedule.simpleSchedule.dayPeriods = updatedWeekdays;
          props.setFieldValue(schedule);
        }}
        disabled={props.disabled}
      />

      <h4>Sélectionnez les horaires</h4>

      <HourPicker
        name={props.name}
        schedule={field.value.simpleSchedule.hours}
        onValueChange={(newHours) => {
          const schedule = field.value;
          schedule.simpleSchedule.hours = newHours;
          props.setFieldValue(schedule);
        }}
        disabled={props.disabled}
      />
    </div>
  );
};
