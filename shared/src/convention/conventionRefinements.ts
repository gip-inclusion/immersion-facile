import differenceInDays from "date-fns/differenceInDays";
import {
  ConventionStatus,
  immersionMaximumCalendarDays,
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
}: {
  dateStart: string;
  dateEnd: string;
}): boolean =>
  differenceInDays(new Date(dateEnd), new Date(dateStart)) <
  immersionMaximumCalendarDays;

export const emailAndMentorEmailAreDifferent = (params: {
  email: string;
  mentorEmail: string;
}): boolean => params.email !== params.mentorEmail;

const statusesAllowedWithoutSign: ConventionStatus[] = [
  "DRAFT",
  "READY_TO_SIGN",
  "PARTIALLY_SIGNED",
  "REJECTED",
  "CANCELLED",
];

export const mustBeSignedByBeneficiary = (params: {
  beneficiaryAccepted: boolean;
  status: ConventionStatus;
}): boolean =>
  statusesAllowedWithoutSign.includes(params.status) ||
  params.beneficiaryAccepted;

export const mustBeSignedByEstablishment = (params: {
  enterpriseAccepted: boolean;
  status: ConventionStatus;
}): boolean =>
  statusesAllowedWithoutSign.includes(params.status) ||
  params.enterpriseAccepted;
