import { TimePeriodsDto } from "shared";

export type DayStatus = "empty" | "hasTime" | "isSelected";

export const getDayStatus = (
  timePeriods: TimePeriodsDto,
  key: number,
  selectedIndex: number,
): DayStatus => {
  if (selectedIndex === key) return "isSelected";
  if (timePeriods.length > 0) return "hasTime";
  return "empty";
};
