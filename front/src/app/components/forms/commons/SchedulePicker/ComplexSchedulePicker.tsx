import React from "react";
import { useFormContext } from "react-hook-form";
import { fr } from "@codegouvfr/react-dsfr";
import { clone } from "ramda";
import { useStyles } from "tss-react/dsfr";

import {
  calculateNumberOfWorkedDays,
  calculateTotalImmersionHoursFromComplexSchedule,
  ConventionDto,
  ConventionReadDto,
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
  const { cx } = useStyles();
  const name: keyof ConventionDto = "schedule";
  const { setValue, getValues } = useFormContext<ConventionReadDto>();
  const values = getValues();
  return (
    <div
      className={cx(
        fr.cx("fr-mb-2w"),
        "schedule-picker",
        "schedule-picker--complex",
      )}
    >
      <DayPicker
        complexSchedule={values.schedule.complexSchedule}
        selectedIndex={values.schedule.selectedIndex}
        onChange={(lastClickedIndex) => {
          const updatedSchedule = clone(values.schedule);
          updatedSchedule.selectedIndex = lastClickedIndex;
          setValue(name, updatedSchedule);
        }}
      />
      <HourPicker
        name={name}
        timePeriods={
          values.schedule.complexSchedule[values.schedule.selectedIndex]
            ? values.schedule.complexSchedule[values.schedule.selectedIndex]
                .timePeriods
            : []
        }
        onValueChange={(newHours) => {
          const updatedSchedule: ScheduleDto = JSON.parse(
            JSON.stringify(values.schedule),
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
          setValue(name, updatedSchedule, {
            shouldValidate: true,
          });
        }}
        disabled={disabled}
      />
    </div>
  );
};
