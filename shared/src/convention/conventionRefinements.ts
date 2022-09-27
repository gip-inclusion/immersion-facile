import differenceInDays from "date-fns/differenceInDays";
import { allSignatoriesSigned } from "./convention";
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

export const startDateIsBeforeEndDate = ({
  dateStart,
  dateEnd,
}: DatesInConvention) => new Date(dateEnd) >= new Date(dateStart);

export const underMaxCalendarDuration = ({
  dateStart,
  dateEnd,
  internshipKind,
}: {
  dateStart: string;
  dateEnd: string;
  internshipKind: InternshipKind;
}): boolean =>
  differenceInDays(new Date(dateEnd), new Date(dateStart)) <=
  maximumCalendarDayByInternshipKind[internshipKind];

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
