import { differenceInYears } from "date-fns";
import differenceInDays from "date-fns/differenceInDays";
import { DateIsoString } from "../utils/date";
import { allSignatoriesSigned, getConventionFieldName } from "./convention";
import {
  ConventionDto,
  ConventionStatus,
  EstablishmentTutor,
  InternshipKind,
  maximumCalendarDayByInternshipKind,
  Signatories,
} from "./convention.dto";

type DatesInConvention = {
  dateStart: DateIsoString;
  dateEnd: DateIsoString;
  dateSubmission: DateIsoString;
};

type DatesAndInternshipKing = {
  dateStart: DateIsoString;
  dateEnd: DateIsoString;
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

export const isTutorEmailDifferentThanBeneficiaryRelatedEmails = (
  signatories: Signatories,
  establishmentTutor: EstablishmentTutor,
): boolean => {
  const emails = [
    signatories.beneficiary.email,
    signatories.beneficiaryRepresentative?.email,
    signatories.beneficiaryCurrentEmployer?.email,
  ];
  return !emails.includes(establishmentTutor.email);
};

export const minorBeneficiaryHasRepresentative = ({
  dateStart,
  signatories,
  dateSubmission,
}: ConventionDto) => {
  const beneficiaryAgeAtConventionStart = differenceInYears(
    new Date(dateStart),
    new Date(signatories.beneficiary.birthdate),
  );

  const ruleAppliesFrom = new Date("2023-10-28");
  const conventionWasSubmittedBeforeRuleApplies =
    new Date(dateSubmission).getTime() < ruleAppliesFrom.getTime();

  return (
    conventionWasSubmittedBeforeRuleApplies ||
    beneficiaryAgeAtConventionStart >= 18 ||
    !!signatories.beneficiaryRepresentative
  );
};

const statusesAllowedWithoutSign: ConventionStatus[] = [
  "DRAFT",
  "READY_TO_SIGN",
  "PARTIALLY_SIGNED",
  "REJECTED",
  "CANCELLED",
  "DEPRECATED",
];

export const mustBeSignedByEveryone = (params: ConventionDto): boolean =>
  statusesAllowedWithoutSign.includes(params.status) ||
  allSignatoriesSigned(params.signatories);
