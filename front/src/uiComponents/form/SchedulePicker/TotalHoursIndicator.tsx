import React from "react";

const maxPermittedHours = 35;

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

type TotalHoursIndicatorProps = {
  totalHours: number;
};

export const TotalHoursIndicator = ({
  totalHours,
}: TotalHoursIndicatorProps) => {
  const normalColor = "#1F8D49";
  const badColor = "#E10600";
  return (
    <p>
      Total hebdomadaire : &nbsp;
      <span
        style={{
          color: totalHours <= maxPermittedHours ? normalColor : badColor,
        }}
      >
        {formatHoursString(totalHours)}
      </span>
    </p>
  );
};
