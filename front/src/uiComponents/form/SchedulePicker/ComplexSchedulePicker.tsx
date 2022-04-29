import { FieldHookConfig, useField } from "formik";
import React from "react";
import { ScheduleDto } from "shared/src/ScheduleSchema";
import { DayPicker } from "./DayPicker";
import { HourPicker } from "./HourPicker";

type ComplexSchedulePickerProps = {
  selectedIndex: number;
  setFieldValue: (updatedSchedule: ScheduleDto) => void;
  disabled?: boolean;
} & FieldHookConfig<ScheduleDto>;

export const ComplexSchedulePicker = (props: ComplexSchedulePickerProps) => {
  const [field] = useField(props);
  return (
    <div className="schedule-picker">
      <DayPicker
        complexSchedule={field.value.complexSchedule}
        selectedIndex={field.value.selectedIndex}
        onChange={(lastClickedIndex) => {
          const schedule = field.value;
          schedule.selectedIndex = lastClickedIndex;
          props.setFieldValue(schedule);
        }}
      />

      <HourPicker
        name={props.name}
        schedule={field.value.complexSchedule[field.value.selectedIndex]}
        onValueChange={(newHours) => {
          const schedule = field.value;
          schedule.complexSchedule[schedule.selectedIndex] = newHours;
          props.setFieldValue(schedule);
        }}
        disabled={props.disabled}
      />
    </div>
  );
};
