import { isSameDay } from "date-fns";
import type { DailyImmersionTimetableDto } from "shared";

export type DayStatus = "empty" | "hasTime" | "isSelected";

export const getDayStatus = (
  dailyTimetable: DailyImmersionTimetableDto,
  selectedDate: Date | undefined,
): DayStatus => {
  if (selectedDate && isSameDay(selectedDate, new Date(dailyTimetable.date))) {
    return "isSelected";
  }
  if (dailyTimetable.timePeriods && dailyTimetable.timePeriods.length > 0)
    return "hasTime";
  return "empty";
};
