import { isScheduleValid } from "shared/src/schedule/ScheduleUtils";
import { ScheduleDto } from "shared/src/schedule/Schedule.dto";

// Function that can be used as `validate` in Formik.
export const scheduleValidator = (schedule: ScheduleDto): string | undefined =>
  isScheduleValid(schedule);
