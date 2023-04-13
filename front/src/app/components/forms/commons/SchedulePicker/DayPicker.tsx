import React from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { DailyScheduleDto, makeImmersionTimetable } from "shared";
import { DayCircle } from "./DayCircle";
import { WeeklyRow } from "./WeeklyRow";

type DayPickerProps = {
  complexSchedule: DailyScheduleDto[];
  selectedIndex: number;
  onChange: (index: number) => void;
  disabled?: boolean;
};

export const DayPicker = ({
  complexSchedule,
  selectedIndex,
  onChange,
  disabled,
}: DayPickerProps) => (
  <>
    <div className={fr.cx("fr-grid-row", "fr-mt-1w")}>
      {["L", "M", "M", "J", "V", "S", "D"].map((name, index) => (
        <DayCircle
          key={name + index}
          name={name}
          dayStatus={"empty"}
          disabled={true}
        />
      ))}
      <strong className={fr.cx("fr-text--xs", "fr-my-auto", "fr-ml-2w")}>
        total t/sem
      </strong>
    </div>
    {makeImmersionTimetable(complexSchedule).map((weeklyCalendar, index) => (
      <WeeklyRow
        week={index + 1}
        key={`week-${(index + 1).toString()}`}
        weeklyCalendar={weeklyCalendar}
        selectedIndex={selectedIndex}
        disabled={disabled}
        onChange={onChange}
      />
    ))}
  </>
);
