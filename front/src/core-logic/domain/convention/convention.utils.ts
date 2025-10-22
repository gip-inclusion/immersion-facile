import { addDays, isAfter, isBefore } from "date-fns";
import type { ConventionReadDto } from "shared";

export const isConventionEndingInOneDayOrMore = (
  convention: ConventionReadDto,
) => isAfter(new Date(convention.dateEnd), addDays(new Date(), 1));

export const canAssessmentBeFilled = (convention: ConventionReadDto) =>
  convention.status === "ACCEPTED_BY_VALIDATOR" &&
  isBefore(new Date(convention.dateStart), new Date()) &&
  !convention.assessment;
