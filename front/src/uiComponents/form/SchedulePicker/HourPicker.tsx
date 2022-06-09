import { ErrorMessage } from "formik";
import React from "react";
import { TimePeriodDto } from "shared/src/schedule/ScheduleSchema";
import { ButtonDelete, ButtonAdd } from "react-design-system/immersionFacile";

type HourPickerProps = {
  name: string;
  schedule: Array<TimePeriodDto>;
  onValueChange: (schedule: Array<TimePeriodDto>) => void;
  disabled?: boolean;
};
export const HourPicker = ({
  name,
  schedule,
  onValueChange,
  disabled,
}: HourPickerProps) => {
  const add = () => {
    let start = "9:00";
    let end = "17:00";
    if (schedule.length > 0) {
      // Autofill next period as end of current period + 1h,
      // w/ duration of 1h.
      const last = schedule[schedule.length - 1];
      const endH = last.end.split(":").map(Number)[0];
      if (endH < 22) {
        start = (endH + 1).toString() + ":00";
        end = (endH + 2).toString() + ":00";
      }
    }

    schedule.push({ start, end });
    onValueChange(schedule);
  };

  return (
    <>
      <div className="col"></div>
      {schedule.length > 0 &&
        schedule.map((hours, index) => {
          const onStartChange = (index: number, value: string) => {
            schedule[index].start = value;
            onValueChange(schedule);
          };
          const onEndChange = (index: number, value: string) => {
            schedule[index].end = value;
            onValueChange(schedule);
          };
          const remove = (index: number) => {
            schedule.splice(index, 1);
            onValueChange(schedule);
          };

          return (
            <div key={name + index}>
              <div className="flex p-1 items-end">
                <div className="date-or-time-block">
                  <div>Début</div>
                  <input
                    className="fr-input"
                    type="time"
                    value={hours.start}
                    max={hours.end}
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
                  <div>Fin</div>
                  <input
                    className="fr-input"
                    value={hours.end}
                    onChange={(evt) =>
                      onEndChange(index, evt.currentTarget.value)
                    }
                    type="time"
                    disabled={disabled}
                  />
                  <ErrorMessage
                    name={`hours.${index}.end`}
                    component="div"
                    className="field-error"
                  />
                </div>

                {!disabled && <ButtonDelete onClick={() => remove(index)} />}
              </div>
            </div>
          );
        })}
      {!disabled && (
        <ButtonAdd
          style={{
            marginTop: "10px",
          }}
          onClick={() => add()}
        >
          Ajouter des horaires
        </ButtonAdd>
      )}
    </>
  );
};
