import React from "react";
import { useFormContext } from "react-hook-form";
import { fr } from "@codegouvfr/react-dsfr";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import {
  ConventionDto,
  ConventionReadDto,
  DateIntervalDto,
  reasonableSchedule,
  scheduleWithFirstDayActivity,
  Weekday,
} from "shared";
import { ComplexSchedulePicker } from "./ComplexSchedulePicker";
import { RegularSchedulePicker } from "./RegularSchedulePicker";
import "./SchedulePicker.css";

type SchedulePickerProps = {
  disabled?: boolean;
  interval: DateIntervalDto;
  excludedDays: Weekday[];
};

export const SchedulePicker = ({
  interval,
  disabled,
  excludedDays,
}: SchedulePickerProps): JSX.Element => {
  const name: keyof ConventionDto = "schedule";
  const {
    setValue,
    formState: { errors },
    getValues,
  } = useFormContext<ConventionReadDto>();
  const values = getValues();
  const onBoolRadioPickerChange = (isSimple: boolean): void => {
    const newScheduleValue = isSimple
      ? reasonableSchedule(interval, excludedDays, [])
      : scheduleWithFirstDayActivity(interval, excludedDays);
    setValue(name, newScheduleValue);
  };
  const error = errors[name];
  const scheduleErrors = error?.message
    ? toArrayOfScheduleErrors(error.message)
    : [];
  return (
    <>
      <RadioButtons
        legend="Les horaires quotidiens sont-ils réguliers ? *"
        hintText="Ex : (Non) chaque jour a des horaires bien spécifiques, (Oui) “Du lundi au vendredi de 8h00 à 17h00”"
        options={[
          {
            label: "Oui",
            nativeInputProps: {
              onChange: () => onBoolRadioPickerChange(true),
              checked: values.schedule.isSimple,
            },
          },
          {
            label: "Non, irréguliers",
            nativeInputProps: {
              checked: !values.schedule.isSimple,
              onChange: () => onBoolRadioPickerChange(false),
            },
          },
        ]}
        disabled={disabled}
      />

      <p className={fr.cx("fr-h4", "fr-mt-4w")}>
        {values[name].isSimple
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
      {values[name].isSimple ? (
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
