import { FieldHookConfig } from "formik";
import React from "react";
import { ButtonAdd, ButtonDelete } from "react-design-system/immersionFacile";
import {
  DayPeriodsDto,
  ScheduleDto,
  WeekdayNumber,
  WeekDayRangeSchemaDTO,
} from "shared/src/schedule/Schedule.dto";
import { WeekdayDropdown } from "./WeekdayDropdown";

type WeekdayPickerProps = {
  dayPeriods: DayPeriodsDto;
  onValueChange: (dayPeriods: DayPeriodsDto) => void;
  disabled?: boolean;
} & FieldHookConfig<ScheduleDto>;

export const WeekdayPicker = ({
  name,
  dayPeriods,
  onValueChange,
  disabled,
}: WeekdayPickerProps) => {
  const add = () => {
    let start = 0;
    let end = 5;
    if (dayPeriods.length > 0) {
      // Autofill next period as one day after the current period,
      // with duration of 1 day.
      const last = dayPeriods[dayPeriods.length - 1];
      if (last[1] < 5) {
        start = last[1] + 2;
        end = last[1] + 2;
      }
    }
    dayPeriods.push([start, end] as WeekDayRangeSchemaDTO);
    onValueChange(dayPeriods);
  };
  return (
    <>
      <div className="col"></div>
      {dayPeriods.length > 0 &&
        dayPeriods.map((dayRange, index) => {
          const onStartChange = (value: number) => {
            dayRange[0] = value as WeekdayNumber;
            onValueChange(dayPeriods);
          };
          const onEndChange = (value: number) => {
            dayRange[1] = value as WeekdayNumber;
            onValueChange(dayPeriods);
          };

          const remove = (index: number) => {
            dayPeriods.splice(index, 1);
            onValueChange(dayPeriods);
          };

          const isRemovable = index > 0;

          return (
            <div key={name + index}>
              <div className="flex p-1 items-end">
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
