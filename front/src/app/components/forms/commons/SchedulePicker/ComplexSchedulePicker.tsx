import { useField } from "formik";
import React from "react";
import {
  calculateNumberOfWorkedDays,
  calculateTotalImmersionHoursFromComplexSchedule,
  ConventionDto,
  ScheduleDto,
} from "shared";
import { DayPicker } from "./DayPicker";
import { HourPicker } from "./HourPicker";

type ComplexSchedulePickerProps = {
  disabled?: boolean;
};

export const ComplexSchedulePicker = ({
  disabled,
}: ComplexSchedulePickerProps) => {
  const name: keyof ConventionDto = "schedule";
  const [field, _, { setValue }] = useField<ScheduleDto>({ name });

  return (
    <div className="schedule-picker schedule-picker--complex  fr-mb-2w">
      <DayPicker
        complexSchedule={field.value.complexSchedule}
        selectedIndex={field.value.selectedIndex}
        onChange={(lastClickedIndex) => {
          const schedule = field.value;
          schedule.selectedIndex = lastClickedIndex;
          setValue(schedule);
        }}
      />
      <HourPicker
        name={name}
        timePeriods={
          field.value.complexSchedule[field.value.selectedIndex]
            ? field.value.complexSchedule[field.value.selectedIndex].timePeriods
            : []
        }
        onValueChange={(newHours) => {
          const schedule: ScheduleDto = { ...field.value };
          schedule.complexSchedule[schedule.selectedIndex].timePeriods =
            newHours;
          schedule.totalHours = calculateTotalImmersionHoursFromComplexSchedule(
            schedule.complexSchedule,
          );
          schedule.workedDays = calculateNumberOfWorkedDays(
            schedule.complexSchedule,
          );
          setValue(schedule);
        }}
        disabled={disabled}
      />
    </div>
  );
};
