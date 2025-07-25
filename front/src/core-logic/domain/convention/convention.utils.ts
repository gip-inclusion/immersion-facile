import { addDays, isAfter, isBefore } from "date-fns";
import type {
  AssessmentDto,
  ConventionReadDto,
  LegacyAssessmentDto,
} from "shared";

export const isConventionEndingInOneDayOrMore = (
  convention: ConventionReadDto,
) => isAfter(new Date(convention.dateEnd), addDays(new Date(), 1));

export const canAssessmentBeFilled = (
  convention: ConventionReadDto,
  assessment: AssessmentDto | LegacyAssessmentDto | null,
) =>
  convention.status === "ACCEPTED_BY_VALIDATOR" &&
  isBefore(new Date(convention.dateStart), new Date()) &&
  !assessment;
