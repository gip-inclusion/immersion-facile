import React, { ReactNode } from "react";
import { ImmersionApplicationDto } from "shared/src/ImmersionApplication/ImmersionApplication.dto";
import { AppellationDto } from "shared/src/romeAndAppellationDtos/romeAndAppellation.dto";
import {
  calculateTotalImmersionHoursBetweenDate,
  calculateWeeklyHoursFromSchedule,
  prettyPrintSchedule,
} from "shared/src/ScheduleUtils";
import { keys } from "shared/src/utils";
import { Accordion } from "./Accordion";
import { FormAccordionProps } from "./FormAccordion";
import { TextCell } from "./TextCell";

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
  emergencyContact: "Contact d'urgence",
  emergencyContactPhone: "Numéro du contact d'urgence",
};

const immersionFields: FieldsToLabel = {
  dateSubmission: "Date de soumission",
  dateStart: "Début",
  dateEnd: "Fin",
  immersionAddress: "Adresse d'immersion",
  immersionAppellation: "Métier observé",
  immersionActivities: "Activités",
  immersionSkills: "Compétences évaluées",
  immersionObjective: "Objectif",
  schedule: "Horaires",
  individualProtection: "Protection individuelle",
  sanitaryPrevention: "Mesures de prévention sanitaire",
  workConditions: "Conditions de travail particulières",
};

type FieldsAndTitle = {
  listTitle: string;
  fields: FieldsToLabel;
};

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
    if (field === "immersionAppellation")
      return (value as AppellationDto).appellationLabel;
    if (typeof value === "string") return value;
    if (typeof value === "boolean") return value ? "✅" : "❌";
    return JSON.stringify(value);
  };

  return (
    <div className="static-application-container">
      {allFields.map(({ listTitle, fields }) => (
        <Accordion title={listTitle} key={listTitle}>
          {keys(fields).map(
            (field) =>
              immersionApplication[field] && (
                <TextCell
                  title={
                    /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
                    fields[field]!
                  }
                  contents={buildContent(field)}
                  key={field}
                />
              ),
          )}
          {listTitle === "Immersion" && (
            <>
              <TextCell
                title="Heures hebdomadaires"
                contents={calculateWeeklyHoursFromSchedule(
                  immersionApplication.schedule,
                )}
                key="weeklyHours"
              />
              <TextCell
                title="Nombre total d'heures"
                contents={calculateTotalImmersionHoursBetweenDate({
                  dateStart: immersionApplication.dateStart,
                  dateEnd: immersionApplication.dateEnd,
                  schedule: immersionApplication.schedule,
                })}
                key="totalHours"
              />
            </>
          )}
        </Accordion>
      ))}
    </div>
  );
};
