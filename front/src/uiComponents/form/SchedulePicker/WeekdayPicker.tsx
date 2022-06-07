import { FieldHookConfig } from "formik";
import React from "react";
import { ScheduleDto } from "shared/src/schedule/ScheduleSchema";
import { ButtonAdd, ButtonDelete } from "react-design-system/immersionFacile";
import { WeekdayDropdown } from "./WeekdayDropdown";

type WeekdayPickerProps = {
  schedule: number[][];
  onValueChange: (updatedWeekdays: number[][]) => void;
  disabled?: boolean;
} & FieldHookConfig<ScheduleDto>;

export const WeekdayPicker = ({
  name,
  schedule,
  onValueChange,
  disabled,
}: WeekdayPickerProps) => {
  const add = () => {
    let start = 0;
    let end = 5;
    if (schedule.length > 0) {
      // Autofill next period as one day after the current period,
      // with duration of 1 day.
      const last = schedule[schedule.length - 1];
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
                    disabled={disabled}
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
                    disabled={disabled}
                  />
                </div>
                {!disabled && (
                  <ButtonDelete
                    isHidden={!isRemovable}
                    disabled={!isRemovable}
                    onClick={() => remove(index)}
                  />
                )}
              </div>
            </div>
          );
        })}
      {!disabled && (
        <ButtonAdd onClick={() => add()}>Ajouter une période</ButtonAdd>
      )}
    </>
  );
};
