import { match } from "ts-pattern";
import { ConventionDto } from "../convention/convention.dto";
import { hoursValueToHoursDisplayed } from "../utils/date";
import { AssessmentStatus } from "./assessment.dto";

export const computeTotalHours = ({
  convention,
  missedHours,
  assessmentStatus,
}: {
  convention: ConventionDto;
  missedHours: number;
  assessmentStatus: AssessmentStatus;
}): string =>
  match(assessmentStatus)
    .with("COMPLETED", () =>
      hoursValueToHoursDisplayed({
        hoursValue: convention.schedule.totalHours,
        padWithZero: false,
      }),
    )
    .with("PARTIALLY_COMPLETED", () =>
      hoursValueToHoursDisplayed({
        hoursValue: convention.schedule.totalHours - missedHours,
        padWithZero: false,
      }),
    )
    .with("DID_NOT_SHOW", () => hoursValueToHoursDisplayed({ hoursValue: 0 }))
    .exhaustive();
