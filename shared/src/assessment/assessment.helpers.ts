import { match } from "ts-pattern";
import { ConventionDto } from "../convention/convention.dto";
import { calculateTotalImmersionHoursBetweenDateComplex } from "../schedule/ScheduleUtils";
import { hoursValueToHoursDisplayed } from "../utils/date";
import { FormAssessmentDto } from "./assessment.dto";

export const computeTotalHours = ({
  convention,
  assessment,
}: {
  convention: ConventionDto;
  assessment: FormAssessmentDto;
}): string =>
  match(assessment)

    .with({ status: "COMPLETED" }, () =>
      hoursValueToHoursDisplayed({
        hoursValue: convention.schedule.totalHours,
        padWithZero: false,
      }),
    )
    .with({ status: "PARTIALLY_COMPLETED" }, (formAssessment) =>
      hoursValueToHoursDisplayed({
        hoursValue:
          calculateTotalImmersionHoursBetweenDateComplex({
            complexSchedule: convention.schedule.complexSchedule,
            dateStart: convention.dateStart,
            dateEnd: formAssessment.lastDayOfPresence ?? convention.dateEnd,
          }) - formAssessment.numberOfMissedHours,
        padWithZero: false,
      }),
    )
    .with({ status: "DID_NOT_SHOW" }, () =>
      hoursValueToHoursDisplayed({ hoursValue: 0 }),
    )
    .with({ status: null }, () => hoursValueToHoursDisplayed({ hoursValue: 0 }))
    .exhaustive();
