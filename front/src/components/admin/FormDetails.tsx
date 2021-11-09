import React, { Component, ReactNode } from "react";
import { keys } from "src/shared/utils";
import { Accordion } from "./Accordion";
import { TextCell } from "./TextCell";
import { FormAccordionProps } from "./FormAccordion";
import { ImmersionApplicationDto } from "src/shared/ImmersionApplicationDto";
import { prettyPrintSchedule } from "src/shared/ScheduleUtils";

type ImmersionField = keyof ImmersionApplicationDto;
type FieldsToLabel = Partial<Record<ImmersionField, string>>;

const enterpriseFields: FieldsToLabel = {
  businessName: "Entreprise",
  siret: "Siret",
};

const mentorFields: FieldsToLabel = {
  mentor: "Tuteur",
  mentorPhone: "Numéro de téléphone du tuteur",
  mentorEmail: "Mail du tuteur",
  enterpriseAccepted: "Signé",
};

const candidateFields: FieldsToLabel = {
  email: "Mail de demandeur",
  lastName: "Nom",
  firstName: "Prénom",
  phone: "Numéro de téléphone",
  beneficiaryAccepted: "Signé",
};

const immersionFields: FieldsToLabel = {
  dateSubmission: "Date de soumission",
  dateStart: "Début",
  dateEnd: "Fin",
  immersionAddress: "Adresse d'immersion",
  immersionProfession: "Métier observé",
  immersionActivities: "Activités",
  immersionObjective: "Objectif",
  schedule: "Horaires",
  individualProtection: "Protection individuelle",
  sanitaryPrevention: "Mesures de prévention sanitaire",
};

type FieldsAndTitle = { listTitle: string; fields: FieldsToLabel };

const allFields: FieldsAndTitle[] = [
  { listTitle: "Immersion", fields: immersionFields },
  { listTitle: "Bénéficiaire", fields: candidateFields },
  { listTitle: "Entreprise", fields: enterpriseFields },
  { listTitle: "Tuteur", fields: mentorFields },
];

export const FormDetails = ({ immersionApplication }: FormAccordionProps) => {
  const scheduleText = immersionApplication.legacySchedule
    ? immersionApplication.legacySchedule.description
    : prettyPrintSchedule(immersionApplication.schedule);

  const buildContent = (field: ImmersionField): ReactNode => {
    const value = immersionApplication[field];
    if (field === "schedule")
      return <div style={{ whiteSpace: "pre" }}>{scheduleText}</div>;
    if (field === "sanitaryPrevention") {
      return value
        ? immersionApplication.sanitaryPreventionDescription ?? "✅"
        : "❌";
    }
    if (typeof value === "string") return value;
    if (typeof value === "boolean") return value ? "✅" : "❌";
    return JSON.stringify(value);
  };

  return (
    <div className="static-application-container">
      {allFields.map(({ listTitle, fields }, index) => (
        <Accordion title={listTitle} key={listTitle}>
          {keys(fields).map((field) => (
            <TextCell
              title={fields[field]!}
              contents={buildContent(field)}
              key={field}
            />
          ))}
        </Accordion>
      ))}
    </div>
  );
};
