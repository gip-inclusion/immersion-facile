import React, { ReactNode } from "react";
import { Accordion } from "react-design-system/immersionFacile";
import {
  Beneficiary,
  ConventionReadDto,
  Mentor,
} from "shared/src/convention/convention.dto";
import { path } from "shared/src/ramdaExtensions/path";
import { AppellationDto } from "shared/src/romeAndAppellationDtos/romeAndAppellation.dto";
import {
  calculateTotalImmersionHoursBetweenDate,
  calculateWeeklyHoursFromSchedule,
  prettyPrintSchedule,
} from "shared/src/schedule/ScheduleUtils";
import { keys } from "shared/src/utils";
import { ConventionFormAccordionProps } from "./ConventionFormAccordion";
import { TextCell } from "./TextCell";

type ConventionField =
  | keyof ConventionReadDto
  | `signatories.beneficiary.${keyof Beneficiary}`
  | `signatories.mentor.${keyof Mentor}`;

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
  "signatories.mentor.firstName": "Tuteur",
  "signatories.mentor.phone": "Numéro de téléphone du tuteur",
  "signatories.mentor.email": "Mail du tuteur",
  "signatories.mentor.signedAt": "Signé",
};

const candidateFields: FieldsToLabel = {
  "signatories.beneficiary.email": "Mail de demandeur",
  "signatories.beneficiary.lastName": "Nom",
  "signatories.beneficiary.firstName": "Prénom",
  "signatories.beneficiary.phone": "Numéro de téléphone",
  "signatories.beneficiary.signedAt": "Signé",
  "signatories.beneficiary.emergencyContact": "Contact d'urgence",
  "signatories.beneficiary.emergencyContactPhone":
    "Numéro du contact d'urgence",
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
    const value = path(field, convention);
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
              path(field, convention) && (
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
