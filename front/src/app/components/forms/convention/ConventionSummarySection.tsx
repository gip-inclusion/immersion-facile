import React, { ReactNode } from "react";
import {
  AddressDto,
  AgencyPublicDisplayDto,
  ConventionReadDto,
  DateIntervalDto,
  DotNestedKeys,
  prettyPrintSchedule,
  ScheduleDto,
  toDateString,
} from "shared";
import { FormConventionFieldsLabels } from "src/app/contents/forms/convention/formConvention";
import { FormFieldsObject } from "src/app/hooks/formContents.hooks";

type ConventionSummaryRow = [
  keyof ConventionReadDto | DotNestedKeys<ConventionReadDto> | string,
  ReactNode | undefined,
];

type SummarySection = {
  title: string;
} & (
  | {
      fields: ConventionSummaryRow[];
    }
  | {
      subfields: {
        subtitle: string;
        fields: ConventionSummaryRow[];
      }[];
    }
);

const filterEmptyRows = (row: ConventionSummaryRow) =>
  row[1] !== undefined && row[1] !== "";

const displayAddress = (address: AddressDto) =>
  `${address.streetNumberAndAddress} ${address.postcode} ${address.city}`;

const prettyPrintScheduleAsJSX = (
  schedule: ScheduleDto,
  interval: DateIntervalDto,
): JSX.Element => (
  <ul>
    {prettyPrintSchedule(schedule, interval)
      .split("\n")
      .map((line, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <li key={index}>{line}</li>
      ))}
  </ul>
);

export const makeSummarySections = (
  convention: ConventionReadDto,
  agency: AgencyPublicDisplayDto,
  fields: FormFieldsObject<FormConventionFieldsLabels>,
): SummarySection[] => [
  {
    title: "Signataires de la convention",
    subfields: [
      {
        subtitle: "Bénéficiaire",
        fields: signatoriesBeneficiary(convention, fields),
      },
      {
        subtitle: "Représentant du bénéficiaire",
        fields: signatoriesBeneficiaryRepresentative(convention, fields),
      },
      {
        subtitle: "Représentant de l'entreprise",
        fields: signatoriesEstablishementRepresentative(convention, fields),
      },
      {
        subtitle: "Employeur actuel",
        fields: signatoriesBeneficiaryCurrentEmployer(convention, fields),
      },
    ],
  },
  {
    title: "Structure d'accompagnement du candidat",
    fields: agencySummary(agency, fields),
  },
  {
    title: "Informations du candidat",
    fields: beneficiarySummary(convention, fields),
  },
  {
    title: "Informations de l'entreprise d'accueil",
    fields: establishmentSummary(convention, fields),
  },
  {
    title:
      convention.internshipKind === "immersion"
        ? "Conditions d'immersion"
        : "Conditions de stage",
    fields: immersionConditionsSummary(convention, fields),
  },
];

const signatoriesBeneficiaryCurrentEmployer = (
  convention: ConventionReadDto,
  fields: FormFieldsObject<FormConventionFieldsLabels>,
): ConventionSummaryRow[] =>
  (
    [
      [
        fields["signatories.beneficiaryCurrentEmployer.firstName"].label,
        convention.signatories.beneficiaryCurrentEmployer?.firstName,
      ],
      [
        fields["signatories.beneficiaryCurrentEmployer.lastName"].label,
        convention.signatories.beneficiaryCurrentEmployer?.lastName,
      ],
      [
        fields["signatories.beneficiaryCurrentEmployer.email"].label,
        convention.signatories.beneficiaryCurrentEmployer?.email,
      ],
      [
        fields["signatories.beneficiaryCurrentEmployer.phone"].label,
        convention.signatories.beneficiaryCurrentEmployer?.phone,
      ],
    ] satisfies ConventionSummaryRow[]
  ).filter(filterEmptyRows);

const signatoriesBeneficiaryRepresentative = (
  convention: ConventionReadDto,
  fields: FormFieldsObject<FormConventionFieldsLabels>,
): ConventionSummaryRow[] =>
  (
    [
      [
        fields["signatories.beneficiaryRepresentative.firstName"].label,
        convention.signatories.beneficiaryRepresentative?.firstName,
      ],
      [
        fields["signatories.beneficiaryRepresentative.lastName"].label,
        convention.signatories.beneficiaryRepresentative?.lastName,
      ],
      [
        fields["signatories.beneficiaryRepresentative.email"].label,
        convention.signatories.beneficiaryCurrentEmployer?.email,
      ],
      [
        fields["signatories.beneficiaryRepresentative.phone"].label,
        convention.signatories.beneficiaryCurrentEmployer?.phone,
      ],
    ] satisfies ConventionSummaryRow[]
  ).filter(filterEmptyRows);

const signatoriesEstablishementRepresentative = (
  convention: ConventionReadDto,
  fields: FormFieldsObject<FormConventionFieldsLabels>,
) =>
  (
    [
      [
        fields["signatories.establishmentRepresentative.firstName"].label,
        convention.signatories.establishmentRepresentative?.firstName,
      ],
      [
        fields["signatories.establishmentRepresentative.lastName"].label,
        convention.signatories.establishmentRepresentative?.lastName,
      ],
      [
        fields["signatories.establishmentRepresentative.email"].label,
        convention.signatories.establishmentRepresentative.email,
      ],
      [
        fields["signatories.establishmentRepresentative.phone"].label,
        convention.signatories.establishmentRepresentative.phone,
      ],
    ] satisfies ConventionSummaryRow[]
  ).filter(filterEmptyRows);

const signatoriesBeneficiary = (
  convention: ConventionReadDto,
  fields: FormFieldsObject<FormConventionFieldsLabels>,
) =>
  (
    [
      [
        fields["signatories.beneficiary.firstName"].label,
        convention.signatories.beneficiary.firstName,
      ],
      [
        fields["signatories.beneficiary.lastName"].label,
        convention.signatories.beneficiary.lastName,
      ],
      [
        fields["signatories.beneficiary.email"].label,
        convention.signatories.beneficiary.email,
      ],
      [
        fields["signatories.beneficiary.phone"].label,
        convention.signatories.beneficiary.phone,
      ],
    ] satisfies ConventionSummaryRow[]
  ).filter(filterEmptyRows);

const agencySummary = (
  agency: AgencyPublicDisplayDto,
  fields: FormFieldsObject<FormConventionFieldsLabels>,
): ConventionSummaryRow[] =>
  (
    [
      [
        fields["agencyId"].label,
        `${agency.name} (${displayAddress(agency.address)})`,
      ],
      [
        fields["agencyRefersTo"].label,
        agency.refersToAgency &&
          `${agency.refersToAgency.name} (${displayAddress(
            agency.refersToAgency.address,
          )})`,
      ],
    ] satisfies ConventionSummaryRow[]
  ).filter(filterEmptyRows);

const beneficiarySummary = (
  convention: ConventionReadDto,
  fields: FormFieldsObject<FormConventionFieldsLabels>,
) =>
  (
    [
      [
        fields["signatories.beneficiary.firstName"].label,
        convention.signatories.beneficiary.firstName,
      ],
      [
        fields["signatories.beneficiary.lastName"].label,
        convention.signatories.beneficiary.lastName,
      ],
      [
        fields["signatories.beneficiary.birthdate"].label,
        convention.signatories.beneficiary.birthdate,
      ],
      ...(convention.internshipKind === "mini-stage-cci"
        ? ([
            [
              fields["signatories.beneficiary.levelOfEducation"].label,
              convention.signatories.beneficiary.levelOfEducation,
            ],
            [
              fields["signatories.beneficiary.schoolName"].label,
              convention.signatories.beneficiary.schoolName,
            ],
            [
              fields["signatories.beneficiary.schoolPostcode"].label,
              convention.signatories.beneficiary.schoolPostcode,
            ],
          ] satisfies ConventionSummaryRow[])
        : []),
      [
        fields["signatories.beneficiary.financiaryHelp"].label,
        convention.signatories.beneficiary.financiaryHelp,
      ],
      [
        fields["signatories.beneficiary.emergencyContact"].label,
        convention.signatories.beneficiary?.emergencyContact,
      ],
      [
        fields["signatories.beneficiary.emergencyContactPhone"].label,
        convention.signatories.beneficiary?.emergencyContactPhone,
      ],
      [
        fields["signatories.beneficiary.emergencyContactEmail"].label,
        convention.signatories.beneficiary?.emergencyContactEmail,
      ],
      [
        fields["signatories.beneficiary.isRqth"].label,
        convention.signatories.beneficiary.isRqth ? "✅" : undefined,
      ],
    ] satisfies ConventionSummaryRow[]
  ).filter(filterEmptyRows);

const establishmentSummary = (
  convention: ConventionReadDto,
  fields: FormFieldsObject<FormConventionFieldsLabels>,
) =>
  (
    [
      [fields["businessName"].label, convention.businessName],
      [fields["siret"].label, convention.siret],
      [fields["immersionAddress"].label, convention.immersionAddress],
      [
        fields["establishmentTutor.firstName"].label,
        convention.establishmentTutor?.firstName,
      ],
      [
        fields["establishmentTutor.lastName"].label,
        convention.establishmentTutor?.lastName,
      ],
      [
        fields["establishmentTutor.email"].label,
        convention.establishmentTutor?.email,
      ],
      [
        fields["establishmentTutor.phone"].label,
        convention.establishmentTutor?.phone,
      ],
    ] satisfies ConventionSummaryRow[]
  ).filter(filterEmptyRows);

const immersionConditionsSummary = (
  convention: ConventionReadDto,
  fields: FormFieldsObject<FormConventionFieldsLabels>,
) =>
  (
    [
      [fields["dateStart"].label, toDateString(new Date(convention.dateStart))],
      [fields["dateEnd"].label, toDateString(new Date(convention.dateEnd))],
      [
        "Emploi du temps",
        prettyPrintScheduleAsJSX(convention.schedule, {
          start: new Date(convention.dateStart),
          end: new Date(convention.dateEnd),
        }),
      ],
      [
        fields["individualProtection"].label,
        convention.individualProtection ? "✅" : "❌",
      ],
      [
        fields["sanitaryPrevention"].label,
        convention.sanitaryPrevention ? "✅" : "❌",
      ],
      [
        fields["sanitaryPreventionDescription"].label,
        convention.sanitaryPreventionDescription,
      ],
      [fields["immersionObjective"].label, convention.immersionObjective],
      [
        fields["immersionAppellation"].label,
        convention.immersionAppellation.appellationLabel,
      ],
      [fields["workConditions"].label, convention.workConditions],
      [fields["immersionActivities"].label, convention.immersionActivities],
      [fields["businessAdvantages"].label, convention.businessAdvantages],
      [fields["immersionSkills"].label, convention.immersionSkills],
    ] satisfies ConventionSummaryRow[]
  ).filter(filterEmptyRows);
