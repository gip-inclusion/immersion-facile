import { addYears } from "date-fns";
import { AGES, type InternshipKind, WEEKLY_HOURS } from "shared";
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
  const maxAllowedHours = getMaxAllowedHours(internshipKind, birthdate);
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

const getMaxAllowedHours = (
  internshipKind: InternshipKind,
  birthdate: string,
) => {
  if (internshipKind === "immersion") return WEEKLY_HOURS.FORTY_EIGHT;
  return addYears(new Date(birthdate), AGES.SIXTEEN) > new Date()
    ? WEEKLY_HOURS.THIRTY
    : WEEKLY_HOURS.THIRTY_FIVE;
};
