import differenceInDays from "date-fns/differenceInDays";
import { uniq } from "ramda";
import { allSignatoriesSigned, getConventionFieldName } from "./convention";
import {
  ConventionDtoWithoutExternalId,
  ConventionStatus,
  InternshipKind,
  maximumCalendarDayByInternshipKind,
  EstablishmentTutor,
  Signatories,
} from "./convention.dto";

type DatesInConvention = {
  dateStart: string;
  dateEnd: string;
  dateSubmission: string;
};

type DatesAndInternshipKing = {
  dateStart: string;
  dateEnd: string;
  internshipKind: InternshipKind;
};

export const startDateIsBeforeEndDate = ({
  dateStart,
  dateEnd,
}: DatesInConvention) => new Date(dateEnd) >= new Date(dateStart);

export const underMaxCalendarDuration = ({
  dateStart,
  dateEnd,
  internshipKind,
}: DatesAndInternshipKing): boolean =>
  differenceInDays(new Date(dateEnd), new Date(dateStart)) <=
  maximumCalendarDayByInternshipKind[internshipKind];

export const getConventionTooLongMessageAndPath = ({
  internshipKind,
}: DatesAndInternshipKing) => ({
  message: `La durée maximale calendaire d'une immersion est de ${maximumCalendarDayByInternshipKind[internshipKind]} jours.`,
  path: [getConventionFieldName("dateEnd")],
});

const isEstablishmentTutorEmailUsedByBeneficiaryOrItsRepresentative = (
  signatories: Signatories,
  establishmentTutor: EstablishmentTutor,
): boolean => {
  if (signatories.beneficiary.email === establishmentTutor.email) return false;
  if (
    signatories.beneficiaryRepresentative &&
    signatories.beneficiaryRepresentative.email === establishmentTutor.email
  )
    return false;
  return true;
};

const areSignatoryEmailsUniq = (signatories: Signatories): boolean => {
  const emails = [
    signatories.establishmentRepresentative.email,
    signatories.beneficiary.email,
    signatories.beneficiaryRepresentative?.email,
  ];

  return uniq(emails).length === emails.length;
};

export const conventionEmailCheck = (
  convention: ConventionDtoWithoutExternalId,
): boolean =>
  areSignatoryEmailsUniq(convention.signatories)
    ? isEstablishmentTutorEmailUsedByBeneficiaryOrItsRepresentative(
        convention.signatories,
        convention.establishmentTutor,
      )
    : false;

const statusesAllowedWithoutSign: ConventionStatus[] = [
  "DRAFT",
  "READY_TO_SIGN",
  "PARTIALLY_SIGNED",
  "REJECTED",
  "CANCELLED",
];

export const mustBeSignedByEveryone = (
  params: ConventionDtoWithoutExternalId,
): boolean =>
  statusesAllowedWithoutSign.includes(params.status) ||
  allSignatoriesSigned(params.signatories);
