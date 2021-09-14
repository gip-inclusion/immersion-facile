import { FieldHookConfig, useField } from "formik";
import React from "react";
import { ScheduleDto } from "src/shared/ScheduleSchema";
import {
  calculateHours,
  checkSchedule,
  maxPermittedHoursPerWeek,
} from "src/shared/ScheduleUtils";
import { BoolRadioPicker } from "./BoolRadioPicker";
import { ComplexSchedulePicker } from "./ComplexSchedulePicker";
import "./SchedulePicker.css";
import { SimpleSchedulePicker } from "./SimpleSchedulePicker";
import { TotalHoursIndicator } from "./TotalHoursIndicator";

// Function that can be used as `validate` in Formik.
export function scheduleValidator(value: ScheduleDto): string | void {
  let totalHours = calculateHours(value);

  if (totalHours > maxPermittedHoursPerWeek) {
    return "Veuillez saisir moins de 35h par semaine.";
  } else if (totalHours === 0) {
    return "Veuillez remplir les horaires!";
  }

  return checkSchedule(value);
}

type SchedulePickerProps = {
  setFieldValue: (schedule: ScheduleDto) => void;
  disabled?: boolean;
} & FieldHookConfig<ScheduleDto>;
export const SchedulePicker = (props: SchedulePickerProps) => {
  const [field, meta] = useField(props);

  return (
    <>
      <BoolRadioPicker
        name="schedule.isSimple"
        label="Les horaires quotidiens sont-ils réguliers ? *"
        description="Ex : (Non) chaque jour a des horaires bien spécifiques, (Oui) “Du lundi au vendredi de 8h00 à 17h00”"
        yesLabel="Oui"
        noLabel="Non, irrégulieres"
        checked={field.value.isSimple}
        setFieldValue={(newValue) => {
          let schedule = field.value;
          schedule.isSimple = newValue;
          props.setFieldValue(schedule);
        }}
        disabled={props.disabled}
      />

      <h4>
        {field.value.isSimple
          ? "Sélectionnez la période des jours *"
          : "Sélectionnez les horaires de travail jour par jour *"}
      </h4>

      {meta.error && (
        <div id={props.name + "-error-description"} className="fr-error-text">
          {meta.error}
        </div>
      )}
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
