import React from "react";
import { ErrorMessage } from "formik";
import { TimePeriodDto } from "src/shared/ScheduleSchema";
import { DeleteButton } from "src/components/DeleteButton";

type HourPickerProps = {
  name: string;
  schedule: Array<TimePeriodDto>;
  onValueChange: (schedule: Array<TimePeriodDto>) => void;
};
export const HourPicker = ({
  name,
  schedule,
  onValueChange,
}: HourPickerProps) => {
  const add = () => {
    let start = "9:00";
    let end = "17:00";
    if (schedule.length > 0) {
      // Autofill next period as end of current period + 1h,
      // w/ duration of 1h.
      let last = schedule[schedule.length - 1];
      let endH = last.end.split(":").map(Number)[0];
      if (endH < 22) {
        start = (endH + 1).toString() + ":00";
        end = (endH + 2).toString() + ":00";
      }
    }

    schedule.push({ start: start, end: end });
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
              <div className="time-wrapper">
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
                    min="09:30"
                    onChange={(evt) =>
                      onEndChange(index, evt.currentTarget.value)
                    }
                    type="time"
                  />
                  <ErrorMessage
                    name={`hours.${index}.end`}
                    component="div"
                    className="field-error"
                  />
                </div>

                <DeleteButton onClick={() => remove(index)} />
              </div>
            </div>
          );
        })}
      <button
        type="button"
        style={{
          marginTop: "10px",
        }}
        className="fr-btn fr-fi-add-line fr-btn--icon-left fr-btn--secondary"
        onClick={() => add()}
      >
        Ajouter des horaires
      </button>
    </>
  );
};
