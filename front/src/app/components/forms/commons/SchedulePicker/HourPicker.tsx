import React, { useState } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { ErrorMessage } from "@hookform/error-message";
import { useStyles } from "tss-react/dsfr";
import {
  domElementIds,
  removeAtIndex,
  replaceArrayElement,
  TimePeriodDto,
} from "shared";

type HourPickerProps = {
  name: string;
  timePeriods: TimePeriodDto[];
  onValueChange: (timePeriods: TimePeriodDto[]) => void;
  disabled?: boolean;
};

export const HourPicker = ({
  name,
  timePeriods,
  onValueChange,
  disabled,
}: HourPickerProps) => {
  const add = () => {
    const newTimePeriods = [...timePeriods];
    let start = "09:00";
    let end = "12:00";
    if (newTimePeriods.length > 0) {
      // Autofill next period as end of current period + 1h,
      // w/ duration of 1h.
      const last = newTimePeriods[newTimePeriods.length - 1];
      const endH = last.end.split(":").map(Number)[0];
      if (endH < 22) {
        start = (endH + 1).toString() + ":00";
        end = (endH + 2).toString() + ":00";
      }
    }
    newTimePeriods.push({ start, end });
    onValueChange(newTimePeriods);
  };

  return (
    <>
      {timePeriods.length > 0 &&
        timePeriods.map((hours, index) => (
          <TimePeriod
            key={`${timePeriods[index].start}-${timePeriods[index].end}`}
            hours={hours}
            index={index}
            timePeriods={timePeriods}
            onValueChange={onValueChange}
            name={name}
            disabled={disabled}
          />
        ))}
      {!disabled && (
        <Button
          className={fr.cx("fr-my-2w")}
          type="button"
          iconId="fr-icon-add-line"
          title="Ajouter des horaires"
          priority="secondary"
          onClick={() => add()}
          nativeButtonProps={{
            id: domElementIds.conventionImmersionRoute.conventionSection
              .addHoursButton,
          }}
        >
          Ajouter des horaires
        </Button>
      )}
    </>
  );
};

const TimePeriod = ({
  timePeriods,
  onValueChange,
  index,
  hours,
  name,
  disabled,
}: {
  timePeriods: TimePeriodDto[];
  onValueChange: (timePeriods: TimePeriodDto[]) => void;
  index: number;
  hours: TimePeriodDto;
  name: string;
  disabled?: boolean;
}) => {
  const { cx } = useStyles();
  const [startHour, setStartHour] = useState(hours.start);
  const [endHour, setEndHour] = useState(hours.end);
  const onStartBlur = (index: number, value: string) => {
    onValueChange(
      replaceArrayElement(timePeriods, index, {
        start: value,
        end: timePeriods[index].end,
      }),
    );
  };
  const onEndBlur = (index: number, value: string) => {
    timePeriods[index].end = value;
    onValueChange(
      replaceArrayElement(timePeriods, index, {
        start: timePeriods[index].start,
        end: value,
      }),
    );
  };
  const remove = (index: number) => {
    onValueChange(removeAtIndex(timePeriods, index));
  };
  return (
    <div className={cx(fr.cx("fr-mt-2w"), "schedule-picker__section")}>
      <div className={cx("schedule-picker__row")}>
        <div className={cx("date-or-time-block")}>
          <Input
            label="Début"
            id={name + index + "-start"}
            nativeInputProps={{
              type: "time",
              value: startHour,
              onBlur: (event) => onStartBlur(index, event.currentTarget.value),
              onChange: (event) => {
                setStartHour(event.currentTarget.value);
              },
            }}
            disabled={disabled}
          />
          <ErrorMessage
            name={`hours.${index}.start`}
            as={"div"}
            className={cx("field-error")}
          />
        </div>

        <div className={cx("date-or-time-block")}>
          <Input
            label="Fin"
            id={name + index + "-end"}
            nativeInputProps={{
              type: "time",
              value: endHour,
              onBlur: (event) => onEndBlur(index, event.currentTarget.value),
              onChange: (event) => {
                setEndHour(event.currentTarget.value);
              },
            }}
            disabled={disabled}
          />
          <ErrorMessage
            name={`hours.${index}.end`}
            as="div"
            className={cx("field-error")}
          />
        </div>

        {!disabled && (
          <Button
            type="button"
            iconId="fr-icon-delete-bin-line"
            title="Supprimer"
            onClick={() => remove(index)}
          />
        )}
      </div>
    </div>
  );
};
