import React, { ReactNode } from "react";
import { ConventionReadDto } from "shared/src/convention/convention.dto";
import { AppellationDto } from "shared/src/romeAndAppellationDtos/romeAndAppellation.dto";
import {
  calculateTotalImmersionHoursBetweenDate,
  calculateWeeklyHoursFromSchedule,
  prettyPrintSchedule,
} from "shared/src/schedule/ScheduleUtils";
import { keys } from "shared/src/utils";
import { Accordion } from "react-design-system/immersionFacile";
import { ConventionFormAccordionProps } from "./ConventionFormAccordion";
import { TextCell } from "./TextCell";

type ConventionField = keyof ConventionReadDto;
type FieldsToLabel = Partial<Record<ConventionField, string>>;

const enterpriseFields: FieldsToLabel = {
  businessName: "Entreprise",
  siret: "Siret",
};

const agencyFields: FieldsToLabel = {
  id: "Id de l'agence",
  agencyName: "Nom de la structure",
  dateValidation: "Date de validation",
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
  { listTitle: "Agence", fields: agencyFields },
];

export const ConnventionFormDetails = ({
  convention,
}: ConventionFormAccordionProps) => {
  const buildContent = (field: ConventionField): ReactNode => {
    const value = convention[field];
    if (field === "schedule")
      return (
        <div style={{ whiteSpace: "pre" }}>
          {prettyPrintSchedule(convention.schedule)}
        </div>
      );
    if (field === "sanitaryPrevention") {
      return value ? convention.sanitaryPreventionDescription ?? "✅" : "❌";
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
              convention[field] && (
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
                  convention.schedule,
                ).join(", ")}
                key="weeklyHours"
              />
              <TextCell
                title="Nombre total d'heures"
                contents={calculateTotalImmersionHoursBetweenDate({
                  dateStart: convention.dateStart,
                  dateEnd: convention.dateEnd,
                  schedule: convention.schedule,
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
