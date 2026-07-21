import { addDays, isBefore } from "date-fns";
import { match } from "ts-pattern";
import type {
  ConventionAssessmentFields,
  ConventionDto,
} from "../convention/convention.dto";
import { calculateTotalImmersionHoursBetweenDateComplex } from "../schedule/ScheduleUtils";
import {
  type DateString,
  type DateTimeIsoString,
  hoursValueToHoursDisplayed,
} from "../utils/date";
import type {
  AssessmentDto,
  AssessmentFormValues,
  AssessmentPartialCompletionDetailsFormValues,
  AssessmentStatus,
  LegacyAssessmentDto,
  TypeOfContract,
} from "./assessment.dto";

export const ASSESSEMENT_SIGNATURE_RELEASE_DATE = new Date("2026-03-10");

export const isBeforeAssessmentSignatureReleaseDate = (
  assessmentCreatedAt: DateTimeIsoString,
): boolean =>
  isBefore(
    new Date(assessmentCreatedAt),
    addDays(ASSESSEMENT_SIGNATURE_RELEASE_DATE, 1),
  );

export const hasPartialCompletionDetails = ({
  lastDayOfPresence,
  numberOfMissedHours,
  numberOfMissedMinutes,
}: AssessmentPartialCompletionDetailsFormValues): boolean =>
  lastDayOfPresence !== "" ||
  (typeof numberOfMissedHours === "number" && numberOfMissedHours > 0) ||
  (typeof numberOfMissedMinutes === "number" && numberOfMissedMinutes > 0);

export const getAssessmentEffectiveEndDate = ({
  lastDayOfPresence,
  conventionDateEnd,
}: {
  lastDayOfPresence: DateString | "" | undefined;
  conventionDateEnd: DateString;
}): DateString => (lastDayOfPresence ? lastDayOfPresence : conventionDateEnd);

const toMissedHours = (
  numberOfMissedHours: number | "",
  numberOfMissedMinutes: number | "",
): number =>
  (typeof numberOfMissedHours === "number" ? numberOfMissedHours : 0) +
  (typeof numberOfMissedMinutes === "number" ? numberOfMissedMinutes : 0) / 60;

export const assessmentFormValuesToAssessmentDto = (
  values: AssessmentFormValues,
  convention: Pick<ConventionDto, "dateEnd">,
  createdAt: DateTimeIsoString = new Date().toISOString(),
): AssessmentDto => {
  if (values.status === null)
    throw new Error("Cannot map assessment form values without a status");

  const commonFields = {
    conventionId: values.conventionId,
    establishmentFeedback: values.establishmentFeedback,
    establishmentAdvices: values.establishmentAdvices,
    beneficiaryAgreement: null,
    beneficiaryFeedback: null,
    signedAt: null,
    createdAt,
    ...toEndedWithAJobFields(values),
  };

  if (values.status === "PARTIALLY_COMPLETED")
    return {
      ...commonFields,
      status: "PARTIALLY_COMPLETED",
      lastDayOfPresence: getAssessmentEffectiveEndDate({
        lastDayOfPresence: values.partialCompletionDetails.lastDayOfPresence,
        conventionDateEnd: convention.dateEnd,
      }),
      numberOfMissedHours: toMissedHours(
        values.partialCompletionDetails.numberOfMissedHours,
        values.partialCompletionDetails.numberOfMissedMinutes,
      ),
    };

  return {
    ...commonFields,
    status: values.status,
  };
};

const toEndedWithAJobFields = (
  values: AssessmentFormValues,
):
  | { endedWithAJob: false }
  | {
      endedWithAJob: true;
      typeOfContract: TypeOfContract;
      contractStartDate: DateString;
    } => {
  if (
    values.endedWithAJob === true &&
    values.typeOfContract !== "" &&
    values.contractStartDate !== ""
  )
    return {
      endedWithAJob: true,
      typeOfContract: values.typeOfContract,
      contractStartDate: values.contractStartDate,
    };

  return { endedWithAJob: false };
};

export const computeTotalHours = ({
  convention,
  status,
  lastDayOfPresence,
  numberOfMissedHours,
}: {
  convention: ConventionDto;
  status: AssessmentStatus | null;
  lastDayOfPresence: DateString | undefined;
  numberOfMissedHours: number;
}): string =>
  match(status)

    .with("COMPLETED", () =>
      hoursValueToHoursDisplayed({
        hoursValue: convention.schedule.totalHours,
        padWithZero: false,
      }),
    )
    .with("PARTIALLY_COMPLETED", () =>
      hoursValueToHoursDisplayed({
        hoursValue:
          calculateTotalImmersionHoursBetweenDateComplex({
            complexSchedule: convention.schedule.complexSchedule,
            dateStart: convention.dateStart,
            dateEnd: lastDayOfPresence ?? convention.dateEnd,
          }) - numberOfMissedHours,
        padWithZero: false,
      }),
    )
    .with("DID_NOT_SHOW", () => hoursValueToHoursDisplayed({ hoursValue: 0 }))
    .with(null, () => hoursValueToHoursDisplayed({ hoursValue: 0 }))
    .exhaustive();

export const isAssessmentDto = (
  assessment: AssessmentDto | LegacyAssessmentDto,
): assessment is AssessmentDto =>
  assessment &&
  assessment.status !== "FINISHED" &&
  assessment.status !== "ABANDONED";

export const isAssessmentToSign = (
  assessment: ConventionAssessmentFields["assessment"],
): boolean => {
  if (assessment == null) return false;
  if (!("signedAt" in assessment)) return false;
  if (assessment.status === "DID_NOT_SHOW") return false;
  if (assessment.signedAt !== null) return false;
  if (isBeforeAssessmentSignatureReleaseDate(assessment.createdAt))
    return false;

  return true;
};
