import { fr } from "@codegouvfr/react-dsfr";
import React from "react";
import { CopyButton } from "react-design-system";
import {
  ConventionSummaryField,
  ConventionSummarySection,
  ConventionSummarySubSection,
  conventionSummaryStyles,
} from "react-design-system/src/immersionFacile/components/convention-summary";
import {
  ConventionReadDto,
  addressDtoToString,
  makeSiretDescriptionLink,
  makeWeeklySchedule,
  removeEmptyValue,
  toDisplayedDate,
} from "shared";
import { Cx } from "tss-react";

const makeSignatoriesSubsections = (
  convention: ConventionReadDto,
): ConventionSummarySubSection[] => {
  return removeEmptyValue([
    {
      key: "beneficiary",
      title: "Bénéficiaire",
      fields: removeEmptyValue([
        convention.signatories.beneficiary.signedAt
          ? ({
              key: "beneficiarySignedAt",
              value:
                convention.signatories.beneficiary.signedAt &&
                `Signée - Le ${toDisplayedDate({
                  date: new Date(convention.signatories.beneficiary.signedAt),
                })}`,
              badgeSeverity: convention.signatories.beneficiary.signedAt
                ? "success"
                : "warning",
            } satisfies ConventionSummaryField)
          : null,
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
          title: "Représentant légal du bénéficiaire",
          fields: removeEmptyValue([
            convention.signatories.beneficiaryRepresentative.signedAt
              ? {
                  key: "beneficiaryRepSignedAt",
                  value:
                    convention.signatories.beneficiaryRepresentative.signedAt &&
                    `Signée - Le ${toDisplayedDate({
                      date: new Date(
                        convention.signatories.beneficiaryRepresentative
                          .signedAt,
                      ),
                    })}`,
                  badgeSeverity: convention.signatories
                    .beneficiaryRepresentative.signedAt
                    ? "success"
                    : "warning",
                }
              : null,
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
      title: "Représentant de l'entreprise",
      fields: removeEmptyValue([
        convention.signatories.establishmentRepresentative.signedAt
          ? ({
              key: "establishmentRepSignedAt",
              value:
                convention.signatories.establishmentRepresentative.signedAt &&
                `Signée - Le ${toDisplayedDate({
                  date: new Date(
                    convention.signatories.establishmentRepresentative.signedAt,
                  ),
                })}`,
              badgeSeverity: convention.signatories.establishmentRepresentative
                .signedAt
                ? "success"
                : "warning",
            } satisfies ConventionSummaryField)
          : null,
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
          title: "Employeur actuel du bénéficiaire",
          fields: removeEmptyValue([
            convention.signatories.beneficiaryCurrentEmployer.signedAt
              ? ({
                  key: "beneficiaryCurrentEmployerSignedAt",
                  value:
                    convention.signatories.beneficiaryCurrentEmployer
                      .signedAt &&
                    `Signée - Le ${toDisplayedDate({
                      date: new Date(
                        convention.signatories.beneficiaryCurrentEmployer
                          .signedAt,
                      ),
                    })}`,
                  badgeSeverity: convention.signatories
                    .beneficiaryCurrentEmployer.signedAt
                    ? "success"
                    : "warning",
                } satisfies ConventionSummaryField)
              : null,
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
              value:
                convention.dateApproval &&
                `Pré-validée - Le ${toDisplayedDate({
                  date: new Date(convention.dateApproval),
                })}`,
              badgeSeverity: convention.dateApproval ? "success" : "warning",
            } satisfies ConventionSummaryField)
          : null,
        convention.agencyRefersTo
          ? {
              key: "agencyWithRefersTo",
              label: "Structure d'accompagnement",
              value: convention.agencyRefersTo.name,
              copyButton: (
                <CopyButton
                  withIcon={true}
                  textToCopy={convention.agencyRefersTo.name}
                />
              ),
            }
          : null,
        convention.dateValidation
          ? ({
              key: "dateValidation",
              value:
                convention.dateValidation &&
                `Validée - Le ${toDisplayedDate({
                  date: new Date(convention.dateValidation),
                })}`,
              badgeSeverity: convention.dateValidation ? "success" : "warning",
            } satisfies ConventionSummaryField)
          : null,
        {
          key: "agencyName",
          label: `Prescripteur ${convention.agencyRefersTo ? "lié" : ""}`,
          value: convention.agencyName,
          copyButton: (
            <CopyButton withIcon={true} textToCopy={convention.agencyName} />
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
      title: "Bénéficiaire",
      fields: removeEmptyValue([
        {
          key: "beneficiaryBirthdate",
          label: "Date de naissance",
          value: convention.signatories.beneficiary.birthdate,
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
      title: "Contact d'urgence",
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
      title: "Entreprise",
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
      title: "Tuteur",
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
  cx: Cx,
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
      title: `Métier observé : ${convention.immersionAppellation.appellationLabel}`,
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
      title: "Emploi du temps",
      isFullWidthDisplay: true,
      fields: [
        {
          key: "dateStart",
          label: "Date de début",
          value: toDisplayedDate({ date: new Date(convention.dateStart) }),
        },
        {
          key: "dateEnd",
          label: "Date de fin",
          value: toDisplayedDate({ date: new Date(convention.dateEnd) }),
        },
      ],
    },
    {
      key: "schedule",
      fields: [
        {
          key: "schedule",
          value: printWeekSchedule(convention, cx),
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
  cx: Cx,
): ConventionSummarySection[] => {
  return [
    {
      title: "Signataires de la convention",
      subSections: makeSignatoriesSubsections(convention),
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
      subSections: makeImmersionSubSections(convention, cx),
    },
    {
      title: "Informations complémentaires",
      subSections: makeAdditionalInformationSubSections(convention),
    },
  ];
};

const printWeekSchedule = (convention: ConventionReadDto, cx: Cx) => {
  const weeklySchedule = makeWeeklySchedule(convention.schedule, {
    start: new Date(convention.dateStart),
    end: new Date(convention.dateEnd),
  });
  return (
    <div className={fr.cx("fr-grid-row")}>
      {weeklySchedule.map((week, index) => (
        <div
          className={fr.cx(
            "fr-col-12",
            "fr-col-md-6",
            "fr-col-lg-4",
            "fr-col-xl-3",
          )}
          key={week.period.start.toISOString()}
        >
          <div
            className={cx(
              fr.cx("fr-col-6", "fr-m-0", "fr-text--sm"),
              conventionSummaryStyles.subsectionScheduleWeek,
            )}
          >
            Semaine {index + 1}
          </div>
          {week.period?.start && week.period?.end && (
            <div className={fr.cx("fr-text--xs", "fr-m-0")}>
              Du {toDisplayedDate({ date: week.period.start })} au{" "}
              {toDisplayedDate({ date: week.period.end })}
            </div>
          )}
          <div aria-hidden="true" className={fr.cx("fr-text--xs", "fr-m-0")}>
            --
          </div>
          <p className={fr.cx("fr-text--xs")}>
            {week.weeklyHours} heures de travail hebdomadaires
          </p>
          <ul
            style={{
              paddingInlineStart: "0",
            }}
          >
            {week.schedule.map((daySchedule) => (
              <li
                key={daySchedule}
                className={cx(conventionSummaryStyles.subsectionScheduleDay)}
              >
                {daySchedule}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
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
