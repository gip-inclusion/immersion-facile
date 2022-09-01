import { useField } from "formik";
import React, { useEffect } from "react";
import { ConventionDto } from "shared/src/convention/convention.dto";
import { DateIntervalDto, ScheduleDto } from "shared/src/schedule/Schedule.dto";
import {
  reasonableSchedule,
  emptySchedule,
  validateSchedule,
} from "shared/src/schedule/ScheduleUtils";
import { BoolRadioPicker } from "./BoolRadioPicker";
import { ComplexSchedulePicker } from "./ComplexSchedulePicker";
import { RegularSchedulePicker } from "./RegularSchedulePicker";
import "./SchedulePicker.css";

type SchedulePickerProps = {
  disabled?: boolean;
  interval: DateIntervalDto;
};

export const SchedulePicker = (props: SchedulePickerProps): JSX.Element => {
  const name: keyof ConventionDto = "schedule";
  const [field, meta, { setValue, setError, setTouched }] =
    useField<ScheduleDto>({ name });
  useEffect(() => {
    setError(validateSchedule(field.value));
  }, [field.value, meta.error]);

  const onBoolRadioPickerChange = (isSimple: boolean): void => {
    setValue(
      isSimple
        ? reasonableSchedule(props.interval)
        : emptySchedule(props.interval),
    );
    setTouched(true);
  };
  return (
    <>
      <BoolRadioPicker
        name="schedule.isSimple"
        label="Les horaires quotidiens sont-ils réguliers ? *"
        description="Ex : (Non) chaque jour a des horaires bien spécifiques, (Oui) “Du lundi au vendredi de 8h00 à 17h00”"
        yesLabel="Oui"
        noLabel="Non, irréguliers"
        checked={field.value.isSimple}
        setFieldValue={onBoolRadioPickerChange}
        disabled={props.disabled}
      />

      <h4>
        {field.value.isSimple
          ? "Sélectionnez la période des jours *"
          : "Sélectionnez les horaires de travail jour par jour *"}
      </h4>
      {!field.value.isSimple && (
        <p className="fr-hint-text">
          Les horaires hebdomadaires ne doivent pas dépasser 35h.
        </p>
      )}
      {meta.error && meta.touched && (
        <div id={name + "-error-description"} className="fr-error-text">
          {JSON.stringify((meta.error as any)?.complexSchedule) ?? meta.error}
        </div>
      )}

      {!field.value.isSimple && (
        <ComplexSchedulePicker
          selectedIndex={field.value.selectedIndex}
          {...props}
        />
      )}
      {field.value.isSimple && <RegularSchedulePicker {...props} />}
    </>
  );
};
