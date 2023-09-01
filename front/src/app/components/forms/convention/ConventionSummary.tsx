import React, { ReactNode, useEffect, useState } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { Table } from "@codegouvfr/react-dsfr/Table";
import { useStyles } from "tss-react/dsfr";
import {
  AgencyPublicDisplayDto,
  ConventionReadDto,
  DateIntervalDto,
  DotNestedKeys,
  prettyPrintSchedule,
  ScheduleDto,
  toDateString,
} from "shared";
import { Loader } from "react-design-system";
import { formConventionFieldsLabels } from "src/app/contents/forms/convention/formConvention";
import { useFormContents } from "src/app/hooks/formContents.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { useScrollToTop } from "src/app/hooks/window.hooks";
import { agencyGateway } from "src/config/dependencies";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";

type ConventionSummaryRow = [
  keyof ConventionReadDto | DotNestedKeys<ConventionReadDto> | string,
  ReactNode | undefined,
];

const filterEmptyRows = (row: ConventionSummaryRow) =>
  row[1] !== undefined && row[1] !== "";

const signatoriesSummary = (convention: ConventionReadDto) => {
  const { getFormFields } = useFormContents(
    formConventionFieldsLabels(convention.internshipKind),
  );
  const fields = getFormFields();
  const rows: ConventionSummaryRow[] = [
    [
      fields["signatories.beneficiary.email"].label,
      convention.signatories.beneficiary.email,
    ],
    [
      fields["signatories.beneficiary.phone"].label,
      convention.signatories.beneficiary.phone,
    ],
    [
      fields["signatories.establishmentRepresentative.email"].label,
      convention.signatories.establishmentRepresentative.email,
    ],
    [
      fields["signatories.establishmentRepresentative.phone"].label,
      convention.signatories.establishmentRepresentative.phone,
    ],
    [
      fields["signatories.beneficiaryRepresentative.email"].label,
      convention.signatories.beneficiaryRepresentative?.email,
    ],
    [
      fields["signatories.beneficiaryRepresentative.phone"].label,
      convention.signatories.beneficiaryRepresentative?.phone,
    ],
    [
      fields["signatories.beneficiaryCurrentEmployer.email"].label,
      convention.signatories.beneficiaryCurrentEmployer?.email,
    ],
    [
      fields["signatories.beneficiaryCurrentEmployer.phone"].label,
      convention.signatories.beneficiaryCurrentEmployer?.phone,
    ],
    [
      fields["establishmentTutor.email"].label,
      convention.establishmentTutor?.email,
    ],
    [
      fields["establishmentTutor.phone"].label,
      convention.establishmentTutor?.phone,
    ],
  ];
  return rows.filter(filterEmptyRows);
};

const agencySummary = (
  convention: ConventionReadDto,
  agency: AgencyPublicDisplayDto,
) => {
  const { getFormFields } = useFormContents(
    formConventionFieldsLabels(convention.internshipKind),
  );
  const fields = getFormFields();
  const rows: ConventionSummaryRow[] = [
    [
      fields["agencyId"].label,
      `${agency.name} (${agency.address.streetNumberAndAddress} ${agency.address.postcode} ${agency.address.city})`,
    ],
  ];
  return rows.filter(filterEmptyRows);
};

const beneficiarySummary = (convention: ConventionReadDto) => {
  const { getFormFields } = useFormContents(
    formConventionFieldsLabels(convention.internshipKind),
  );
  const fields = getFormFields();
  const levelOfEducationRowInArray: ConventionSummaryRow[] =
    convention.internshipKind === "mini-stage-cci"
      ? [
          [
            fields["signatories.beneficiary.levelOfEducation"].label,
            convention.signatories.beneficiary.levelOfEducation,
          ],
        ]
      : [];

  const rows: ConventionSummaryRow[] = [
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
    ...levelOfEducationRowInArray,
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
      fields["signatories.beneficiaryCurrentEmployer.firstName"].label,
      convention.signatories.beneficiaryCurrentEmployer?.firstName,
    ],
    [
      fields["signatories.beneficiaryCurrentEmployer.lastName"].label,
      convention.signatories.beneficiaryCurrentEmployer?.lastName,
    ],
    [
      fields["signatories.beneficiaryCurrentEmployer.businessName"].label,
      convention.signatories.beneficiaryCurrentEmployer?.businessName,
    ],
    [
      fields["signatories.beneficiaryCurrentEmployer.businessSiret"].label,
      convention.signatories.beneficiaryCurrentEmployer?.businessSiret,
    ],
    [
      fields["signatories.beneficiary.isRqth"].label,
      convention.signatories.beneficiary.isRqth ? "✅" : undefined,
    ],
  ];
  return rows.filter(filterEmptyRows);
};

const establishmentSummary = (convention: ConventionReadDto) => {
  const { getFormFields } = useFormContents(
    formConventionFieldsLabels(convention.internshipKind),
  );
  const fields = getFormFields();
  const rows: ConventionSummaryRow[] = [
    [fields["businessName"].label, convention.businessName],
    [fields["siret"].label, convention.siret],
    [fields["immersionAddress"].label, convention.immersionAddress],
  ];
  return rows.filter(filterEmptyRows);
};
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
const immersionConditionsSummary = (convention: ConventionReadDto) => {
  const { getFormFields } = useFormContents(
    formConventionFieldsLabels(convention.internshipKind),
  );
  const fields = getFormFields();
  const rows: ConventionSummaryRow[] = [
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
    [fields["immersionActivities"].label, convention.immersionActivities],
    [fields["businessAdvantages"].label, convention.businessAdvantages],
    [fields["immersionSkills"].label, convention.immersionSkills],
  ];
  return rows.filter(filterEmptyRows);
};

const summarySections = (
  convention: ConventionReadDto,
  agency: AgencyPublicDisplayDto,
) => [
  {
    title: "Signataires de la convention",
    fields: signatoriesSummary(convention),
  },
  {
    title: "Structure d'accompagnement du candidat",
    fields: agencySummary(convention, agency),
  },
  {
    title: "Informations du candidat",
    fields: beneficiarySummary(convention),
  },
  {
    title: "Informations de l'entreprise d'accueil",
    fields: establishmentSummary(convention),
  },
  {
    title:
      convention.internshipKind === "immersion"
        ? "Conditions d'immersion"
        : "Conditions de stage",
    fields: immersionConditionsSummary(convention),
  },
];

export const ConventionSummary = () => {
  const convention = useAppSelector(conventionSelectors.convention);
  const [agency, setAgency] = useState<AgencyPublicDisplayDto | null>(null);
  const { cx } = useStyles();
  useEffect(() => {
    if (convention) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      agencyGateway
        .getAgencyPublicInfoById({
          agencyId: convention.agencyId,
        })
        .then(setAgency);
    }
  }, []);
  useScrollToTop(true);
  if (!convention) return null;
  if (!agency) return <Loader />;

  return (
    <div className={cx(fr.cx("fr-col"), "im-convention-summary")}>
      {summarySections(convention, agency).map(({ title, fields }) => (
        <section key={title} className={cx("im-convention-summary__section")}>
          <h2 className={fr.cx("fr-h4")}>{title}</h2>
          <Table data={fields} noCaption fixed />
        </section>
      ))}
    </div>
  );
};
