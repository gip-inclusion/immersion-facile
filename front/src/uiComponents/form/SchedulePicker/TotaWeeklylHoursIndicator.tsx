import React from "react";
import { HourIndicator } from "./HourIndicator";

// ex: Formats 16.5 to 16h30
export const formatHoursString = (hours: number) => {
  if (isNaN(hours)) {
    return "Erreur de saisie";
  }
  const fullHours = Math.floor(hours);
  const minutes = Math.round((hours - fullHours) * 60);
  const minutesString = (minutes < 10 ? "0" : "") + minutes.toString();
  return fullHours.toString() + "h" + minutesString;
};

type TotalWeeklyHoursIndicatorProps = {
  week: number;
  totalHours: number;
};

export const TotalWeeklyHoursIndicator = ({
  week,
  totalHours,
}: TotalWeeklyHoursIndicatorProps) => (
  <p>
    Total hebdomadaire semaine {week}: &nbsp;
    <HourIndicator hours={totalHours} />
  </p>
);
