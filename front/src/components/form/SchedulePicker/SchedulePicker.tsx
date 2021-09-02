import React from "react";
import { useField, FieldHookConfig, FormikHelpers, FormikState } from "formik";
import "./SchedulePicker.css";
import { SimpleSchedulePicker } from "./SimpleSchedulePicker";
import { ComplexSchedulePicker } from "./ComplexSchedulePicker";
import { BoolRadioPicker } from "./BoolRadioPicker";
import { TotalHoursIndicator } from "./TotalHoursIndicator";
import { ScheduleDto } from "src/shared/ScheduleSchema";

export const calculateHours = (schedule: ScheduleDto) => {
  if (schedule.isSimple) {
    let numberOfDays = 0;
    for (const period of schedule.simpleSchedule.dayPeriods) {
      numberOfDays += period[1] - period[0] + 1;
    }
    let numberOfHours = 0;
    for (const period of schedule.simpleSchedule.hours) {
      let [startHour, startMinute] = period.start.split(":").map(Number);
      let [endHour, endMinute] = period.end.split(":").map(Number);
      numberOfHours += (endHour - startHour) * 60 + endMinute - startMinute;
    }

    return (numberOfDays * numberOfHours) / 60;
  } else {
    let total = 0;
    for (const day of schedule.complexSchedule) {
      for (const period of day) {
        let [startHour, startMinute] = period.start.split(":").map(Number);
        let [endHour, endMinute] = period.end.split(":").map(Number);
        total += (endHour - startHour) * 60 + endMinute - startMinute;
      }
    }
    return total / 60;
  }
};

type SchedulePickerProps = {
  setFieldValue: (schedule: ScheduleDto) => void;
} & FieldHookConfig<ScheduleDto>;
export const SchedulePicker = (props: SchedulePickerProps) => {
  const [field] = useField(props);
  return (
    <>
      <BoolRadioPicker
        name="schedule.isSimple"
        label="Les horaires quotidiens sont-ils réguliers ?"
        description="Ex : (Non) chaque jour a des horaires bien spécifiques, (Oui) “Du lundi au vendredi de 8h00 à 17h00”"
        yesLabel="Oui"
        noLabel="Non, irrégulieres"
        checked={field.value.isSimple}
        setFieldValue={(newValue) => {
          let schedule = field.value;
          schedule.isSimple = newValue;
          props.setFieldValue(schedule);
        }}
      />

      <h4>
        {field.value.isSimple
          ? "Sélectionnez la période des jours"
          : "Sélectionnez les horaires de travail jour par jour"}
      </h4>

      <TotalHoursIndicator totalHours={calculateHours(field.value)} />

      {!field.value.isSimple && (
        <ComplexSchedulePicker
          selectedIndex={field.value.selectedIndex}
          {...props}
        />
      )}
      {field.value.isSimple && <SimpleSchedulePicker {...props} />}
    </>
  );
};
