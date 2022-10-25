import React, { ReactNode } from "react";
import { Accordion } from "react-design-system/immersionFacile";
import {
  AppellationDto,
  Beneficiary,
  BeneficiaryRepresentative,
  calculateTotalImmersionHoursBetweenDate,
  calculateWeeklyHoursFromSchedule,
  ConventionReadDto,
  EstablishmentRepresentative,
  keys,
  EstablishmentTutor,
  path,
  prettyPrintSchedule,
} from "shared";
import { ConventionFormAccordionProps } from "./ConventionFormAccordion";
import { TextCell } from "./TextCell";

type ConventionField =
  | keyof ConventionReadDto
  | `establishmentTutor.${keyof EstablishmentTutor}`
  | `signatories.beneficiary.${keyof Beneficiary}`
  | `signatories.beneficiaryRepresentative.${keyof BeneficiaryRepresentative}`
  | `signatories.establishmentRepresentative.${keyof EstablishmentRepresentative}`;

type FieldsToLabel = Partial<Record<ConventionField, string>>;

const enterpriseFields: FieldsToLabel = {
  businessName: "Entreprise",
  siret: "Siret",
};

const agencyFields: FieldsToLabel = {
  id: "Id de la convention",
  agencyName: "Nom de la structure",
  dateValidation: "Date de validation",
};

const establishmentTutorFields: FieldsToLabel = {
  "establishmentTutor.email": "Mail du tuteur",
  "establishmentTutor.phone": "Numéro de téléphone du tuteur",
  "establishmentTutor.firstName": "Prénom",
  "establishmentTutor.lastName": "Nom",
  "establishmentTutor.job": "Poste",
};

const establishmentRepresentativeFields: FieldsToLabel = {
  "signatories.establishmentRepresentative.signedAt": "Signé",
  "signatories.establishmentRepresentative.email": "Mail de représentant",
  "signatories.establishmentRepresentative.phone":
    "Numéro de téléphone du représentant",
  "signatories.establishmentRepresentative.firstName": "Prénom",
  "signatories.establishmentRepresentative.lastName": "Nom",
};

const candidateFields: FieldsToLabel = {
  "signatories.beneficiary.signedAt": "Signé",
  "signatories.beneficiary.email": "Mail de demandeur",
  "signatories.beneficiary.phone": "Numéro de téléphone",
  "signatories.beneficiary.firstName": "Prénom",
  "signatories.beneficiary.lastName": "Nom",
  "signatories.beneficiary.emergencyContact": "Contact d'urgence",
  "signatories.beneficiary.emergencyContactPhone":
    "Numéro du contact d'urgence",
};

const beneficiaryRepresentativeFields: FieldsToLabel = {
  "signatories.beneficiaryRepresentative.signedAt": "Signé",
  "signatories.beneficiaryRepresentative.email": "Mail du réprésentant",
  "signatories.beneficiaryRepresentative.phone": "Numéro de téléphone",
  "signatories.beneficiaryRepresentative.firstName": "Prénom",
  "signatories.beneficiaryRepresentative.lastName": "Nom",
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
  { listTitle: "Bénéficiaire", fields: candidateFields },
  { listTitle: "Représentant légal", fields: beneficiaryRepresentativeFields },
  {
    listTitle: "Réprésentant de l'entreprise",
    fields: establishmentRepresentativeFields,
  },
  { listTitle: "Tuteur de l'entreprise", fields: establishmentTutorFields },
  { listTitle: "Entreprise", fields: enterpriseFields },
  { listTitle: "Immersion", fields: immersionFields },
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
    if (
      field === "signatories.beneficiary.signedAt" ||
      field === "signatories.establishmentRepresentative.signedAt" ||
      field === "signatories.beneficiaryRepresentative.signedAt"
    )
      return value ? "✅" : "❌";
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
