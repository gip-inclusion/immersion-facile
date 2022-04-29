import { ApplicationStatus } from "./ImmersionApplication/ImmersionApplication.dto";

type DatesInApplication = {
  dateStart: string;
  dateEnd: string;
  dateSubmission: string;
};

export const startDateIsBeforeEndDate = ({
  dateStart,
  dateEnd,
}: DatesInApplication) => new Date(dateEnd) >= new Date(dateStart);

export const underMaxDuration = ({
  dateStart,
  dateEnd,
}: DatesInApplication) => {
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

const statusesAllowedWithoutSign: ApplicationStatus[] = [
  "DRAFT",
  "READY_TO_SIGN",
  "PARTIALLY_SIGNED",
  "REJECTED",
];

export const mustBeSignedByBeneficiaryBeforeReview = (params: {
  beneficiaryAccepted: boolean;
  status: ApplicationStatus;
}) =>
  statusesAllowedWithoutSign.includes(params.status) ||
  params.beneficiaryAccepted;

export const mustBeSignedByEstablishmentBeforeReview = (params: {
  enterpriseAccepted: boolean;
  status: ApplicationStatus;
}) =>
  statusesAllowedWithoutSign.includes(params.status) ||
  params.enterpriseAccepted;
