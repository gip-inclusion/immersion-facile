import React from "react";
import { maxPermittedHoursPerWeek } from "shared";
import { formatHoursString } from "./TotaWeeklylHoursIndicator";

export const HourIndicator = ({ hours }: HourIndicatorProperties) => (
  <span
    className={`${
      hours <= maxPermittedHoursPerWeek ? "fr-valid-text" : "fr-error-text"
    } fr-mt-0  fr-ml-2w`}
  >
    {formatHoursString(hours)}
  </span>
);

type HourIndicatorProperties = {
  hours: number;
};
