import React from "react";
import { fr } from "@codegouvfr/react-dsfr";
import {
  ConventionReadDto,
  displayEmergencyContactInfos,
  prettyPrintSchedule,
  toDisplayedDate,
} from "shared";
import { ColField, FieldsAndTitle } from "./types";

export const signToBooleanDisplay = (value: string | undefined) =>
  value ? `✅ (${toDisplayedDate(new Date(value))})` : "❌";

const booleanToCheck = (value: boolean) => (value ? "✅" : "❌");

const renderSchedule = (convention: ConventionReadDto) => (
  <div style={{ whiteSpace: "pre" }}>
    {prettyPrintSchedule(convention.schedule, false, {
      start: new Date(convention.dateStart),
      end: new Date(convention.dateEnd),
    })}
  </div>
);

const renderSiret = (siret: string) => (
  <a
    href={`https://annuaire-entreprises.data.gouv.fr/etablissement/${siret}`}
    title={"Voir sur l'annuaire des entreprises"}
    target="_blank"
    rel="noreferrer"
  >
    {siret}
  </a>
);

const renderEmail = (email: string) => (
  <a href={`mailto:${email}`} title={email}>
    {email}
  </a>
);

const beneficiaryFields: ColField[] = [
  {
    key: "signatories.beneficiary.signedAt",
    colLabel: "Signé",
    value: (convention) =>
      signToBooleanDisplay(convention.signatories.beneficiary.signedAt),
  },
  {
    key: "signatories.beneficiary.email",
    colLabel: "Mail de demandeur",
    value: (convention) =>
      renderEmail(convention.signatories.beneficiary.email),
  },
  {
    key: "signatories.beneficiary.phone",
    colLabel: "Numéro de téléphone",
  },
  {
    key: "signatories.beneficiary.firstName",
    colLabel: "Prénom",
  },
  {
    key: "signatories.beneficiary.lastName",
    colLabel: "Nom",
  },
  {
    key: "additionnalInfos",
    colLabel: "Infos additionnelles",
    value: (convention) => (
      <span>
        <div className={fr.cx("fr-text--xs")}>
          Date de naissance :{" "}
          {toDisplayedDate(
            new Date(convention.signatories.beneficiary.birthdate),
          )}
        </div>
        <div className={fr.cx("fr-text--xs")}>
          Contact d'urgence :{" "}
          {displayEmergencyContactInfos({
            ...convention.signatories,
          })}
        </div>
        {convention.signatories.beneficiary.financiaryHelp && (
          <div className={fr.cx("fr-text--xs")}>
            Aide matérielle :{" "}
            {convention.signatories.beneficiary.financiaryHelp}
          </div>
        )}

        <div className={fr.cx("fr-text--xs")}>
          RQTH : {convention.signatories.beneficiary.isRqth ? "Oui" : "Non"}
        </div>
        {convention.internshipKind === "mini-stage-cci" && (
          <div className={fr.cx("fr-text--xs")}>
            Niveau d'études :{" "}
            {convention.signatories.beneficiary.levelOfEducation}
          </div>
        )}
      </span>
    ),
  },
];

const beneficiaryRepresentativeFields: ColField[] = [
  {
    key: "signatories.beneficiaryRepresentative.signedAt",
    colLabel: "Signé",
    value: (convention) =>
      signToBooleanDisplay(
        convention.signatories.beneficiaryRepresentative?.signedAt,
      ),
  },
  {
    key: "signatories.beneficiaryRepresentative.email",
    colLabel: "Mail du représentant",
    value: (convention) =>
      convention.signatories.beneficiaryRepresentative
        ? renderEmail(convention.signatories.beneficiaryRepresentative.email)
        : "",
  },
  {
    key: "signatories.beneficiaryRepresentative.phone",
    colLabel: "Numéro de téléphone",
  },
  {
    key: "signatories.beneficiaryRepresentative.firstName",
    colLabel: "Prénom",
  },
  {
    key: "signatories.beneficiaryRepresentative.lastName",
    colLabel: "Nom",
  },
  null,
];

const beneficiaryCurrentEmployerFields: ColField[] = [
  {
    key: "signatories.beneficiaryCurrentEmployer.signedAt",
    colLabel: "Signé",
    value: (convention) =>
      signToBooleanDisplay(
        convention.signatories.beneficiaryCurrentEmployer?.signedAt,
      ),
  },
  {
    key: "signatories.beneficiaryCurrentEmployer.email",
    colLabel: "Mail du représentant",
    value: (convention) =>
      convention.signatories.beneficiaryCurrentEmployer
        ? renderEmail(convention.signatories.beneficiaryCurrentEmployer.email)
        : "",
  },
  {
    key: "signatories.beneficiaryCurrentEmployer.phone",
    colLabel: "Numéro de téléphone",
  },
  {
    key: "signatories.beneficiaryCurrentEmployer.firstName",
    colLabel: "Prénom",
  },
  {
    key: "signatories.beneficiaryCurrentEmployer.lastName",
    colLabel: "Nom",
  },
  {
    key: "additionnalInfos",
    colLabel: "Infos additionnelles",
    value: (convention) =>
      convention.signatories.beneficiaryCurrentEmployer ? (
        <span>
          {renderSiret(
            convention.signatories.beneficiaryCurrentEmployer.businessSiret,
          )}
          <div className={fr.cx("fr-text--xs")}>
            Poste : {convention.signatories.beneficiaryCurrentEmployer.job}
          </div>
        </span>
      ) : (
        ""
      ),
  },
];

const establishmentRepresentativeFields: ColField[] = [
  {
    key: "signatories.establishmentRepresentative.signedAt",
    colLabel: "Signé",
    value: (convention) =>
      signToBooleanDisplay(
        convention.signatories.establishmentRepresentative.signedAt,
      ),
  },
  {
    key: "signatories.establishmentRepresentative.email",
    colLabel: "Mail du représentant",
    value: (convention) =>
      convention.signatories.establishmentRepresentative
        ? renderEmail(convention.signatories.establishmentRepresentative.email)
        : "",
  },
  {
    key: "signatories.establishmentRepresentative.phone",
    colLabel: "Numéro de téléphone",
  },
  {
    key: "signatories.establishmentRepresentative.firstName",
    colLabel: "Prénom",
  },
  {
    key: "signatories.establishmentRepresentative.lastName",
    colLabel: "Nom",
  },
  {
    key: "siret",
    colLabel: "Siret",
    value: (convention) => renderSiret(convention.siret),
  },
];

const enterpriseFields: ColField[] = [
  {
    key: "businessName",
    colLabel: "Entreprise",
  },
  {
    key: "siret",
    colLabel: "Siret",
    value: (convention) => renderSiret(convention.siret),
  },
];
const establishmentTutorFields: ColField[] = [
  {
    key: "establishmentTutor.email",
    colLabel: "Mail du tuteur",
    value: (convention) =>
      convention.establishmentTutor
        ? renderEmail(convention.establishmentTutor.email)
        : "",
  },
  {
    key: "establishmentTutor.phone",
    colLabel: "Numéro de téléphone du tuteur",
  },
  {
    key: "establishmentTutor.firstName",
    colLabel: "Prénom",
  },
  {
    key: "establishmentTutor.lastName",
    colLabel: "Prénom",
  },
  {
    key: "establishmentTutor.job",
    colLabel: "Poste",
  },
];

const agencyFields: ColField[] = [
  {
    key: "agencyName",
    colLabel: "Nom de la structure",
  },
  {
    key: "dateValidation",
    colLabel: "Date de validation",
    value: (convention) =>
      convention.dateValidation
        ? toDisplayedDate(new Date(convention.dateValidation))
        : "",
  },
];

const immersionPlaceDateFields: ColField[] = [
  {
    key: "dateSubmission",
    colLabel: "Date de soumission",
    value: (convention) => toDisplayedDate(new Date(convention.dateSubmission)),
  },
  {
    key: "dateStart",
    colLabel: "Début",
    value: (convention) => toDisplayedDate(new Date(convention.dateStart)),
  },
  {
    key: "dateEnd",
    colLabel: "Fin",
    value: (convention) => toDisplayedDate(new Date(convention.dateEnd)),
  },
  {
    key: "immersionAddress",
    colLabel: "Adresse d'immersion",
  },
  {
    key: "schedule",
    colLabel: "Horaires",
    value: (convention) => renderSchedule(convention),
  },
];

const immersionJobFields: ColField[] = [
  {
    key: "immersionAppellation",
    colLabel: "Métier observé",
    value: (convention) => convention.immersionAppellation.appellationLabel,
  },
  {
    key: "immersionActivities",
    colLabel: "Activités",
  },
  {
    key: "immersionSkills",
    colLabel: "Compétences évaluées",
  },
  {
    key: "immersionAddress",
    colLabel: "Adresse d'immersion",
  },
  {
    key: "immersionObjective",
    colLabel: "Objectif",
  },
  {
    key: "individualProtection",
    colLabel: "Protection individuelle",
    value: (convention) => booleanToCheck(convention.individualProtection),
  },
  {
    key: "sanitaryPrevention",
    colLabel: "Mesures de prévention sanitaire",
    value: (convention) => booleanToCheck(convention.sanitaryPrevention),
  },
  {
    key: "workConditions",
    colLabel: "Conditions de travail particulières",
  },
  {
    key: "businessAdvantages",
    colLabel: "Avantages proposés par l'entreprise",
  },
];

export const sections: FieldsAndTitle[] = [
  {
    listTitle: "Signataires",
    cols: [
      "",
      "Convention signée ?",
      "E-mail",
      "Téléphone",
      "Prénom",
      "Nom",
      "Infos additionnelles",
    ],
    rowFields: [
      {
        title: "Bénéficiaire",
        fields: beneficiaryFields,
      },
      {
        title: "Rep. légal bénéficiaire",
        fields: beneficiaryRepresentativeFields,
      },
      {
        title: "Employeur actuel bénéficiaire",
        fields: beneficiaryCurrentEmployerFields,
      },
      {
        title: "Rep. légal de l'entreprise",
        fields: establishmentRepresentativeFields,
      },
    ],
    additionalClasses: "fr-table--green-emeraude",
  },
  {
    listTitle: "Entreprise",
    cols: [
      "Entreprise",
      "Siret",
      "Email tuteur",
      "Téléphone tuteur",
      "Prénom",
      "Nom",
      "Poste",
    ],
    rowFields: [
      {
        fields: [...enterpriseFields, ...establishmentTutorFields],
      },
    ],
    additionalClasses: " fr-table--blue-cumulus",
  },
  {
    listTitle: "Structure",
    rowFields: [
      {
        fields: agencyFields,
      },
    ],
    additionalClasses: "fr-table--layout-fixed fr-table--blue-ecume",
  },
  {
    listTitle: "Infos sur l'immersion - date et lieu",
    rowFields: [
      {
        fields: immersionPlaceDateFields,
      },
    ],
    additionalClasses: "fr-table--green-archipel",
  },
  {
    listTitle: "Infos sur l'immersion - métier",
    rowFields: [
      {
        fields: immersionJobFields,
      },
    ],
    additionalClasses: "fr-table--green-archipel",
  },
];
