import { ScheduleDto } from "shared/src/schedule/ScheduleSchema";
import { isScheduleValid } from "shared/src/schedule/ScheduleUtils";

// Function that can be used as `validate` in Formik.
export const scheduleValidator = (schedule: ScheduleDto): string | undefined =>
  isScheduleValid(schedule);
