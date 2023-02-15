import { fr } from "@codegouvfr/react-dsfr";
import { useFormikContext } from "formik";
import React from "react";
import { ConventionDto } from "shared";
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
}: TotalWeeklyHoursIndicatorProps) => {
  const { values } = useFormikContext<ConventionDto>();
  return (
    <li className={fr.cx("fr-text--xs", "fr-my-auto")}>
      Semaine {week}: &nbsp;
      <HourIndicator
        hours={totalHours}
        birthdate={values.signatories.beneficiary.birthdate}
        internshipKind={values.internshipKind}
      />
    </li>
  );
};
