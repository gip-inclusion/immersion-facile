import { parseISO } from "date-fns";
import React from "react";
import {
  calculateWeeklyHours,
  WeeklyImmersionTimetableDto,
} from "shared/src/schedule/ScheduleUtils";
import { DayCircle } from "./DayCircle";
import { HourIndicator } from "./HourIndicator";
import { getDayStatus } from "./utils/getDayStatus";

type WeeklyRowProperties = {
  weeklyCalendar: WeeklyImmersionTimetableDto;
  week: number;
  selectedIndex: number;
  disabled?: boolean;
  onChange: (index: number) => void;
};
const makeName = (isoStringDate: string) => {
  const date = parseISO(isoStringDate);
  return `${date.getDate()}/${date.getMonth() + 1}`;
};
export const WeeklyRow = ({
  weeklyCalendar,
  selectedIndex,
  disabled,
  onChange,
}: WeeklyRowProperties) => (
  <div className="flex">
    {weeklyCalendar.map((dayOfWeek) =>
      dayOfWeek.dailySchedule !== null ? (
        <DayCircle
          key={dayOfWeek.key.toString()}
          name={makeName(dayOfWeek.dailySchedule.date)}
          dayStatus={getDayStatus(
            dayOfWeek.dailySchedule,
            dayOfWeek.key,
            selectedIndex,
          )}
          disabled={disabled}
          onClick={() => onChange(dayOfWeek.key)}
        />
      ) : (
        <DayCircle
          key={dayOfWeek.key.toString()}
          name={`x`}
          dayStatus={"empty"}
          disabled={true}
        />
      ),
    )}
    <div className="flex w-full justify-center items-center">
      <HourIndicator hours={calculateWeeklyHours(weeklyCalendar)} />
    </div>
  </div>
);
