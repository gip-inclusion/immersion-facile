import { differenceInDays, isMonday, isSunday } from "date-fns";
import { ApplicationStatus } from "./ImmersionApplication/ImmersionApplication.dto";

type DatesInApplication = {
  dateStart: string;
  dateEnd: string;
  dateSubmission: string;
};

export const submissionAndStartDatesConstraints = ({
  dateStart,
  dateSubmission,
}: DatesInApplication) => {
  const startDate = new Date(dateStart);
  const submissionDate = new Date(dateSubmission);
  const minStartDate = new Date(submissionDate);
  minStartDate.setDate(minStartDate.getDate() + 2);
  return startDate >= minStartDate;
};

export const startDateIsBeforeEndDate = ({
  dateStart,
  dateEnd,
}: DatesInApplication) => new Date(dateEnd) > new Date(dateStart);

export const enoughWorkedDaysToReviewFromSubmitDate = ({
  dateSubmission,
  dateStart,
}: DatesInApplication) => {
  const startDate = new Date(dateStart);

  const daysBeforeImmersionStart = differenceInDays(
    startDate,
    new Date(dateSubmission),
  );

  // If start date is Sunday or Monday, we accept only if request is made before the previous friday
  return !(
    daysBeforeImmersionStart < 4 &&
    (isMonday(startDate) || isSunday(startDate))
  );
};

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
