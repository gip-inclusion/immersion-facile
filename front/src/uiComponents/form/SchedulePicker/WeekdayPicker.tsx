import { FieldHookConfig } from "formik";
import React from "react";
import { ButtonAdd, ButtonDelete } from "react-design-system/immersionFacile";
import {
  DayPeriodsDto,
  ScheduleDto,
  WeekdayNumber,
  WeekDayRangeSchemaDTO,
  DateIntervalDto,
} from "shared";
import { WeekdayDropdown } from "./WeekdayDropdown";

type WeekdayPickerProps = {
  dayPeriods: DayPeriodsDto;
  onValueChange: (dayPeriods: DayPeriodsDto) => void;
  disabled?: boolean;
  interval: DateIntervalDto;
} & FieldHookConfig<ScheduleDto>;

export const WeekdayPicker = ({
  name,
  dayPeriods,
  onValueChange,
  disabled,
  interval,
}: WeekdayPickerProps) => {
  const canAddNewPeriod = (): WeekDayRangeSchemaDTO | false => {
    if (dayPeriods.length === 0) return false;
    const lastPeriod = dayPeriods[dayPeriods.length - 1];
    const lastPeriodEnd = lastPeriod[1];
    return lastPeriodEnd < 5 ? lastPeriod : false;
  };

  const add = () => {
    let start = 0;
    let end = 5;
    // Autofill next period as one day after the current period,
    // with duration of 1 day.
    const last = canAddNewPeriod();
    if (last) {
      start = last[1] + 2;
      end = last[1] + 2;
    }
    dayPeriods.push([start, end] as WeekDayRangeSchemaDTO);
    onValueChange(dayPeriods);
  };

  const isPeriodButtonActive = () => {
    const endWeekDay = new Date(interval.end).getDay() - 1;
    const maxPeriodWeekDay = Math.max(...dayPeriods.flat());
    return !disabled && !!canAddNewPeriod() && maxPeriodWeekDay < endWeekDay;
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
      <ButtonAdd
        className="fr-my-2w"
        disabled={!isPeriodButtonActive()}
        onClick={() => add()}
      >
        Ajouter une période
      </ButtonAdd>
    </>
  );
};
