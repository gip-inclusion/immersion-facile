import { formatDistance } from "date-fns";
import { fr } from "date-fns/locale";
import React from "react";
import type {
  ConventionStatus,
  ConventionDto,
} from "shared/src/convention/convention.dto";
import { FormDetails } from "./FormDetails";

const beforeAfterString = (date: string) => {
  const eventDate = new Date(date);
  const currentDate = new Date();

  return formatDistance(eventDate, currentDate, {
    addSuffix: true,
    locale: fr,
  });
};

export interface FormAccordionProps {
  convention: ConventionDto;
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
    case "VALIDATED":
      return "[👩‍💼 ENVOI DE CONVENTION VALIDÉE PAR ADMIN]";
    case "CANCELLED":
      return "[🗑️ CONVENTION ANNULÉE PAR ADMIN]";
  }

  return "[⁉️ STATUS DE LA DEMANDE INDÉFINI]";
};

export const FormAccordion = ({ convention }: FormAccordionProps) => {
  const {
    status,
    lastName,
    firstName,
    businessName,
    dateStart,
    dateEnd: _,
  } = convention;

  const title =
    `${getPrefix(status)} ` +
    `${lastName.toUpperCase()} ${firstName} chez ${businessName} ` +
    `${beforeAfterString(dateStart)}`;

  return (
    <div style={{ padding: "0.5rem" }}>
      <h5 style={{ margin: "2rem 4rem" }}>{title}</h5>
      <FormDetails convention={convention} />
    </div>
  );
};
