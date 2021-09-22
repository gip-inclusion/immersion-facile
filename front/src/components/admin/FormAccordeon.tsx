import React, { Component } from "react";
import {
  DemandeImmersionDto,
  ApplicationStatus,
} from "src/shared/DemandeImmersionDto";
import { formatDistance, formatDuration, intervalToDuration } from "date-fns";
import { fr } from "date-fns/locale";
import { Accordeon } from "./Accordeon";
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

export interface FormAccordeonProps {
  data: DemandeImmersionDto;
}

const getPrefix = (status: ApplicationStatus) => {
  switch (status) {
    case "DRAFT":
      return "📕 BROUILLON";
    case "IN_REVIEW":
      return "📙";
    case "VALIDATED":
      return "✅";
  }
};

export const FormAccordeon = ({ data }: FormAccordeonProps) => {
  const title = () => {
    return (
      `${getPrefix(data.status)} ` +
      `${data.lastName.toUpperCase()} ${data.firstName} chez ${
        data.businessName
      } ` +
      `${beforeAfterString(data.dateStart)} (pendant ${durationDays(
        data.dateStart,
        data.dateEnd,
      )})`
    );
  };

  return (
    <Accordeon title={title()} key={data.id}>
      <FormDetails data={data} />
    </Accordeon>
  );
};
