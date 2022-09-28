import React from "react";
import { DailyScheduleDto } from "shared";
import { makeImmersionTimetable } from "shared";
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
  <div className="max-w-fit">
    <div className="flex">
      {["L", "M", "M", "J", "V", "S", "D"].map((name, index) => (
        <DayCircle
          key={name + index}
          name={name}
          dayStatus={"empty"}
          disabled={true}
        />
      ))}
      <div className="flex justify-center items-center text-center font-bold fr-text--xs schedule-picker__total-cell">
        total t/sem
      </div>
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
  </div>
);
