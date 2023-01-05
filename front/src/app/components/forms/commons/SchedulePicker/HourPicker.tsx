import { ErrorMessage } from "formik";
import React from "react";
import { ButtonAdd } from "react-design-system/immersionFacile";
import { TimePeriodDto } from "shared";
import { Button } from "@codegouvfr/react-dsfr/Button";

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
  const add = () => {
    let start = "09:00";
    let end = "12:00";
    if (timePeriods.length > 0) {
      // Autofill next period as end of current period + 1h,
      // w/ duration of 1h.
      const last = timePeriods[timePeriods.length - 1];
      const endH = last.end.split(":").map(Number)[0];
      if (endH < 22) {
        start = (endH + 1).toString() + ":00";
        end = (endH + 2).toString() + ":00";
      }
    }
    timePeriods.push({ start, end });
    onValueChange(timePeriods);
  };

  return (
    <>
      <div className="col"></div>
      {timePeriods.length > 0 &&
        timePeriods.map((hours, index) => {
          const onStartChange = (index: number, value: string) => {
            timePeriods[index].start = value;
            onValueChange(timePeriods);
          };
          const onEndChange = (index: number, value: string) => {
            timePeriods[index].end = value;
            onValueChange(timePeriods);
          };
          const remove = (index: number) => {
            timePeriods.splice(index, 1);
            onValueChange(timePeriods);
          };

          return (
            <div key={name + index}>
              <div className="flex p-1 items-end">
                <div className="date-or-time-block">
                  <label htmlFor={name + index + "-start"}>Début</label>
                  <input
                    className="fr-input"
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
                    component="div"
                    className="field-error"
                  />
                </div>

                <div className="date-or-time-block">
                  <label htmlFor={name + index + "-end"}>Fin</label>
                  <input
                    className="fr-input"
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
                    component="div"
                    className="field-error"
                  />
                </div>

                {!disabled && (
                  <Button
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
        <ButtonAdd className="fr-my-2w" onClick={() => add()}>
          Ajouter des horaires
        </ButtonAdd>
      )}
    </>
  );
};
