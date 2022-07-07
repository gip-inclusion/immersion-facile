import { useField } from "formik";
import React, { useEffect } from "react";
import { ConventionDto } from "shared/src/convention/convention.dto";
import { DateIntervalDto, ScheduleDto } from "shared/src/schedule/Schedule.dto";
import { emptySchedule } from "shared/src/schedule/ScheduleUtils";
import { DayPicker } from "./DayPicker";
import { HourPicker } from "./HourPicker";

type ComplexSchedulePickerProps = {
  selectedIndex: number;
  disabled?: boolean;
  interval: DateIntervalDto;
};

export const ComplexSchedulePicker = (props: ComplexSchedulePickerProps) => {
  const name: keyof ConventionDto = "schedule";
  const [field, _, { setValue }] = useField<ScheduleDto>({ name });
  useEffect(() => {
    if (!(props.disabled === true)) setValue(emptySchedule(props.interval));
  }, [props.interval.start.getTime(), props.interval.end.getTime()]);

  return (
    <div className="flex flex-col items-center">
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
          field.value.complexSchedule[field.value.selectedIndex].timePeriods
        }
        onValueChange={(newHours) => {
          const schedule: ScheduleDto = { ...field.value };
          schedule.complexSchedule[schedule.selectedIndex].timePeriods =
            newHours;
          setValue(schedule);
        }}
        disabled={props.disabled}
      />
    </div>
  );
};
