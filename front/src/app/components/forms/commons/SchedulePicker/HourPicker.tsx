import React from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { ErrorMessage } from "@hookform/error-message";
import { useStyles } from "tss-react/dsfr";
import { removeAtIndex, replaceArrayElement, TimePeriodDto } from "shared";

type HourPickerProps = {
  name: string;
  timePeriods: Array<TimePeriodDto>;
  onValueChange: (timePeriods: Array<TimePeriodDto>) => void;
  disabled?: boolean;
};

export const HourPicker = ({
  name,
  timePeriods,
  onValueChange,
  disabled,
}: HourPickerProps) => {
  const { cx } = useStyles();
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
        timePeriods.map((hours, index) => {
          const onStartChange = (index: number, value: string) => {
            onValueChange(
              replaceArrayElement(timePeriods, index, {
                start: value,
                end: timePeriods[index].end,
              }),
            );
          };
          const onEndChange = (index: number, value: string) => {
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
            <div
              key={name + index}
              className={cx(fr.cx("fr-mt-2w"), "schedule-picker__section")}
            >
              <div className={cx("schedule-picker__row")}>
                <div className={cx("date-or-time-block")}>
                  <label htmlFor={name + index + "-start"}>Début</label>
                  <input
                    className={fr.cx("fr-input")}
                    type="time"
                    value={hours.start}
                    max={hours.end}
                    id={name + index + "-start"}
                    onChange={(evt) =>
                      onStartChange(index, evt.currentTarget.value)
                    }
                    disabled={disabled}
                  />
                  <ErrorMessage
                    name={`hours.${index}.start`}
                    as={"div"}
                    className={cx("field-error")}
                  />
                </div>

                <div className={cx("date-or-time-block")}>
                  <label htmlFor={name + index + "-end"}>Fin</label>
                  <input
                    className={fr.cx("fr-input")}
                    value={hours.end}
                    onChange={(evt) =>
                      onEndChange(index, evt.currentTarget.value)
                    }
                    id={name + index + "-end"}
                    type="time"
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
        })}
      {!disabled && (
        <Button
          className={fr.cx("fr-my-2w")}
          type="button"
          iconId="fr-icon-add-line"
          title="Ajouter des horaires"
          priority="secondary"
          onClick={() => add()}
        >
          Ajouter des horaires
        </Button>
      )}
    </>
  );
};
