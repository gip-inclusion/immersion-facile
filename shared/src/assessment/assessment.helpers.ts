import { match } from "ts-pattern";
import type {
  AssessmentCompletionStatusFilter,
  ConventionAssessmentFields,
  ConventionDto,
} from "../convention/convention.dto";
import { calculateTotalImmersionHoursBetweenDateComplex } from "../schedule/ScheduleUtils";
import { type DateString, hoursValueToHoursDisplayed } from "../utils/date";
import type {
  AssessmentDto,
  AssessmentStatus,
  LegacyAssessmentDto,
} from "./assessment.dto";

export const ASSESSEMENT_SIGNATURE_RELEASE_DATE = new Date("2026-03-10");

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

export const getAssessmentCompletionStatusFilter = (
  assessment: ConventionAssessmentFields["assessment"],
): AssessmentCompletionStatusFilter => {
  if (!assessment) return "to-be-completed";
  if ("signedAt" in assessment)
    return assessment.signedAt !== null || assessment.status === "DID_NOT_SHOW"
      ? "signed"
      : "to-sign";
  return "signed";
};

export const assessmentTextsByStatus: Record<
  AssessmentCompletionStatusFilter,
  { shortLabel: string; longLabel: string; description?: string }
> = {
  signed: {
    shortLabel: "signé",
    longLabel: "complété et signé",
    description:
      "La signature n'est requise que lorsque la personne en immersion s'est présentée.",
  },
  "to-sign": {
    shortLabel: "à signer",
    longLabel: "à signer par la personne en immersion",
    description:
      "Le bilan n'a pas encore été signé par la personne en immersion.",
  },
  "to-be-completed": {
    shortLabel: "à compléter",
    longLabel: "à compléter par le tuteur",
    description: "Le bilan n'a pas encore été complété par l'entreprise.",
  },
};
