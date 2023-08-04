import React from "react";
import { fr } from "@codegouvfr/react-dsfr";
import {
  DailyScheduleDto,
  DateIntervalDto,
  makeImmersionTimetable,
} from "shared";
import { DayCircle } from "./DayCircle";
import { WeeklyRow } from "./WeeklyRow";

type DayPickerProps = {
  complexSchedule: DailyScheduleDto[];
  interval: DateIntervalDto;
  selectedDate: Date | undefined;
  onChange: (date: Date) => void;
  disabled?: boolean;
};

export const DayPicker = ({
  complexSchedule,
  interval,
  selectedDate,
  onChange,
  disabled,
}: DayPickerProps) => (
  <>
    <div className={fr.cx("fr-grid-row", "fr-mt-1w")}>
      {["L", "M", "M", "J", "V", "S", "D"].map((name) => (
        <DayCircle
          key={"legend-" + name}
          name={name}
          dayStatus={"empty"}
          disabled={true}
        />
      ))}
      <strong className={fr.cx("fr-text--xs", "fr-my-auto", "fr-ml-2w")}>
        total t/sem
      </strong>
    </div>
    {makeImmersionTimetable(complexSchedule, interval).map(
      (weeklyCalendar, weekIndex) => (
        <WeeklyRow
          key={`week-${(weekIndex + 1).toString()}`}
          weeklyCalendar={weeklyCalendar}
          selectedDate={selectedDate}
          disabled={disabled}
          onChange={onChange}
        />
      ),
    )}
  </>
);
