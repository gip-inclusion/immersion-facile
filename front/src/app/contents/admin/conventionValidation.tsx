import { fr } from "@codegouvfr/react-dsfr";
import React from "react";
import {
  ConventionReadDto,
  addressDtoToString,
  displayEmergencyContactInfos,
  makeSiretDescriptionLink,
  prettyPrintSchedule,
  toDisplayedDate,
} from "shared";
import { useCopyButton } from "src/app/hooks/useCopyButton";
import { P, match } from "ts-pattern";
import { ColField, FieldsAndTitle } from "./types";

export const signToBooleanDisplay = (value: string | undefined) =>
  value ? `✅ (${toDisplayedDate({ date: new Date(value) })})` : "❌";

const booleanToCheck = (value: boolean) => (value ? "✅" : "❌");

const renderSchedule = (convention: ConventionReadDto) => (
  <div style={{ whiteSpace: "pre" }}>
    {prettyPrintSchedule(
      convention.schedule,
      {
        start: new Date(convention.dateStart),
        end: new Date(convention.dateEnd),
      },
      false,
    )}
  </div>
);

const renderSiret = (siret: string) => (
  <a
    href={makeSiretDescriptionLink(siret)}
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

const CopyButton = ({
  textLabel,
  value,
}: { textLabel: string; value: string }) => {
  const { copyButtonIsDisabled, copyButtonLabel, onCopyButtonClick } =
    useCopyButton(textLabel);
  return (
    <button
      onClick={() => onCopyButtonClick(value)}
      disabled={copyButtonIsDisabled}
      className={fr.cx(
        "fr-btn",
        "fr-btn--sm",
        "fr-icon-clipboard-fill",
        "fr-btn--tertiary-no-outline",
        "fr-btn--icon-left",
        "fr-ml-1w",
      )}
      type="button"
    >
      {copyButtonLabel}
    </button>
  );
};

const beneficiaryFields: ColField[] = [
  {
    key: "signatories.beneficiary.signedAt",
    colLabel: "Signé",
    getValue: (convention) =>
      signToBooleanDisplay(convention.signatories.beneficiary.signedAt),
  },
  {
    key: "signatories.beneficiary.email",
    colLabel: "Mail de demandeur",
    getValue: (convention) =>
      renderEmail(convention.signatories.beneficiary.email),
    copyButton: (convention) => (
      <CopyButton
        textLabel=""
        value={convention.signatories.beneficiary.email}
      />
    ),
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
    getValue: (convention) => (
      <span>
        <div className={fr.cx("fr-text--xs")}>
          Date de naissance :{" "}
          {toDisplayedDate({
            date: new Date(convention.signatories.beneficiary.birthdate),
          })}
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
            Adresse du candidat :{" "}
            {convention.signatories.beneficiary.address &&
              addressDtoToString(convention.signatories.beneficiary.address)}
            <br />
            Niveau d'études :{" "}
            {convention.signatories.beneficiary.levelOfEducation}
            <br />
            Établissement : {convention.signatories.beneficiary.schoolName}
            <br />
            Code postal de l'établissement :{" "}
            {convention.signatories.beneficiary.schoolPostcode}
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
    getValue: (convention) =>
      signToBooleanDisplay(
        convention.signatories.beneficiaryRepresentative?.signedAt,
      ),
  },
  {
    key: "signatories.beneficiaryRepresentative.email",
    colLabel: "Mail du représentant",
    getValue: (convention) =>
      convention.signatories.beneficiaryRepresentative
        ? renderEmail(convention.signatories.beneficiaryRepresentative.email)
        : "",
    copyButton: (convention) =>
      convention.signatories.beneficiaryRepresentative ? (
        <CopyButton
          textLabel=""
          value={convention.signatories.beneficiaryRepresentative.email}
        />
      ) : null,
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
    getValue: (convention) =>
      signToBooleanDisplay(
        convention.signatories.beneficiaryCurrentEmployer?.signedAt,
      ),
  },
  {
    key: "signatories.beneficiaryCurrentEmployer.email",
    colLabel: "Mail du représentant",
    getValue: (convention) =>
      convention.signatories.beneficiaryCurrentEmployer
        ? renderEmail(convention.signatories.beneficiaryCurrentEmployer.email)
        : "",
    copyButton: (convention) =>
      convention.signatories.beneficiaryCurrentEmployer ? (
        <CopyButton
          textLabel=""
          value={convention.signatories.beneficiaryCurrentEmployer.email}
        />
      ) : (
        ""
      ),
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
    getValue: (convention) =>
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
    getValue: (convention) =>
      signToBooleanDisplay(
        convention.signatories.establishmentRepresentative.signedAt,
      ),
  },
  {
    key: "signatories.establishmentRepresentative.email",
    colLabel: "Mail du représentant",
    getValue: (convention) =>
      convention.signatories.establishmentRepresentative
        ? renderEmail(convention.signatories.establishmentRepresentative.email)
        : "",
    copyButton: (convention) => (
      <CopyButton
        textLabel=""
        value={convention.signatories.establishmentRepresentative.email}
      />
    ),
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
    getValue: (convention) => renderSiret(convention.siret),
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
    getValue: (convention) => renderSiret(convention.siret),
  },
];
const establishmentTutorFields: ColField[] = [
  {
    key: "establishmentTutor.email",
    colLabel: "Mail du tuteur",
    getValue: (convention) =>
      convention.establishmentTutor
        ? renderEmail(convention.establishmentTutor.email)
        : "",
    copyButton: (convention) => (
      <CopyButton textLabel="" value={convention.establishmentTutor.email} />
    ),
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
    copyButton: (convention) => (
      <CopyButton textLabel="" value={convention.agencyName} />
    ),
    getValue: (convention) => convention.agencyName,
  },
  {
    key: "dateValidation",
    colLabel: "Date de validation",
    getValue: (convention) =>
      match({
        agencyRefersTo: convention.agencyRefersTo,
        dateValidation: convention.dateValidation,
        dateApproval: convention.dateApproval,
      })
        .with(
          { agencyRefersTo: P.not(P.nullish), dateApproval: P.not(P.nullish) },
          ({ dateApproval }) =>
            toDisplayedDate({ date: new Date(dateApproval) }),
        )
        .with(
          { agencyRefersTo: P.not(P.nullish), dateApproval: undefined },
          () => "",
        )
        .with({ dateValidation: undefined }, () => "")
        .with({ dateValidation: P.string }, ({ dateValidation }) =>
          toDisplayedDate({ date: new Date(dateValidation) }),
        )
        .exhaustive(),
  },
];

const agencyRefersToFields: ColField[] = [
  {
    key: "agencyRefersTo.name",
    colLabel: "Nom de la structure",
  },
  {
    key: "dateValidation",
    colLabel: "Date de validation",
    getValue: (convention) =>
      convention.dateValidation && convention.agencyRefersTo?.id
        ? toDisplayedDate({ date: new Date(convention.dateValidation) })
        : "",
  },
];

const immersionPlaceDateFields: ColField[] = [
  {
    key: "dateSubmission",
    colLabel: "Date de soumission",
    getValue: (convention) =>
      toDisplayedDate({ date: new Date(convention.dateSubmission) }),
  },
  {
    key: "dateStart",
    colLabel: "Début",
    getValue: (convention) =>
      toDisplayedDate({ date: new Date(convention.dateStart) }),
  },
  {
    key: "dateEnd",
    colLabel: "Fin",
    getValue: (convention) =>
      toDisplayedDate({ date: new Date(convention.dateEnd) }),
  },
  {
    key: "immersionAddress",
    colLabel: "Adresse d'immersion",
  },
  {
    key: "schedule",
    colLabel: "Horaires",
    getValue: (convention) => renderSchedule(convention),
  },
];

const immersionJobFields: ColField[] = [
  {
    key: "immersionAppellation",
    colLabel: "Métier observé",
    getValue: (convention) => convention.immersionAppellation.appellationLabel,
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
    getValue: (convention) => booleanToCheck(convention.individualProtection),
  },
  {
    key: "sanitaryPrevention",
    colLabel: "Mesures de prévention sanitaire",
    getValue: (convention) => booleanToCheck(convention.sanitaryPrevention),
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
      {
        fields: agencyRefersToFields,
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
