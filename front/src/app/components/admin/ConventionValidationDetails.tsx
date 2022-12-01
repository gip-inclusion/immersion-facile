import React, { ReactNode, useRef, useState } from "react";
import { BeneficiaryCurrentEmployer, toDisplayedDate } from "shared";
import {
  AppellationDto,
  Beneficiary,
  BeneficiaryRepresentative,
  ConventionReadDto,
  EstablishmentRepresentative,
  keys,
  EstablishmentTutor,
  path,
  prettyPrintSchedule,
  isStringDate,
} from "shared";
import type { ConventionValidationProps } from "./ConventionValidation";

type ConventionField =
  | keyof ConventionReadDto
  | `establishmentTutor.${keyof EstablishmentTutor}`
  | `signatories.beneficiary.${keyof Beneficiary}`
  | `signatories.beneficiaryRepresentative.${keyof BeneficiaryRepresentative}`
  | `signatories.beneficiaryCurrentEmployer.${keyof BeneficiaryCurrentEmployer}`
  | `signatories.establishmentRepresentative.${keyof EstablishmentRepresentative}`;

type FieldsToLabel = Partial<Record<ConventionField, string>>;

type RowFields = {
  title?: string;
  fields: FieldsToLabel;
};

const enterpriseFields: FieldsToLabel = {
  businessName: "Entreprise",
  siret: "Siret",
};

const agencyFields: FieldsToLabel = {
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
  siret: "Siret",
};

const candidateFields: FieldsToLabel = {
  "signatories.beneficiary.signedAt": "Signé",
  "signatories.beneficiary.email": "Mail de demandeur",
  "signatories.beneficiary.phone": "Numéro de téléphone",
  "signatories.beneficiary.firstName": "Prénom",
  "signatories.beneficiary.lastName": "Nom",
};

const beneficiaryRepresentativeFields: FieldsToLabel = {
  "signatories.beneficiaryRepresentative.signedAt": "Signé",
  "signatories.beneficiaryRepresentative.email": "Mail du réprésentant",
  "signatories.beneficiaryRepresentative.phone": "Numéro de téléphone",
  "signatories.beneficiaryRepresentative.firstName": "Prénom",
  "signatories.beneficiaryRepresentative.lastName": "Nom",
};

const beneficiaryCurrentEmployerFields: FieldsToLabel = {
  "signatories.beneficiaryCurrentEmployer.signedAt": "Signé",
  "signatories.beneficiaryCurrentEmployer.email": "Mail de l'employeur",
  "signatories.beneficiaryCurrentEmployer.phone": "Numéro de téléphone",
  "signatories.beneficiaryCurrentEmployer.firstName": "Prénom",
  "signatories.beneficiaryCurrentEmployer.lastName": "Nom",
  "signatories.beneficiaryCurrentEmployer.businessSiret": "Siret",
  "signatories.beneficiaryCurrentEmployer.job": "Nom",
};

const immersionPlaceDateFields: FieldsToLabel = {
  dateSubmission: "Date de soumission",
  dateStart: "Début",
  dateEnd: "Fin",
  immersionAddress: "Adresse d'immersion",
  schedule: "Horaires",
};
const immersionJobFields: FieldsToLabel = {
  immersionAppellation: "Métier observé",
  immersionActivities: "Activités",
  immersionSkills: "Compétences évaluées",
  immersionObjective: "Objectif",

  individualProtection: "Protection individuelle",
  sanitaryPrevention: "Mesures de prévention sanitaire",
  workConditions: "Conditions de travail particulières",
};

type FieldsAndTitle = {
  listTitle: string;
  cols?: string[];
  rowFields: RowFields[];
  additionalClasses?: string;
};

const sections: FieldsAndTitle[] = [
  {
    listTitle: "Signataires",
    cols: [
      "",
      "Convention signée ?",
      "Email",
      "Téléphone",
      "Nom",
      "Prénom",
      "Siret",
      "Poste",
    ],
    rowFields: [
      {
        title: "Bénéficiaire",
        fields: candidateFields,
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
      "",
      "Entreprise",
      "Siret",
      "Email tuteur",
      "Téléphone tuteur",
      "Nom",
      "Prénom",
      "Poste",
    ],
    rowFields: [
      {
        title: "Entreprise",
        fields: {
          ...enterpriseFields,
          ...establishmentTutorFields,
        },
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
const cellStyles = {
  overflow: "hidden",
  whitespace: "nowrap",
};
export const ConventionValidationDetails = ({
  convention,
}: ConventionValidationProps) => {
  const copyButton = useRef<HTMLButtonElement>(null);
  const [isCopied, setIsCopied] = useState(false);

  const onCopyButtonClick = () => {
    navigator.clipboard
      .writeText(convention.id)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => {
          setIsCopied(false);
        }, 3_000);
      })
      // eslint-disable-next-line no-console
      .catch((error) => console.error(error));
  };

  return (
    <>
      <h4>
        Convention{" "}
        <span className="fr-badge fr-badge--success">{convention.id}</span>
        <button
          disabled={isCopied}
          ref={copyButton}
          onClick={onCopyButtonClick}
          className="fr-btn fr-btn--sm fr-icon-clipboard-fill fr-btn--tertiary-no-outline fr-btn--icon-left fr-ml-1w"
        >
          {isCopied ? "Copié !" : "Copier cet ID"}
        </button>
      </h4>
      {sections.map((list, index) => (
        <ConventionValidationSection
          key={index}
          convention={convention}
          list={list}
          index={index}
        />
      ))}
    </>
  );
};

const ConventionValidationSection = ({
  convention,
  list,
  index,
}: {
  convention: ConventionReadDto;
  list: FieldsAndTitle;
  index: number;
}) => {
  const [markedAsRead, setMarkedAsRead] = useState<boolean>(false);
  const buildContent = (field: ConventionField): ReactNode => {
    const value = path(field, convention);

    if (typeof value === "boolean") return value ? "✅" : "❌";
    if (field === "schedule") {
      return (
        <div style={{ whiteSpace: "pre" }}>
          {prettyPrintSchedule(convention.schedule, false)}
        </div>
      );
    }
    if (field === "sanitaryPrevention") {
      return value ? convention.sanitaryPreventionDescription ?? "✅" : "❌";
    }

    if (field === "immersionAppellation")
      return (value as AppellationDto).appellationLabel;
    if (
      field === "signatories.beneficiary.signedAt" ||
      field === "signatories.establishmentRepresentative.signedAt" ||
      field === "signatories.beneficiaryRepresentative.signedAt" ||
      field === "signatories.beneficiaryCurrentEmployer.signedAt"
    )
      return value
        ? `✅ (${toDisplayedDate(new Date(value as string))})`
        : "❌";
    if (field.toLowerCase().includes("siret")) {
      return (
        <a
          href={`https://annuaire-entreprises.data.gouv.fr/etablissement/${value}`}
          title={"Voir sur l'annuaire des entreprises"}
          target="_blank"
        >
          {value}
        </a>
      );
    }
    if (field.includes("email")) {
      return (
        <a href={`mailto:${value}`} title={value as string}>
          {value}
        </a>
      );
    }
    if (isStringDate(value as string)) {
      return toDisplayedDate(new Date(value as string));
    }
    if (typeof value === "string") return value;

    return JSON.stringify(value);
  };
  const renderRows = (rowFields: RowFields[]) => {
    const maxColsNumber = Math.max(
      ...rowFields.map((row) => keys(row.fields).length),
    );
    return rowFields
      .filter((row) => row.fields)
      .map((row, index) => {
        const formattedRows = Array.from(Array(maxColsNumber).keys()).map(
          (_slot, index) => keys(row.fields)[index] ?? null,
        );
        const hasRowData = !!formattedRows
          .map((field) => field && path(field, convention))
          .filter((field) => field).length;
        return (
          hasRowData && (
            <tr key={row.title ?? index}>
              {row.title && (
                <td style={cellStyles}>
                  <strong>{row.title}</strong>
                </td>
              )}

              {formattedRows.map((field, index) =>
                field && path(field, convention) ? (
                  <td key={field} style={cellStyles}>
                    {buildContent(field)}
                  </td>
                ) : (
                  <td key={index}></td>
                ),
              )}
            </tr>
          )
        );
      });
  };
  return (
    <div
      className={`fr-table fr-table--bordered ${list.additionalClasses ?? ""}`}
      key={list.listTitle}
    >
      <table>
        <caption
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          {list.listTitle}
          <div className="fr-toggle">
            <input
              type="checkbox"
              onChange={() => setMarkedAsRead((read) => !read)}
              className="fr-toggle__input"
              id={`fr-toggle__input-${index}`}
              checked={markedAsRead}
            />
            <label
              className="fr-toggle__label"
              htmlFor={`fr-toggle__input-${index}`}
            >
              {markedAsRead ? "Vérifier à nouveau" : "Marquer comme vu"}
            </label>
          </div>
        </caption>

        {!markedAsRead && (
          <>
            <thead>
              <tr>
                {list.cols &&
                  list.cols?.map((col, index) => (
                    <th key={index} scope="col">
                      {col}
                    </th>
                  ))}
                {!list.cols &&
                  list.rowFields[0] &&
                  keys(list.rowFields[0].fields).map((key) => (
                    <th key={key} scope="col">
                      {list.rowFields[0].fields[key]}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>{renderRows(list.rowFields)}</tbody>
          </>
        )}
      </table>
    </div>
  );
};
