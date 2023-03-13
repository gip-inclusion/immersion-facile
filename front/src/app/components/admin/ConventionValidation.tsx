import { formatDistance } from "date-fns";
import { fr } from "date-fns/locale";
import React from "react";
import type { ConventionReadDto, ConventionStatus } from "shared";
import { ConventionValidationDetails } from "./ConventionValidationDetails";

const beforeAfterString = (date: string) => {
  const eventDate = new Date(date);
  const currentDate = new Date();

  return formatDistance(eventDate, currentDate, {
    addSuffix: true,
    locale: fr,
  });
};

const labelByStatus: Record<ConventionStatus, string> = {
  ACCEPTED_BY_COUNSELLOR: "[📗 DEMANDE ÉLIGIBLE]",
  ACCEPTED_BY_VALIDATOR: "[✅ DEMANDE VALIDÉE]",
  CANCELLED: "[🗑️ CONVENTION ANNULÉE PAR ADMIN]",
  DRAFT: "[📕 BROUILLON]",
  IN_REVIEW: "[📙 DEMANDE À ETUDIER]",
  PARTIALLY_SIGNED: "[✍️ Partiellement signée]",
  READY_TO_SIGN: "[📄 En cours de signature]",
  REJECTED: "[❌ DEMANDE REJETÉE]",
};

export interface ConventionValidationProps {
  convention: ConventionReadDto;
}

export const ConventionValidation = ({
  convention,
}: ConventionValidationProps) => {
  const {
    status,
    signatories: { beneficiary },
    businessName,
    dateStart,
    dateEnd: _,
  } = convention;

  const title =
    `${labelByStatus[status]} ` +
    `${beneficiary.lastName.toUpperCase()} ${
      beneficiary.firstName
    } chez ${businessName} ` +
    `${beforeAfterString(dateStart)}`;

  return (
    <>
      <h3>{title}</h3>
      {convention.statusJustification && (
        <p>Justification : {convention.statusJustification}</p>
      )}
      <ConventionValidationDetails convention={convention} />
    </>
  );
};
