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
import { fr } from "@codegouvfr/react-dsfr";
import { useStyles } from "tss-react/dsfr";
import { clone } from "ramda";

type ComplexSchedulePickerProps = {
  disabled?: boolean;
};

export const ComplexSchedulePicker = ({
  disabled,
}: ComplexSchedulePickerProps) => {
  const { cx } = useStyles();
  const name: keyof ConventionDto = "schedule";
  const [field, _, { setValue }] = useField<ScheduleDto>({ name });

  return (
    <div
      className={cx(
        fr.cx("fr-mb-2w"),
        "schedule-picker",
        "schedule-picker--complex",
      )}
    >
      <DayPicker
        complexSchedule={field.value.complexSchedule}
        selectedIndex={field.value.selectedIndex}
        onChange={(lastClickedIndex) => {
          const updatedSchedule = clone(field.value);
          updatedSchedule.selectedIndex = lastClickedIndex;
          setValue(updatedSchedule);
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
          const updatedSchedule: ScheduleDto = JSON.parse(
            JSON.stringify(field.value),
          );
          updatedSchedule.complexSchedule[
            updatedSchedule.selectedIndex
          ].timePeriods = newHours;
          updatedSchedule.totalHours =
            calculateTotalImmersionHoursFromComplexSchedule(
              updatedSchedule.complexSchedule,
            );
          updatedSchedule.workedDays = calculateNumberOfWorkedDays(
            updatedSchedule.complexSchedule,
          );
          setValue(updatedSchedule);
        }}
        disabled={disabled}
      />
    </div>
  );
};
