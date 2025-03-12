import type { BadgeProps } from "@codegouvfr/react-dsfr/Badge";
import type { ButtonProps } from "@codegouvfr/react-dsfr/Button";

import {
  type ConventionSummaryField,
  ConventionWeeklySchedule,
  CopyButton,
} from "react-design-system";
import type {
  ConventionSummarySection,
  ConventionSummarySubSection,
} from "react-design-system/src/immersionFacile/components/convention-summary";
import {
  type ConventionReadDto,
  type DateString,
  type Phone,
  type ScheduleDto,
  type SignatoryRole,
  addressDtoToString,
  convertLocaleDateToUtcTimezoneDate,
  makeSiretDescriptionLink,
  makeWeeklySchedule,
  removeEmptyValue,
  toDisplayedDate,
} from "shared";

const makeSignatoriesSubsections = (
  convention: ConventionReadDto,
  signatoriesSubsectionButtonProps?: (
    signatoryRole: SignatoryRole,
    signatoryPhone: Phone,
    signatoryAlreadySign: boolean,
  ) => ButtonProps,
): ConventionSummarySubSection[] => {
  const shouldDisplayDefaultSignatoryBadge =
    convention.status === "READY_TO_SIGN" ||
    convention.status === "PARTIALLY_SIGNED";
  const shouldDisplayDefaultAgencyBadge =
    convention.status === "IN_REVIEW" ||
    convention.status === "ACCEPTED_BY_COUNSELLOR";
  const defaultSignatoryBadgeValue = (): BadgeProps | undefined =>
    shouldDisplayDefaultSignatoryBadge
      ? {
          children: "Signature en attente",
          severity: "warning",
        }
      : undefined;

  const defaultAgencyBadgeValue = (
    hasAgencyWithRefersTo: boolean,
    key: "dateApproval" | "dateValidation",
    value: string,
  ): ConventionSummaryField | null => {
    if (!shouldDisplayDefaultAgencyBadge) {
      return null;
    }
    if (
      key === "dateValidation" ||
      (key === "dateApproval" && hasAgencyWithRefersTo)
    ) {
      return {
        key,
        children: value,
        severity: "warning",
      };
    }
    return null;
  };

  return removeEmptyValue([
    {
      key: "beneficiary",
      header: {
        title: "Bénéficiaire",
        badge: convention.signatories.beneficiary.signedAt
          ? ({
              children:
                convention.signatories.beneficiary.signedAt &&
                `Signée - Le ${toDisplayedDate({
                  date: new Date(convention.signatories.beneficiary.signedAt),
                })}`,
              severity: "success",
            } satisfies BadgeProps)
          : defaultSignatoryBadgeValue(),
        action:
          ["READY_TO_SIGN", "PARTIALLY_SIGNED"].includes(convention.status) &&
          signatoriesSubsectionButtonProps
            ? signatoriesSubsectionButtonProps(
                "beneficiary",
                convention.signatories.beneficiary.phone,
                !!convention.signatories.beneficiary.signedAt,
              )
            : undefined,
      },
      fields: removeEmptyValue([
        {
          key: "beneficiaryFirstname",
          label: "Prénom",
          value: convention.signatories.beneficiary.firstName,
        },
        {
          key: "beneficiaryLastname",
          label: "Nom",
          value: convention.signatories.beneficiary.lastName,
        },
        {
          key: "beneficiaryEmail",
          label: "Email",
          value: (
            <a
              href={`mailto:${convention.signatories.beneficiary.email}`}
              title={convention.signatories.beneficiary.email}
            >
              {convention.signatories.beneficiary.email}
            </a>
          ),
          copyButton: (
            <CopyButton
              withIcon={true}
              textToCopy={convention.signatories.beneficiary.email}
              priority="tertiary no outline"
              label="Copier l'email du bénéficiaire"
              iconOnly
              className="fr-ml-1v"
            />
          ),
        },
        {
          key: "beneficiaryPhone",
          label: "Téléphone",
          value: convention.signatories.beneficiary.phone,
        },
      ]),
    },
    convention.signatories.beneficiaryRepresentative
      ? {
          key: "beneficiaryRepresentative",
          header: {
            title: "Représentant légal du bénéficiaire",
            badge: convention.signatories.beneficiaryRepresentative.signedAt
              ? ({
                  children:
                    convention.signatories.beneficiaryRepresentative.signedAt &&
                    `Signée - Le ${toDisplayedDate({
                      date: new Date(
                        convention.signatories.beneficiaryRepresentative
                          .signedAt,
                      ),
                    })}`,
                  severity: "success",
                } satisfies BadgeProps)
              : defaultSignatoryBadgeValue(),
            action:
              ["READY_TO_SIGN", "PARTIALLY_SIGNED"].includes(
                convention.status,
              ) && signatoriesSubsectionButtonProps
                ? signatoriesSubsectionButtonProps(
                    "beneficiary-representative",
                    convention.signatories.establishmentRepresentative.phone,
                    !!convention.signatories.establishmentRepresentative
                      .signedAt,
                  )
                : undefined,
          },
          fields: removeEmptyValue([
            {
              key: "beneficiaryRepFirstname",
              label: "Prénom",
              value: convention.signatories.beneficiaryRepresentative.firstName,
            },
            {
              key: "beneficiaryRepLastname",
              label: "Nom",
              value: convention.signatories.beneficiaryRepresentative.lastName,
            },
            {
              key: "beneficiaryRepEmail",
              label: "Email",
              value: (
                <a
                  href={`mailto:${convention.signatories.beneficiaryRepresentative.email}`}
                  title={convention.signatories.beneficiaryRepresentative.email}
                >
                  {convention.signatories.beneficiaryRepresentative.email}
                </a>
              ),
              copyButton: (
                <CopyButton
                  withIcon={true}
                  textToCopy={
                    convention.signatories.beneficiaryRepresentative.email
                  }
                  label="Copier l'email du représentant légal du bénéficiaire"
                  iconOnly
                  className="fr-ml-1v"
                />
              ),
            },
            {
              key: "beneficiaryRepPhone",
              label: "Téléphone",
              value: convention.signatories.beneficiaryRepresentative.phone,
            },
          ]),
        }
      : null,
    {
      key: "establishmentRepresentative",
      header: {
        title: "Représentant de l'entreprise",
        badge: convention.signatories.establishmentRepresentative.signedAt
          ? ({
              children:
                convention.signatories.establishmentRepresentative.signedAt &&
                `Signée - Le ${toDisplayedDate({
                  date: new Date(
                    convention.signatories.establishmentRepresentative.signedAt,
                  ),
                })}`,
              severity: "success",
            } satisfies BadgeProps)
          : defaultSignatoryBadgeValue(),
        action:
          ["READY_TO_SIGN", "PARTIALLY_SIGNED"].includes(convention.status) &&
          signatoriesSubsectionButtonProps
            ? signatoriesSubsectionButtonProps(
                "establishment-representative",
                convention.signatories.establishmentRepresentative.phone,
                !!convention.signatories.establishmentRepresentative.signedAt,
              )
            : undefined,
      },
      fields: removeEmptyValue([
        {
          key: "establishmentRepFirstname",
          label: "Prénom",
          value: convention.signatories.establishmentRepresentative.firstName,
        },
        {
          key: "establishmentRepLastname",
          label: "Nom",
          value: convention.signatories.establishmentRepresentative.lastName,
        },
        {
          key: "establishmentRepEmail",
          label: "Email",
          value: (
            <a
              href={`mailto:${convention.signatories.establishmentRepresentative.email}`}
              title={convention.signatories.establishmentRepresentative.email}
            >
              {convention.signatories.establishmentRepresentative.email}
            </a>
          ),
          copyButton: (
            <CopyButton
              withIcon={true}
              textToCopy={
                convention.signatories.establishmentRepresentative.email
              }
              label="Copier l'email du représentant de l'entreprise"
              iconOnly
              className="fr-ml-1v"
            />
          ),
        },
        {
          key: "establishmentRepPhone",
          label: "Téléphone",
          value: convention.signatories.establishmentRepresentative.phone,
        },
        {
          key: "establishmentRepSiret",
          label: "SIRET",
          value: renderSiret(convention.siret),
        },
      ]),
    },
    convention.signatories.beneficiaryCurrentEmployer
      ? {
          key: "beneficiaryCurrentEmployer",
          header: {
            title: "Employeur actuel du bénéficiaire",
            badge: convention.signatories.beneficiaryCurrentEmployer.signedAt
              ? ({
                  children:
                    convention.signatories.beneficiaryCurrentEmployer
                      .signedAt &&
                    `Signée - Le ${toDisplayedDate({
                      date: new Date(
                        convention.signatories.beneficiaryCurrentEmployer
                          .signedAt,
                      ),
                    })}`,
                  severity: "success",
                } satisfies BadgeProps)
              : defaultSignatoryBadgeValue(),
            action:
              ["READY_TO_SIGN", "PARTIALLY_SIGNED"].includes(
                convention.status,
              ) && signatoriesSubsectionButtonProps
                ? signatoriesSubsectionButtonProps(
                    "beneficiary-current-employer",
                    convention.signatories.beneficiaryCurrentEmployer.phone,
                    !!convention.signatories.beneficiaryCurrentEmployer
                      .signedAt,
                  )
                : undefined,
          },
          fields: removeEmptyValue([
            {
              key: "beneficiaryCurrentEmployerFirstname",
              label: "Prénom",
              value:
                convention.signatories.beneficiaryCurrentEmployer.firstName,
            },
            {
              key: "beneficiaryCurrentEmployerLastname",
              label: "Nom",
              value: convention.signatories.beneficiaryCurrentEmployer.lastName,
            },
            {
              key: "beneficiaryCurrentEmployerEmail",
              label: "Email",
              value: (
                <a
                  href={`mailto:${convention.signatories.beneficiaryCurrentEmployer.email}`}
                  title={
                    convention.signatories.beneficiaryCurrentEmployer.email
                  }
                >
                  {convention.signatories.beneficiaryCurrentEmployer.email}
                </a>
              ),
              copyButton: (
                <CopyButton
                  withIcon={true}
                  textToCopy={
                    convention.signatories.beneficiaryCurrentEmployer.email
                  }
                  label="Copier l'email de l'employeur actuel du bénéficiaire"
                  iconOnly
                  className="fr-ml-1v"
                />
              ),
            },
            {
              key: "beneficiaryCurrentEmployerPhone",
              label: "Téléphone",
              value: convention.signatories.beneficiaryCurrentEmployer.phone,
            },
            {
              key: "beneficiaryCurrentEmployerSiret",
              label: "SIRET",
              value: renderSiret(
                convention.signatories.beneficiaryCurrentEmployer.businessSiret,
              ),
            },
            convention.signatories.beneficiaryCurrentEmployer.job
              ? {
                  key: "beneficiaryCurrentEmployerJob",
                  label: "Poste",
                  value: convention.signatories.beneficiaryCurrentEmployer.job,
                }
              : null,
          ]),
        }
      : null,
    {
      key: "agency",
      title: "Structure du bénéficiaire",
      fields: removeEmptyValue([
        convention.agencyRefersTo && convention.dateApproval
          ? ({
              key: "dateApproval",
              children:
                convention.dateApproval &&
                `Pré-validée - Le ${toDisplayedDate({
                  date: new Date(convention.dateApproval),
                })}`,
              severity: "success",
            } satisfies ConventionSummaryField)
          : defaultAgencyBadgeValue(
              !!convention.agencyRefersTo,
              "dateApproval",
              "Pré-validation en attente",
            ),
        convention.agencyRefersTo
          ? {
              key: "agencyWithRefersTo",
              label: "Structure d'accompagnement",
              value: convention.agencyName,
              copyButton: (
                <CopyButton
                  withIcon={true}
                  textToCopy={convention.agencyName}
                  label="Copier la structure d'accompagnement"
                  iconOnly
                  className="fr-ml-1v"
                />
              ),
            }
          : null,
        convention.dateValidation
          ? ({
              key: "dateValidation",
              children:
                convention.dateValidation &&
                `Validée - Le ${toDisplayedDate({
                  date: new Date(convention.dateValidation),
                })}`,
              severity: "success",
            } satisfies ConventionSummaryField)
          : defaultAgencyBadgeValue(
              false,
              "dateValidation",
              "Validation en attente",
            ),
        {
          key: "agencyName",
          label: `Prescripteur ${convention.agencyRefersTo ? "lié" : ""}`,
          value: convention.agencyRefersTo
            ? convention.agencyRefersTo.name
            : convention.agencyName,
          copyButton: (
            <CopyButton
              withIcon={true}
              textToCopy={
                convention.agencyRefersTo
                  ? convention.agencyRefersTo.name
                  : convention.agencyName
              }
              label="Copier le prescripteur"
              iconOnly
              className="fr-ml-1v"
            />
          ),
        },
      ]),
      isFullWidthDisplay: true,
      hasBackgroundColor: true,
    },
  ]);
};

const makeBeneficiarySubSections = (
  convention: ConventionReadDto,
): ConventionSummarySubSection[] => {
  return [
    {
      key: "beneficiairy",
      header: { title: "Bénéficiaire" },
      fields: removeEmptyValue([
        {
          key: "beneficiaryBirthdate",
          label: "Date de naissance",
          value: toDisplayedDate({
            date: convertLocaleDateToUtcTimezoneDate(
              new Date(convention.signatories.beneficiary.birthdate),
            ),
          }),
        },
        {
          key: "beneficiaryRqth",
          label: "RQTH",
          value: convention.signatories.beneficiary.isRqth ? "Oui" : "Non",
        },
        {
          key: "beneficiaryFinanciaryHelp",
          label: "Aide matérielle",
          value: convention.signatories.beneficiary.financiaryHelp || "Aucune",
        },
        convention.internshipKind === "mini-stage-cci" &&
        convention.signatories.beneficiary.address
          ? {
              key: "beneficiaryAddress",
              label: "Adresse du candidat",
              value:
                convention.internshipKind === "mini-stage-cci" &&
                convention.signatories.beneficiary.address &&
                addressDtoToString(convention.signatories.beneficiary.address),
            }
          : null,
        convention.internshipKind === "mini-stage-cci" &&
        convention.signatories.beneficiary.levelOfEducation
          ? {
              key: "beneficiaryLevelOfEducation",
              label: "Niveau d'études",
              value: convention.signatories.beneficiary.levelOfEducation,
            }
          : null,
        convention.internshipKind === "mini-stage-cci" &&
        convention.signatories.beneficiary.schoolName
          ? {
              key: "beneficiarySchoolName",
              label: "Établissement",
              value: convention.signatories.beneficiary.schoolName,
            }
          : null,
        convention.internshipKind === "mini-stage-cci" &&
        convention.signatories.beneficiary.schoolPostcode
          ? {
              key: "beneficiarySchoolName",
              label: "Code postal de l'établissement",
              value: convention.signatories.beneficiary.schoolPostcode,
            }
          : null,
      ]),
    },
    {
      key: "emergencyContact",
      header: { title: "Contact d'urgence" },
      fields: [
        {
          key: "emergencyContactName",
          label: "Prénom et nom",
          value: convention.signatories.beneficiary.emergencyContact || "-",
        },
        {
          key: "emergencyContactEmail",
          label: "Email",
          value:
            convention.signatories.beneficiary.emergencyContactEmail || "-",
        },
        {
          key: "emergencyContactPhone",
          label: "Téléphone",
          value:
            convention.signatories.beneficiary.emergencyContactPhone || "-",
        },
      ],
    },
  ];
};

const makeEstablishmentSubSections = (
  convention: ConventionReadDto,
): ConventionSummarySubSection[] => {
  return [
    {
      key: "establishment",
      header: { title: "Entreprise" },
      fields: [
        {
          key: "businessName",
          label: "Nom (raison sociale)",
          value: convention.businessName,
        },
        {
          key: "siret",
          label: "SIRET",
          value: renderSiret(convention.siret),
        },
      ],
    },
    {
      key: "establishmentTutor",
      header: { title: "Tuteur" },
      fields: [
        {
          key: "establishmentTutorFirstname",
          label: "Prénom",
          value: convention.establishmentTutor.firstName,
        },
        {
          key: "establishmentTutorLastname",
          label: "Nom",
          value: convention.establishmentTutor.lastName,
        },
        {
          key: "establishmentTutorJob",
          label: "Poste",
          value: convention.establishmentTutor.job,
        },
        {
          key: "establishmentTutorEmail",
          label: "Email",
          value: (
            <a
              href={`mailto:${convention.establishmentTutor.email}`}
              title={convention.establishmentTutor.email}
            >
              {convention.establishmentTutor.email}
            </a>
          ),
          copyButton: (
            <CopyButton
              withIcon={true}
              textToCopy={convention.establishmentTutor.email}
              label="Copier l'email du tuteur"
              iconOnly
              className="fr-ml-1v"
            />
          ),
        },
        {
          key: "establishmentTutorPhone",
          label: "Téléphone",
          value: convention.establishmentTutor.phone,
        },
      ],
    },
  ];
};

const makeImmersionSubSections = (
  convention: ConventionReadDto,
): ConventionSummarySubSection[] => {
  return [
    {
      key: "immersionAddress",
      isFullWidthDisplay: true,
      fields: [
        {
          key: "immersionAddress",
          label: "Lieu où se fera l'immersion",
          value: convention.immersionAddress,
        },
      ],
    },
    {
      key: "immersion",
      header: {
        title: `Métier observé : ${convention.immersionAppellation.appellationLabel}`,
      },
      isFullWidthDisplay: true,
      fields: [
        {
          key: "immersionObjective",
          label: `Objectif ${
            convention.internshipKind === "immersion"
              ? "de l'immersion"
              : "du mini-stage"
          }`,
          value: convention.immersionObjective,
        },
        {
          key: "immersionActivities",
          label: "Activités observées",
          value: convention.immersionActivities,
        },
        {
          key: "immersionSkills",
          label: "Compétences évaluées",
          value: convention.immersionSkills || "-",
        },
        {
          key: "workConditions",
          label: "Conditions de travail (propres au métier observé)",
          value: convention.workConditions || "-",
        },
        {
          key: "businessAdvantages",
          label: "Avantages proposés par l'établissement d'accueil",
          value: convention.businessAdvantages || "-",
        },
      ],
    },
    {
      key: "period",
      header: { title: "Emploi du temps" },
      isFullWidthDisplay: true,
      fields: [
        {
          key: "dateStart",
          label: "Date de début",
          value: toDisplayedDate({
            date: convertLocaleDateToUtcTimezoneDate(
              new Date(convention.dateStart),
            ),
          }),
        },
        {
          key: "dateEnd",
          label: "Date de fin",
          value: toDisplayedDate({
            date: convertLocaleDateToUtcTimezoneDate(
              new Date(convention.dateEnd),
            ),
          }),
        },
      ],
    },
    {
      key: "schedule",
      fields: [
        {
          key: "schedule",
          value: printWeekSchedule({
            schedule: convention.schedule,
            dateStart: convention.dateStart,
            dateEnd: convention.dateEnd,
            useWrapper: false,
          }),
        },
      ],
      isFullWidthDisplay: true,
      hasBackgroundColor: true,
      isSchedule: true,
    },
  ];
};

const makeAdditionalInformationSubSections = (
  convention: ConventionReadDto,
): ConventionSummarySubSection[] => {
  return [
    {
      key: "additionalInformation",
      isFullWidthDisplay: true,
      fields: [
        {
          key: "individualProtection",
          label: "Protection individuelle",
          value: convention.individualProtection
            ? `Oui${
                convention.individualProtectionDescription
                  ? ` : ${convention.individualProtectionDescription}`
                  : ""
              }`
            : "Non",
        },
        {
          key: "sanitaryPreventionDescription",
          label: "Mesures de prévention sanitaire",
          value: convention.sanitaryPrevention
            ? `Oui${
                convention.sanitaryPreventionDescription
                  ? ` : ${convention.sanitaryPreventionDescription}`
                  : ""
              }`
            : "Non",
        },
      ],
    },
  ];
};

export const makeConventionSections = (
  convention: ConventionReadDto,
  signatoriesSubsectionButtonProps?: (
    signatoryRole: SignatoryRole,
    signatoryPhone: Phone,
    signatoryAlreadySign: boolean,
  ) => ButtonProps,
): ConventionSummarySection[] => {
  return [
    {
      title: "Signataires de la convention",
      subSections: makeSignatoriesSubsections(
        convention,
        signatoriesSubsectionButtonProps,
      ),
    },
    {
      title: "Informations sur le bénéficiaire",
      subSections: makeBeneficiarySubSections(convention),
    },
    {
      title: "Informations de l'entreprise",
      subSections: makeEstablishmentSubSections(convention),
    },
    {
      title: "Informations sur l'immersion",
      subSections: makeImmersionSubSections(convention),
    },
    {
      title: "Informations complémentaires",
      subSections: makeAdditionalInformationSubSections(convention),
    },
  ];
};

export const printWeekSchedule = ({
  schedule,
  dateStart,
  dateEnd,
  useWrapper,
}: {
  schedule: ScheduleDto;
  dateStart: DateString;
  dateEnd: DateString;
  useWrapper: boolean;
}) => {
  const weeklyScheduleDto = makeWeeklySchedule(schedule, {
    start: convertLocaleDateToUtcTimezoneDate(new Date(dateStart)),
    end: convertLocaleDateToUtcTimezoneDate(new Date(dateEnd)),
  });
  return (
    <ConventionWeeklySchedule
      weeklySchedule={weeklyScheduleDto.map((week) => ({
        ...week,
        period: {
          start: toDisplayedDate({
            date: week.period.start,
          }),
          end: toDisplayedDate({
            date: week.period.end,
          }),
        },
      }))}
      useWrapper={useWrapper}
    />
  );
};

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
