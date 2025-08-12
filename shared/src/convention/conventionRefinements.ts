import differenceInDays from "date-fns/differenceInDays";
import { addressSchema } from "../address/address.schema";
import type { ScheduleDto } from "../schedule/Schedule.dto";
import type { DateString } from "../utils/date";
import { allSignatoriesSigned, getConventionFieldName } from "./convention";
import {
  type ConventionDto,
  type ConventionStatus,
  type EstablishmentTutor,
  getExactAge,
  type InternshipKind,
  MAX_PRESENCE_DAYS_RELEASE_DATE,
  maximumCalendarDayByInternshipKind,
  maxPresenceDaysByInternshipKind,
  type Signatories,
} from "./convention.dto";

type DatesAndInternshipKing = {
  dateStart: DateString;
  dateEnd: DateString;
  internshipKind: InternshipKind;
};

export const startDateIsBeforeEndDate = ({
  dateStart,
  dateEnd,
}: {
  dateStart: DateString;
  dateEnd: DateString;
}) => new Date(dateEnd) >= new Date(dateStart);

export const underMaxCalendarDuration = ({
  dateStart,
  dateEnd,
  internshipKind,
}: DatesAndInternshipKing): boolean =>
  differenceInDays(new Date(dateEnd), new Date(dateStart)) <=
  maximumCalendarDayByInternshipKind[internshipKind];

export const getConventionTooLongMessageAndPath = ({
  internshipKind,
}: {
  internshipKind: InternshipKind;
}) => ({
  error: `La durée maximale calendaire d'une immersion est de ${maximumCalendarDayByInternshipKind[internshipKind]} jours.`,
  path: [getConventionFieldName("dateEnd")],
});

type WithScheduleAndInternshipKind = {
  schedule: ScheduleDto;
  internshipKind: InternshipKind;
  dateSubmission: DateString;
};

export const underMaxPresenceDays = ({
  schedule,
  internshipKind,
  dateSubmission,
}: WithScheduleAndInternshipKind): boolean => {
  if (new Date(dateSubmission) < new Date(MAX_PRESENCE_DAYS_RELEASE_DATE))
    return true;
  const maxWorkedDays = maxPresenceDaysByInternshipKind[internshipKind];
  return schedule.workedDays <= maxWorkedDays;
};

export const getOverMaxWorkedDaysMessageAndPath = ({
  internshipKind,
  schedule,
}: WithScheduleAndInternshipKind) => ({
  message: `Le nombre maximum de jours de présence est ${maxPresenceDaysByInternshipKind[internshipKind]} jours. Actuellement, il y a ${schedule.workedDays} jours de présence.`,
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
}: Pick<ConventionDto, "dateStart" | "signatories" | "dateSubmission">) => {
  const beneficiaryAgeAtConventionStart = getExactAge({
    birthDate: new Date(signatories.beneficiary.birthdate),
    referenceDate: new Date(dateStart),
  });

  const ruleAppliesFrom = new Date("2023-10-28");
  const conventionWasSubmittedBeforeRuleApplies =
    new Date(dateSubmission).getTime() < ruleAppliesFrom.getTime();

  return (
    conventionWasSubmittedBeforeRuleApplies ||
    beneficiaryAgeAtConventionStart >= 18 ||
    !!signatories.beneficiaryRepresentative
  );
};

export const validateBeneficiaryAddressAndParse = (
  convention: ConventionDto,
) => {
  const ruleAppliesFrom = new Date("2024-10-02");
  const conventionWasSubmittedBeforeRuleApplies =
    new Date(convention.dateSubmission).getTime() < ruleAppliesFrom.getTime();
  if (
    convention.internshipKind === "immersion" ||
    conventionWasSubmittedBeforeRuleApplies
  )
    return true;

  return addressSchema.safeParse(convention.signatories.beneficiary.address)
    .success;
};

const statusesAllowedWithoutSign: ConventionStatus[] = [
  "READY_TO_SIGN",
  "PARTIALLY_SIGNED",
  "REJECTED",
  "CANCELLED",
  "DEPRECATED",
];

export const mustBeSignedByEveryone = (params: ConventionDto): boolean =>
  statusesAllowedWithoutSign.includes(params.status) ||
  allSignatoriesSigned(params.signatories);
