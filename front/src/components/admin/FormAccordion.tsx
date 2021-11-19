import React, { Component } from "react";
import type {
  ImmersionApplicationDto,
  ApplicationStatus,
} from "src/shared/ImmersionApplicationDto";
import { formatDistance, formatDuration, intervalToDuration } from "date-fns";
import { fr } from "date-fns/locale";
import { Accordion } from "./Accordion";
import { FormDetails } from "./FormDetails";

const beforeAfterString = (date: string) => {
  const eventDate = new Date(date);
  const currentDate = new Date();

  return formatDistance(eventDate, currentDate, {
    addSuffix: true,
    locale: fr,
  });
};

const durationDays = (dateStart: string, dateEnd: string) => {
  let d = intervalToDuration({
    start: new Date(dateStart),
    end: new Date(dateEnd),
  });

  return formatDuration(d, { locale: fr });
};

export interface FormAccordionProps {
  immersionApplication: ImmersionApplicationDto;
}

const getPrefix = (status: ApplicationStatus) => {
  switch (status) {
    case "DRAFT":
      return "[📕 BROUILLON]";
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
  }

  return "[⁉️ STATUS DE LA DEMANDE INDÉFINI]";
};

export const FormAccordion = ({ immersionApplication }: FormAccordionProps) => {
  const { status, lastName, firstName, businessName, dateStart, dateEnd } =
    immersionApplication;

  const title =
    `${getPrefix(status)} ` +
    `${lastName.toUpperCase()} ${firstName} chez ${businessName} ` +
    `${beforeAfterString(dateStart)} (pendant ${durationDays(
      dateStart,
      dateEnd,
    )})`;

  return (
    <div style={{ padding: "0.5rem" }}>
      <h5 style={{ margin: "2rem 4rem" }}>{title}</h5>
      <FormDetails immersionApplication={immersionApplication} />
    </div>
  );
};
