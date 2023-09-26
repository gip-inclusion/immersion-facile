import React from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { addDays, differenceInDays } from "date-fns";
import { uniq } from "ramda";
import { useStyles } from "tss-react/dsfr";
import {
  arrayFromNumber,
  DateIntervalDto,
  frenchDayMapping,
  InternshipKind,
  maximumCalendarDayByInternshipKind,
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
  internshipKind: InternshipKind;
};

export const WeekdayPicker = ({
  onValueChange,
  availableWeekDays,
  selectedDays,
  interval,
  internshipKind,
}: WeekdayPickerProps) => {
  const { cx } = useStyles();
  const onDayClick = (day: WeekdayNumber) => {
    const newDaysSelected = selectedDays.includes(day)
      ? removeAtIndex(selectedDays, selectedDays.indexOf(day))
      : [...selectedDays, day];
    onValueChange(newDaysSelected);
  };
  const isDayDisabled = (
    day: WeekdayNumber,
    { start, end }: DateIntervalDto,
  ) => {
    const startEndDiff = differenceInDays(end, start);
    if (startEndDiff > maximumCalendarDayByInternshipKind[internshipKind])
      return false;
    const uniqueWeekDaysOnInterval = uniq(
      arrayFromNumber(startEndDiff + 1).map(
        (dayIndex) =>
          frenchDayMapping(addDays(new Date(start), dayIndex).toISOString())
            .frenchDay,
      ),
    );
    return !uniqueWeekDaysOnInterval.includes(day);
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
            // eslint-disable-next-line react/no-array-index-key
            key={dayName + index}
            name={dayName}
            disabled={isDayDisabled(index as WeekdayNumber, interval)}
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
