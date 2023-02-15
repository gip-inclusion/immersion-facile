import { differenceInCalendarYears } from "date-fns";
import React from "react";
import {
  CCI_WEEKLY_LIMITED_SCHEDULE_AGE,
  CCI_WEEKLY_LIMITED_SCHEDULE_HOURS,
  InternshipKind,
  maxPermittedHoursPerWeek,
} from "shared";
import { formatHoursString } from "./TotaWeeklylHoursIndicator";

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
    differenceInCalendarYears(new Date(), new Date(birthdate)) <
      CCI_WEEKLY_LIMITED_SCHEDULE_AGE
      ? CCI_WEEKLY_LIMITED_SCHEDULE_HOURS
      : maxPermittedHoursPerWeek;
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
