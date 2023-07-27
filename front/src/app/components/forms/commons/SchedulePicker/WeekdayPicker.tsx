import React from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { useStyles } from "tss-react/dsfr";
import {
  DateIntervalDto,
  DayPeriodsDto,
  WeekdayNumber,
  WeekDayRangeSchemaDTO,
} from "shared";
import { WeekdayDropdown } from "./WeekdayDropdown";

type WeekdayPickerProps = {
  name: string;
  dayPeriods: DayPeriodsDto;
  onValueChange: (dayPeriods: DayPeriodsDto) => void;
  disabled?: boolean;
  interval: DateIntervalDto;
  maxDay: WeekdayNumber;
};

export const WeekdayPicker = ({
  name,
  dayPeriods,
  onValueChange,
  disabled,
  interval,
  maxDay,
}: WeekdayPickerProps) => {
  const { cx } = useStyles();
  const canAddNewPeriod = (): WeekDayRangeSchemaDTO | false => {
    if (dayPeriods.length === 0) return false;
    const lastPeriod = dayPeriods[dayPeriods.length - 1];
    const lastPeriodEnd = lastPeriod[1];
    const lastPeriodStart = maxDay - 1;
    return lastPeriodEnd < lastPeriodStart ? lastPeriod : false;
  };

  const add = () => {
    let start = 0;
    let end = maxDay - 1;
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
    <div className={cx("schedule-picker__section")}>
      {dayPeriods.length > 0 &&
        dayPeriods.map((dayRange, index) => {
          const onStartChange = (value: WeekdayNumber) => {
            dayRange[0] = value;
            onValueChange(dayPeriods);
          };
          const onEndChange = (value: WeekdayNumber) => {
            dayRange[1] = value;
            onValueChange(dayPeriods);
          };

          const remove = (index: number) => {
            dayPeriods.splice(index, 1);
            onValueChange(dayPeriods);
          };

          const isRemovable = index > 0;

          return (
            <div key={name + index}>
              <div className={cx("schedule-picker__row")}>
                <div className={cx("date-or-time-block")}>
                  <div>Du</div>
                  <WeekdayDropdown
                    name="du"
                    id={`weekday-dropdown-start-day-${index}`}
                    minDay={0}
                    maxDay={dayRange[1]}
                    selected={dayRange[0]}
                    onValueChange={(x) => onStartChange(x as WeekdayNumber)}
                    disabled={disabled}
                  />
                </div>

                <div className={cx("date-or-time-block")}>
                  <div>Au</div>
                  <WeekdayDropdown
                    name="du"
                    id={`weekday-dropdown-end-day-${index}`}
                    minDay={dayRange[0]}
                    maxDay={maxDay}
                    selected={dayRange[1]}
                    onValueChange={(x) => onEndChange(x as WeekdayNumber)}
                    disabled={disabled}
                  />
                </div>
                <Button
                  type="button"
                  iconId="fr-icon-delete-bin-line"
                  title="Supprimer"
                  disabled={disabled || !isRemovable}
                  onClick={() => remove(index)}
                />
              </div>
            </div>
          );
        })}

      <Button
        className={fr.cx("fr-my-2w")}
        type="button"
        iconId="fr-icon-add-line"
        title="Ajouter une période"
        disabled={!isPeriodButtonActive()}
        priority="secondary"
        onClick={() => add()}
      >
        Ajouter une période
      </Button>
    </div>
  );
};
