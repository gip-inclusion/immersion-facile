import { DailyScheduleDto } from "shared/src/schedule/ScheduleSchema";

export type DayStatus = "empty" | "hasTime" | "isSelected";

export const getDayStatus = (
  dailySchedule: DailyScheduleDto,
  key: number,
  selectedIndex: number,
): DayStatus => {
  if (selectedIndex === key) return "isSelected";
  if (dailySchedule.timePeriods.length > 0) return "hasTime";
  return "empty";
};
