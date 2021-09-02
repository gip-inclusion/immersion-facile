import React from "react";
import { FieldHookConfig } from "formik";
import { ScheduleDto } from "src/shared/ScheduleSchema";
import { WeekdayDropdown } from "./WeekdayDropdown";
import { DeleteButton } from "../../DeleteButton";

type WeekdayPickerProps = {
  schedule: number[][];
  onValueChange: (updatedWeekdays: number[][]) => void;
} & FieldHookConfig<ScheduleDto>;

export const WeekdayPicker = ({
  name,
  schedule,
  onValueChange,
}: WeekdayPickerProps) => {
  const add = () => {
    let start = 0;
    let end = 5;
    if (schedule.length > 0) {
      // Autofill next period as one day after the current period,
      // with duration of 1 day.
      let last = schedule[schedule.length - 1];
      if (last[1] < 5) {
        start = last[1] + 2;
        end = last[1] + 2;
      }
    }

    schedule.push([start, end]);
    onValueChange(schedule);
  };

  return (
    <>
      <div className="col"></div>
      {schedule.length > 0 &&
        schedule.map((dayRange, index) => {
          const onStartChange = (value: number) => {
            dayRange[0] = value;
            onValueChange(schedule);
          };
          const onEndChange = (value: number) => {
            dayRange[1] = value;
            onValueChange(schedule);
          };

          const remove = (index: number) => {
            schedule.splice(index, 1);
            onValueChange(schedule);
          };

          const isRemovable = index > 0;

          return (
            <div key={name + index}>
              <div className="time-wrapper">
                <div className="date-or-time-block">
                  <div>Du</div>
                  <WeekdayDropdown
                    name="du"
                    minDay={0}
                    maxDay={dayRange[1]}
                    selected={dayRange[0]}
                    onValueChange={(x) => onStartChange(x)}
                  />
                </div>

                <div className="date-or-time-block">
                  <div>Au</div>
                  <WeekdayDropdown
                    name="du"
                    minDay={dayRange[0]}
                    maxDay={6}
                    selected={dayRange[1]}
                    onValueChange={(x) => onEndChange(x)}
                  />
                </div>
                <DeleteButton
                  isHidden={!isRemovable}
                  disabled={!isRemovable}
                  onClick={() => remove(index)}
                />
              </div>
            </div>
          );
        })}
      <button
        type="button"
        className="fr-btn fr-fi-add-line fr-btn--icon-left fr-btn--secondary"
        onClick={() => add()}
      >
        Ajouter une période
      </button>
    </>
  );
};
