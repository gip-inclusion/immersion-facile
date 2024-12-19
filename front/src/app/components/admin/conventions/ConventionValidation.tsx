import { fr } from "@codegouvfr/react-dsfr";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { formatDistance } from "date-fns";
import { fr as french } from "date-fns/locale";
import React from "react";
import {
  ConventionRenewedInformations,
  ConventionSummary,
} from "react-design-system";
import {
  ConventionReadDto,
  isConventionRenewed,
  toDisplayedDate,
} from "shared";
import { labelAndSeverityByStatus } from "src/app/contents/convention/labelAndSeverityByStatus";
import { useStyles } from "tss-react/dsfr";
import { makeConventionSections } from "../../../contents/convention/conventionSummary.helpers";

const beforeAfterString = (date: string) => {
  const eventDate = new Date(date);
  const currentDate = new Date();

  return formatDistance(eventDate, currentDate, {
    addSuffix: true,
    locale: french,
  });
};

export interface ConventionValidationProps {
  convention: ConventionReadDto;
}

export const ConventionValidation = ({
  convention,
}: ConventionValidationProps) => {
  const { cx } = useStyles();

  const {
    status,
    signatories: { beneficiary },
    businessName,
    dateStart,
    dateEnd: _,
  } = convention;

  const title = `${beneficiary.lastName.toUpperCase()} ${
    beneficiary.firstName
  } chez ${businessName} ${beforeAfterString(dateStart)}`;

  return (
    <>
      <Badge
        className={cx(
          fr.cx("fr-mb-3w"),
          labelAndSeverityByStatus[status].color,
        )}
      >
        {labelAndSeverityByStatus[status].label}
      </Badge>
      <h3>{title}</h3>
      {convention.statusJustification && (
        <p>Justification : {convention.statusJustification}</p>
      )}
      {isConventionRenewed(convention) && (
        <ConventionRenewedInformations renewed={convention.renewed} />
      )}
      <ConventionSummary
        submittedAt={toDisplayedDate({
          date: new Date(convention.dateSubmission),
        })}
        summary={makeConventionSections(convention)}
        conventionId={convention.id}
      />
    </>
  );
};
