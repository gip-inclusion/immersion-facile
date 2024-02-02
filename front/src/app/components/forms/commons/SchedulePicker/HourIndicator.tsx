import { addYears } from "date-fns";
import React from "react";
import {
  CCI_WEEKLY_LIMITED_SCHEDULE_AGE,
  CCI_WEEKLY_LIMITED_SCHEDULE_HOURS,
  CCI_WEEKLY_MAX_PERMITTED_HOURS,
  InternshipKind,
} from "shared";
import { formatHoursString } from "./TotalWeeklylHoursIndicator";

type HourIndicatorProperties = {
  hours: number;
  internshipKind: InternshipKind;
  birthdate: string;
};

export const HourIndicator = ({
  hours,
  birthdate,
  internshipKind,
}: HourIndicatorProperties) => {
  const maxAllowedHours =
    internshipKind === "mini-stage-cci" &&
    addYears(new Date(birthdate), CCI_WEEKLY_LIMITED_SCHEDULE_AGE) > new Date()
      ? CCI_WEEKLY_LIMITED_SCHEDULE_HOURS
      : CCI_WEEKLY_MAX_PERMITTED_HOURS;
  return (
    <span
      className={`${
        hours <= maxAllowedHours ? "fr-valid-text" : "fr-error-text"
      } fr-mt-0  fr-ml-2w`}
    >
      {formatHoursString(hours)}
    </span>
  );
};
