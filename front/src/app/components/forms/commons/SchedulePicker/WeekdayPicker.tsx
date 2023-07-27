import React from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { useStyles } from "tss-react/dsfr";
import {
  DateIntervalDto,
  removeAtIndex,
  SelectedDaysOfTheWeekDto,
  WeekdayNumber,
} from "shared";
import { DayCircle } from "./DayCircle";

type WeekdayPickerProps = {
  name: string;
  onValueChange: (selectedDays: SelectedDaysOfTheWeekDto) => void;
  selectedDays: SelectedDaysOfTheWeekDto;
  disabled?: boolean;
  interval: DateIntervalDto;
  availableWeekDays: Array<string>;
};

export const WeekdayPicker = ({
  onValueChange,
  availableWeekDays,
  selectedDays,
}: WeekdayPickerProps) => {
  const { cx } = useStyles();
  const onDayClick = (day: WeekdayNumber) => {
    const newDaysSelected = selectedDays.includes(day)
      ? removeAtIndex(selectedDays, selectedDays.indexOf(day))
      : [...selectedDays, day];
    onValueChange(newDaysSelected);
  };

  return (
    <div className={cx("schedule-picker__section")}>
      <div
        className={cx(
          fr.cx("fr-grid-row", "fr-mb-2w"),
          "schedule-picker",
          "schedule-picker--regular",
        )}
      >
        {availableWeekDays.map((dayName, index) => (
          <DayCircle
            key={dayName + index}
            name={dayName}
            dayStatus={
              selectedDays.includes(index as WeekdayNumber)
                ? "hasTime"
                : "empty"
            }
            onClick={() => onDayClick(index as WeekdayNumber)}
          />
        ))}
      </div>
    </div>
  );
};
