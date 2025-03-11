import { match } from "ts-pattern";
import type { ConventionDto } from "../convention/convention.dto";
import { calculateTotalImmersionHoursBetweenDateComplex } from "../schedule/ScheduleUtils";
import { type DateString, hoursValueToHoursDisplayed } from "../utils/date";
import type { AssessmentStatus } from "./assessment.dto";

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
