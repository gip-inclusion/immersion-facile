import { ConventionStatus } from "./convention.dto";

type DatesInConvention = {
  dateStart: string;
  dateEnd: string;
  dateSubmission: string;
};

export const startDateIsBeforeEndDate = ({
  dateStart,
  dateEnd,
}: DatesInConvention) => new Date(dateEnd) >= new Date(dateStart);

export const underMaxDuration = ({ dateStart, dateEnd }: DatesInConvention) => {
  const startDate = new Date(dateStart);
  const endDate = new Date(dateEnd);
  const maxEndDate = new Date(startDate);
  maxEndDate.setDate(maxEndDate.getDate() + 28);
  return endDate <= maxEndDate;
};

export const emailAndMentorEmailAreDifferent = (params: {
  email: string;
  mentorEmail: string;
}) => params.email !== params.mentorEmail;

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
}) =>
  statusesAllowedWithoutSign.includes(params.status) ||
  params.beneficiaryAccepted;

export const mustBeSignedByEstablishment = (params: {
  enterpriseAccepted: boolean;
  status: ConventionStatus;
}) =>
  statusesAllowedWithoutSign.includes(params.status) ||
  params.enterpriseAccepted;
