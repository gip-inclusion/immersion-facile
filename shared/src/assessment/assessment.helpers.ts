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
      ? "completed-maybe-signed"
      : "to-sign";
  return "completed-maybe-signed";
};

export const makeAssessmentTextsByStatus = ({
  isPlural,
}: {
  isPlural: boolean;
}): Record<
  AssessmentCompletionStatusFilter,
  { shortLabel: string; longLabel: string; description?: string }
> => ({
  "completed-maybe-signed": {
    shortLabel: isPlural ? "Bilans signés" : "Bilan signé",
    longLabel: isPlural
      ? "Bilans complétés et signés"
      : "Bilan complété et signé",
    description:
      "La signature n'est requise que lorsque la personne en immersion s'est présentée.",
  },
  "to-sign": {
    shortLabel: isPlural ? "Bilans à signer" : "Bilan à signer",
    longLabel: isPlural
      ? "Bilans à signer par la personne en immersion"
      : "Bilan à signer par la personne en immersion",
    description:
      "Le bilan n'a pas encore été signé par la personne en immersion.",
  },
  "to-be-completed": {
    shortLabel: isPlural ? "Bilans à compléter" : "Bilan à compléter",
    longLabel: isPlural
      ? "Bilans à compléter par le tuteur"
      : "Bilan à compléter par le tuteur",
    description: "Le bilan n'a pas encore été complété par l'entreprise.",
  },
});
