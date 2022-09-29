import differenceInDays from "date-fns/differenceInDays";
import { allSignatoriesSigned, getConventionFieldName } from "./convention";
import {
  ConventionStatus,
  InternshipKind,
  maximumCalendarDayByInternshipKind,
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

export const emailAndMentorEmailAreDifferent = (params: {
  signatories: Signatories;
}): boolean =>
  params.signatories.mentor.email !== params.signatories.beneficiary.email;

const statusesAllowedWithoutSign: ConventionStatus[] = [
  "DRAFT",
  "READY_TO_SIGN",
  "PARTIALLY_SIGNED",
  "REJECTED",
  "CANCELLED",
];

export const mustBeSignedByEveryone = (params: {
  signatories: Signatories;
  status: ConventionStatus;
}): boolean =>
  statusesAllowedWithoutSign.includes(params.status) ||
  allSignatoriesSigned(params.signatories);
