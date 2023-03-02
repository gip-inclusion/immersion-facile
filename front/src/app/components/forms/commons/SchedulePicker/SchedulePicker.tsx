import { useField } from "formik";
import React from "react";
import {
  ConventionDto,
  DateIntervalDto,
  reasonableSchedule,
  ScheduleDto,
  scheduleWithFirstDayActivity,
} from "shared";
import { BoolRadioPicker } from "./BoolRadioPicker";
import { ComplexSchedulePicker } from "./ComplexSchedulePicker";
import { RegularSchedulePicker } from "./RegularSchedulePicker";
import { fr } from "@codegouvfr/react-dsfr";
import "./SchedulePicker.css";

type SchedulePickerProps = {
  disabled?: boolean;
  interval: DateIntervalDto;
};

export const SchedulePicker = ({
  interval,
  disabled,
}: SchedulePickerProps): JSX.Element => {
  const name: keyof ConventionDto = "schedule";
  const [field, meta, { setValue }] = useField<ScheduleDto>({ name });

  const onBoolRadioPickerChange = (isSimple: boolean): void => {
    setValue(
      isSimple
        ? reasonableSchedule(interval)
        : scheduleWithFirstDayActivity(interval),
    );
  };

  const scheduleErrors = meta.error ? toArrayOfScheduleErrors(meta.error) : [];

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
        disabled={disabled}
      />
      <p className={fr.cx("fr-h4", "fr-mt-4w")}>
        {field.value.isSimple
          ? "Sélectionnez la période des jours *"
          : "Sélectionnez les horaires de travail jour par jour *"}
      </p>
      {scheduleErrors.map((value, index) => (
        <div
          id={`${name}${index + 1}-error-description`}
          className={fr.cx("fr-error-text")}
          key={`error-${index}`}
        >
          {value}
        </div>
      ))}
      {field.value.isSimple ? (
        <RegularSchedulePicker interval={interval} disabled={disabled} />
      ) : (
        <ComplexSchedulePicker disabled={disabled} />
      )}
    </>
  );
};

const toArrayOfScheduleErrors = (input: string): string[] => {
  try {
    const json = JSON.parse(input);
    return Array.isArray(json)
      ? json
      : Object.entries(json).map(([_key, value]) => `${value}`);
  } catch (_e) {
    return typeof input === "object"
      ? Object.entries(input).map(([_key, value]) => `${value}`)
      : [input];
  }
};
