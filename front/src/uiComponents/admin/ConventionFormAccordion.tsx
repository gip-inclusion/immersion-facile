import { formatDistance } from "date-fns";
import { fr } from "date-fns/locale";
import React from "react";
import type { ConventionReadDto, ConventionStatus } from "shared";
import { ConnventionFormDetails as ConventionFormDetails } from "./ConventionFormDetails";

const beforeAfterString = (date: string) => {
  const eventDate = new Date(date);
  const currentDate = new Date();

  return formatDistance(eventDate, currentDate, {
    addSuffix: true,
    locale: fr,
  });
};

export interface ConventionFormAccordionProps {
  convention: ConventionReadDto;
}

const getPrefix = (status: ConventionStatus) => {
  switch (status) {
    case "DRAFT":
      return "[📕 BROUILLON]";
    case "READY_TO_SIGN":
      return "[📄 Prête à etre signée]";
    case "PARTIALLY_SIGNED":
      return "[✍️ Partiellement signée]";
    case "REJECTED":
      return "[❌ DEMANDE REJETÉE]";
    case "IN_REVIEW":
      return "[📙 DEMANDE À ETUDIER]";
    case "ACCEPTED_BY_COUNSELLOR":
      return "[📗 DEMANDE ÉLIGIBLE]";
    case "ACCEPTED_BY_VALIDATOR":
      return "[✅ DEMANDE VALIDÉE]";
    case "CANCELLED":
      return "[🗑️ CONVENTION ANNULÉE PAR ADMIN]";
  }

  return "[⁉️ STATUS DE LA DEMANDE INDÉFINI]";
};

export const ConventionFormAccordion = ({
  convention,
}: ConventionFormAccordionProps) => {
  const {
    status,
    signatories: { beneficiary },
    businessName,
    dateStart,
    dateEnd: _,
  } = convention;

  const title =
    `${getPrefix(status)} ` +
    `${beneficiary.lastName.toUpperCase()} ${
      beneficiary.firstName
    } chez ${businessName} ` +
    `${beforeAfterString(dateStart)}`;

  return (
    <div style={{ padding: "0.5rem" }}>
      <h5 style={{ margin: "2rem 4rem" }}>{title}</h5>
      <ConventionFormDetails convention={convention} />
    </div>
  );
};
